import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Ensure Product model is imported
import axios from "axios";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "babybear-next" });

// const FASTAPI_SERVICE_URL = process.env.FASTAPI_URL
//   ? `https://${process.env.FASTAPI_URL}`
//   : "http://127.0.0.1:8000";

// Inngest function to save user data to a db
export const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            imageUrl: image_url
        }
        await connectDB();
        await User.create(userData);
    }
);

// Inngest function to update user data in db
export const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            imageUrl: image_url
        }
        await connectDB();
        await User.findByIdAndUpdate(id, userData);
    }
);

// Inngest function to delete user from db
export const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data;
        if (!id) {
            // Clerk sometimes sends events with a null ID during deletion.
            console.warn("[Inngest] Received user.deleted event with null ID. Skipping.");
            return;
        }
        await connectDB();
        await User.findByIdAndDelete(id);
    }
);

// --- ORDER & INVENTORY FUNCTIONS ---

// CORRECTED ORDER CREATION FUNCTION
export const createUserOrder = inngest.createFunction(
    { id: 'create-user-order' }, // No batching configuration
    { event: 'order/created' },
    async ({ event, step }) => {
        await connectDB();
        const orderData = event.data;
        console.log(`[Inngest] Received order/created event for user: ${orderData.userId}`);

        // 1. Save the order to the database
        const savedOrder = await step.run("save-order-to-db", async () => {
            return await Order.create(orderData);
        });

        // 2. If order was saved, trigger the inventory deduction
        if (savedOrder && savedOrder._id) {
            console.log(`[Inngest] Order ${savedOrder._id} saved. Triggering inventory deduction.`);
            await step.sendEvent('send-inventory-deduction-event', {
                name: "inventory/deduct",
                data: { orderId: savedOrder._id, items: orderData.items }
            });
        } else {
            throw new Error("Failed to save order to database.");
        }
        return { success: true, processedOrderId: savedOrder._id };
    }
);

// REVISED INVENTORY DEDUCTION FUNCTION WITH BETTER LOGGING
export const deductInventory = inngest.createFunction(
    { id: 'deduct-inventory-on-order' },
    { event: 'inventory/deduct' },
    async ({ event, step }) => {
        await connectDB();
        const { orderId, items } = event.data;
        console.log(`[Inngest] Starting inventory deduction for Order ID: ${orderId}`);

        if (!items || items.length === 0) {
            console.warn(`[Inngest] No items found for Order ID: ${orderId}. Skipping deduction.`);
            return { success: false, message: "No items to deduct." };
        }

        for (const item of items) {
            await step.run(`deduct-stock-for-product-${item.product}`, async () => {
                console.log(`[Inngest] Attempting to deduct ${item.quantity} of Product ID: ${item.product}`);
                const product = await Product.findById(item.product);
                if (!product) {
                    throw new Error(`Product with ID ${item.product} not found during deduction for Order ${orderId}.`);
                }

                const updatedProduct = await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );

                if (!updatedProduct) {
                    throw new Error(`Failed to update stock for Product ID: ${item.product}.`);
                }

                console.log(`[Inngest] Successfully updated stock for Product ID ${updatedProduct._id}. New stock: ${updatedProduct.stock}`);

                if (updatedProduct.stock <= 5 && updatedProduct.stock > 0) {
                    console.warn(`[Inngest] LOW STOCK WARNING: ${updatedProduct.name} has only ${updatedProduct.stock} items left.`);
                } else if (updatedProduct.stock <= 0) {
                    console.log(`[Inngest] OUT OF STOCK: ${updatedProduct.name} is now out of stock. Setting isAvailable to false.`);
                    await Product.findByIdAndUpdate(updatedProduct._id, { isAvailable: false });
                }

                return { productId: item.product, newStock: updatedProduct.stock };
            });
        }

        console.log(`[Inngest] Inventory deduction completed for Order ID: ${orderId}`);
        return { success: true, orderId };
    }
);

