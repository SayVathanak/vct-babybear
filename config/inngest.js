import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Ensure Product model is imported
import axios from "axios";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "babybear-next" });

// The URL of your running Python FastAPI service
// IMPORTANT: Add this to your .env.local file
const FASTAPI_SERVICE_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";


// --- USER SYNC FUNCTIONS ---

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


// --- PAYMENT VERIFICATION FUNCTIONS ---

// FUNCTION TO VERIFY BAKONG PAYMENTS
export const verifyBakongPayments = inngest.createFunction(
  { id: "verify-bakong-payments-cron" },
  { cron: "*/5 * * * *" }, // Runs every 5 minutes.
  async ({ step }) => {
    await connectDB();

    const pendingOrders = await step.run("find-pending-bakong-orders", async () => {
      return await Order.find({
        paymentMethod: "Bakong",
        paymentStatus: "pending",
      }).lean();
    });

    if (pendingOrders.length === 0) {
      return { message: "No pending Bakong orders to check." };
    }

    const verificationTasks = pendingOrders.map((order) => {
      return step.run(`verify-order-${order._id}`, async () => {
        const md5Hash = order.bakongPaymentDetails?.md5;

        if (!md5Hash) {
          return { orderId: order._id, status: "skipped", reason: "Missing MD5 hash" };
        }

        try {
          const response = await axios.post(`${FASTAPI_SERVICE_URL}/api/v1/check-payment-status`, {
            md5_hash: md5Hash,
          });

          if (response.data.is_paid) {
            await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: "paid" } });
            return { orderId: order._id, status: "updated_to_paid" };
          } else {
            return { orderId: order._id, status: "still_unpaid" };
          }
        } catch (error) {
          console.error(`Failed to verify payment for order ${order._id}:`, error.response?.data || error.message);
          return { orderId: order._id, status: "error", error: error.message };
        }
      });
    });
    
    const results = await Promise.all(verificationTasks);
    return { message: `Checked ${pendingOrders.length} orders.`, results };
  }
);
