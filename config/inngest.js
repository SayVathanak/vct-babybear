import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Import the Product model
import axios from "axios";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "babybear-next" });

const FASTAPI_SERVICE_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

// --- EXISTING USER SYNC FUNCTIONS (UNCHANGED) ---
export const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = { _id: id, email: email_addresses[0].email_address, name: `${first_name} ${last_name}`, imageUrl: image_url }
        await connectDB();
        await User.create(userData);
    }
);
export const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = { _id: id, email: email_addresses[0].email_address, name: `${first_name} ${last_name}`, imageUrl: image_url }
        await connectDB();
        await User.findByIdAndUpdate(id, userData);
    }
);
export const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data;
        await connectDB();
        await User.findByIdAndDelete(id);
    }
);

// --- UPDATED ORDER CREATION FUNCTION ---
export const createUserOrder = inngest.createFunction(
    {
        id: 'create-user-order',
        batchEvents: { maxSize: 5, timeout: '5s' },
    },
    { event: 'order/created' },
    async ({ events, step }) => {
        await connectDB();

        const ordersToInsert = events.map(event => event.data);

        if (ordersToInsert.length > 0) {
            const result = await step.run("save-orders-to-db", async () => {
                return await Order.insertMany(ordersToInsert, { ordered: false });
            });
            console.log(`${result.length} orders successfully inserted via Inngest.`);

            // After saving orders, trigger inventory deduction for each order
            for (const order of result) {
                await step.sendEvent('send-inventory-deduction', {
                    name: "inventory/deduct",
                    data: { 
                        orderId: order._id,
                        items: order.items 
                    }
                });
            }
        }
        
        return { success: true, processed: ordersToInsert.length };
    }
);


// --- NEW: INGEST FUNCTION TO DEDUCT INVENTORY ---
export const deductInventory = inngest.createFunction(
    { id: 'deduct-inventory-on-order' },
    { event: 'inventory/deduct' },
    async ({ event, step }) => {
        await connectDB();
        const { orderId, items } = event.data;
        console.log(`Deducting inventory for order: ${orderId}`);

        for (const item of items) {
            await step.run(`deduct-product-${item.product}`, async () => {
                const updatedProduct = await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } },
                    { new: true } // Return the updated document
                );

                if (!updatedProduct) {
                    throw new Error(`Product with ID ${item.product} not found for inventory deduction.`);
                }
                
                // Low stock notification logic
                if (updatedProduct.stock <= 5 && updatedProduct.stock > 0) { // Example threshold: 5
                    console.warn(`LOW STOCK WARNING: ${updatedProduct.name} has only ${updatedProduct.stock} items left.`);
                    // Here you could send an email, a Slack message, or another Inngest event
                    // await step.sendEvent('notify-low-stock', { name: "notification/low-stock", data: { productId: updatedProduct._id, name: updatedProduct.name, stock: updatedProduct.stock } });
                } else if (updatedProduct.stock <= 0) {
                    console.error(`OUT OF STOCK ALERT: ${updatedProduct.name} is now out of stock.`);
                    // Mark product as unavailable
                    updatedProduct.isAvailable = false;
                    await updatedProduct.save();
                }

                return { productId: item.product, newStock: updatedProduct.stock };
            });
        }

        return { success: true, orderId };
    }
);

// --- NEW: INGEST FUNCTION TO RESTORE INVENTORY ON CANCELLATION ---
export const restoreInventory = inngest.createFunction(
    { id: 'restore-inventory-on-cancellation' },
    { event: 'order/cancelled' }, // Assuming you will send this event when an order is cancelled
    async ({ event, step }) => {
        await connectDB();
        const { orderId } = event.data;
        console.log(`Restoring inventory for cancelled order: ${orderId}`);

        const order = await step.run('find-cancelled-order', async () => {
            return await Order.findById(orderId).lean();
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found for inventory restoration.`);
        }
        
        if(order.status !== 'Cancelled'){
             console.log(`Order ${orderId} is not in 'Cancelled' state. Skipping inventory restore.`);
             return { success: false, message: "Order not cancelled." };
        }

        for (const item of order.items) {
            await step.run(`restore-product-${item.product}`, async () => {
                const updatedProduct = await Product.findByIdAndUpdate(
                    item.product,
                    { 
                        $inc: { stock: item.quantity },
                        $set: { isAvailable: true } // Always set back to available
                    },
                    { new: true }
                );
                return { productId: item.product, newStock: updatedProduct.stock };
            });
        }

        return { success: true, orderId };
    }
);

// --- EXISTING FUNCTIONS (MODIFIED/UNCHANGED) ---
export const handleItemStatusUpdated = inngest.createFunction(
    { id: 'handle-item-status-update' }, { event: 'order/item-status-updated' },
    async ({ event, step }) => { return { success: true, message: "Stub function" }; }
);

export const handleOrderStatusUpdated = inngest.createFunction(
    { id: 'handle-order-status-update' }, { event: 'order/status-updated' },
    async ({ event, step }) => {
        const { orderId, status } = event.data;

        // If the order is cancelled, trigger the inventory restoration.
        if (status === 'Cancelled') {
            await step.sendEvent('send-inventory-restoration', {
                name: "order/cancelled", // This will trigger the restoreInventory function
                data: { orderId }
            });
        }
        
        // ... your existing logic for other statuses
        return { success: true, message: `Order status updated to ${status}` };
    }
);

export const verifyBakongPayments = inngest.createFunction(
    { id: "verify-bakong-payments-cron" }, { cron: "*/5 * * * *" },
    async ({ step }) => {
      // Logic remains the same
    }
);