// REVISED INVENTORY RESTORATION FUNCTION WITH BETTER LOGGING
export const restoreInventory = inngest.createFunction(
    { id: 'restore-inventory-on-cancellation' },
    { event: 'order/cancelled' },
    async ({ event, step }) => {
        await connectDB();
        const { orderId } = event.data;
        console.log(`[Inngest] Starting inventory restoration for cancelled Order ID: ${orderId}`);

        const order = await step.run('find-cancelled-order', async () => {
            return await Order.findById(orderId).lean();
        });

        if (!order) {
            console.error(`[Inngest] Order ${orderId} not found for inventory restoration.`);
            return { success: false, message: `Order ${orderId} not found.` };
        }

        if (order.status !== 'Cancelled') {
            console.warn(`[Inngest] Order ${orderId} is not in 'Cancelled' state. Skipping inventory restore.`);
            return { success: false, message: "Order not in 'Cancelled' state." };
        }

        for (const item of order.items) {
            await step.run(`restore-stock-for-product-${item.product}`, async () => {
                console.log(`[Inngest] Restoring ${item.quantity} of Product ID: ${item.product}`);
                const updatedProduct = await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity }, $set: { isAvailable: true } },
                    { new: true }
                );

                if (!updatedProduct) {
                    console.error(`[Inngest] Failed to find Product ID: ${item.product} to restore stock.`);
                    return { productId: item.product, status: 'failed_product_not_found' };
                }

                console.log(`[Inngest] Successfully restored stock for Product ID ${item.product}. New stock: ${updatedProduct.stock}`);
                return { productId: item.product, newStock: updatedProduct.stock };
            });
        }

        console.log(`[Inngest] Inventory restoration completed for Order ID: ${orderId}`);
        return { success: true, orderId };
    }
);


// --- OTHER ORDER STATUS FUNCTIONS ---

// Function to handle item status updates
export const handleItemStatusUpdated = inngest.createFunction(
    { id: 'handle-item-status-update' },
    { event: 'order/item-status-updated' },
    async ({ event, step }) => {
        await connectDB();
        const { orderId, itemId, status } = event.data;
        console.log(`[Inngest] Updating item status for Order ID: ${orderId}, Item ID: ${itemId} to ${status}`);

        const order = await step.run("find-order-for-item-update", async () => {
            return await Order.findOne({ "items._id": itemId });
        });

        if (!order) {
            throw new Error(`Order containing item ID ${itemId} not found.`);
        }

        const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);

        if (itemIndex === -1) {
            throw new Error(`Item with ID ${itemId} not found within Order ${order._id}.`);
        }

        order.items[itemIndex].status = status;

        await step.run("save-updated-item-status", async () => {
            await order.save();
        });

        console.log(`[Inngest] Successfully updated status for item ${itemId} in order ${orderId}.`);
        return { success: true, orderId, itemId, status };
    }
);

// Function to handle overall order status changes
export const handleOrderStatusUpdated = inngest.createFunction(
    { id: 'handle-order-status-update' },
    { event: 'order/status-updated' },
    async ({ event, step }) => {
        const { orderId, status } = event.data;

        if (status === 'Cancelled') {
            await step.sendEvent('send-inventory-restoration-on-cancellation', {
                name: "order/cancelled",
                data: { orderId }
            });
        }

        await connectDB();
        await Order.findByIdAndUpdate(orderId, { status: status });

        return { success: true, message: `Order status updated to ${status}` };
    }
);

export const verifyBakongPayments = inngest.createFunction(
    { id: "verify-bakong-payments-cron" },
    // Run every 2 minutes to promptly handle 10-minute timeouts
    { cron: "*/2 * * * *" },
    async ({ step }) => {
        console.log('[Inngest] Starting Bakong payment verification cron job');

        await connectDB();

        // Just add this validation to your existing verifyBakongPayments
        const pendingOrders = await step.run("find-pending-bakong-orders", async () => {
            const orders = await Order.find({
                paymentMethod: "Bakong",
                paymentStatus: "pending",
                bakongPaymentDetails: { $exists: true, $ne: null } // This prevents the infinite loop
            }).lean();
            return orders;
        });

        if (pendingOrders.length === 0) {
            console.log('[Inngest] No pending Bakong orders to check');
            return {
                success: true,
                message: "No pending Bakong orders to check.",
                processedOrders: 0,
                expiredOrders: 0,
                paidOrders: 0,
                errors: 0
            };
        }

        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        const results = {
            processedOrders: 0,
            expiredOrders: 0,
            paidOrders: 0,
            errors: 0,
            details: []
        };

        // Process orders in batches to avoid overwhelming the system
        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            const orderAge = Date.now() - new Date(order.date).getTime();

            try {
                // Check if the order is older than 10 minutes
                if (new Date(order.date).getTime() < tenMinutesAgo) {
                    // Order has expired. Cancel it.
                    const cancelResult = await step.run(`cancel-expired-order-${order._id}`, async () => {
                        console.log(`[Inngest] Bakong order ${order._id} is older than 10 minutes (${Math.round(orderAge / 1000 / 60)}min). Cancelling.`);

                        try {
                            // Update order status to Cancelled
                            await Order.findByIdAndUpdate(order._id, {
                                status: 'Cancelled',
                                paymentStatus: 'failed',
                                updatedAt: new Date()
                            });

                            console.log(`[Inngest] Successfully cancelled expired order ${order._id}`);
                            return { success: true, orderId: order._id, action: 'cancelled_expired' };
                        } catch (error) {
                            console.error(`[Inngest] Error cancelling order ${order._id}:`, error);
                            return { success: false, orderId: order._id, error: error.message };
                        }
                    });

                    if (cancelResult.success) {
                        // Send event to restore inventory - but don't await it to prevent blocking
                        try {
                            await step.sendEvent('send-inventory-restoration-for-expired-order', {
                                name: "order/cancelled",
                                data: { orderId: order._id }
                            });
                            console.log(`[Inngest] Sent inventory restoration event for order ${order._id}`);
                        } catch (eventError) {
                            console.error(`[Inngest] Failed to send inventory restoration event for order ${order._id}:`, eventError);
                        }

                        results.expiredOrders++;
                    } else {
                        results.errors++;
                    }

                    results.details.push({
                        orderId: order._id,
                        action: 'expired',
                        success: cancelResult.success
                    });
                } else {
                    // Order is still within the 10-minute window. Check for payment.
                    const paymentResult = await step.run(`verify-payment-for-order-${order._id}`, async () => {
                        const md5Hash = order.bakongPaymentDetails?.md5;

                        if (!md5Hash) {
                            console.warn(`[Inngest] Order ${order._id} missing MD5 hash - skipping payment check`);
                            return { success: false, orderId: order._id, status: "skipped", reason: "Missing MD5 hash" };
                        }

                        try {
                            console.log(`[Inngest] Checking payment status for order ${order._id} (age: ${Math.round(orderAge / 1000)}s)`);

                            // Add timeout to prevent hanging requests
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                            const response = await axios.post(`/api/bakong/check-payment-status`, {
                                md5_hash: md5Hash,
                            }, {
                                timeout: 10000, // 10 second timeout
                                signal: controller.signal
                            });


                            clearTimeout(timeoutId);

                            if (response.data.is_paid) {
                                await Order.findByIdAndUpdate(order._id, {
                                    paymentStatus: "paid",
                                    updatedAt: new Date()
                                });
                                console.log(`[Inngest] Payment confirmed for order ${order._id}`);
                                return { success: true, orderId: order._id, status: "updated_to_paid" };
                            } else {
                                console.log(`[Inngest] Order ${order._id} still unpaid`);
                                return { success: true, orderId: order._id, status: "still_unpaid" };
                            }
                        } catch (error) {
                            if (error.name === 'AbortError') {
                                console.error(`[Inngest] Payment check timeout for order ${order._id}`);
                                return { success: false, orderId: order._id, status: "timeout", error: "Request timeout" };
                            }

                            console.error(`[Inngest] Failed to verify payment for order ${order._id}:`, error.response?.data || error.message);
                            return { success: false, orderId: order._id, status: "error", error: error.message };
                        }
                    });

                    if (paymentResult.success && paymentResult.status === "updated_to_paid") {
                        results.paidOrders++;
                    } else if (!paymentResult.success) {
                        results.errors++;
                    }

                    results.details.push({
                        orderId: order._id,
                        action: 'payment_check',
                        status: paymentResult.status,
                        success: paymentResult.success
                    });
                }

                results.processedOrders++;
            } catch (stepError) {
                console.error(`[Inngest] Unexpected error processing order ${order._id}:`, stepError);
                results.errors++;
                results.processedOrders++;
                results.details.push({
                    orderId: order._id,
                    action: 'error',
                    success: false,
                    error: stepError.message
                });
            }
        }

        console.log(`[Inngest] Bakong verification completed. Processed: ${results.processedOrders}, Expired: ${results.expiredOrders}, Paid: ${results.paidOrders}, Errors: ${results.errors}`);

        return {
            success: true,
            message: `Processed ${results.processedOrders} pending Bakong orders.`,
            ...results
        };
    }
);

export const checkFastApiHealth = inngest.createFunction(
    { id: "check-fastapi-health" },
    { cron: "*/5 * * * *" }, // Check every 5 minutes
    async ({ step }) => {
        const healthCheck = await step.run("ping-fastapi-service", async () => {
            try {
                const response = await axios.get(`/api/health`, {
                    timeout: 5000
                });

                if (response.status === 200) {
                    console.log('[Inngest] FastAPI service is healthy');
                    return { status: 'healthy', response: response.data };
                } else {
                    console.warn(`[Inngest] FastAPI service returned unexpected status: ${response.status}`);
                    return { status: 'unhealthy', statusCode: response.status };
                }
            } catch (error) {
                console.error('[Inngest] FastAPI service health check failed:', error.message);
                return { status: 'error', error: error.message };
            }
        });

        return healthCheck;
    }
);
