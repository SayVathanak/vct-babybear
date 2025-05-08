import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "babybear-next" });

//  Inngest funcyion to save user data to a db
export const syncUserCreation = inngest.createFunction(
    {
        id: 'sync-user-from-clerk',
    },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl: image_url
        }
        await connectDB()
        await User.create(userData)
    }
);

// Inngest function to update user data in db
export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl: image_url
        }
        await connectDB()
        await User.findByIdAndUpdate(id, userData)
    }
)

// Inngest function to delete user from db
export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk'
    },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data

        await connectDB()
        await User.findByIdAndDelete(id)
    }
)

// Inngest function to create user's order in db
export const createUserOrder = inngest.createFunction(
    {
        id: 'create-user-order',
        batchEvents: {
            maxSize: 5,
            timeout: '5s'
        },
    },
    { event: 'order/created' },
    async ({ events }) => {

        const orders = events.map((event) => {
            return {
                userId: event.data.userId,
                items: event.data.items,
                subtotal: event.data.subtotal,
                deliveryFee: event.data.deliveryFee,
                discount: event.data.discount,
                promoCode: event.data.promoCode,
                amount: event.data.amount,
                address: event.data.address,
                date: event.data.date,
            };
        })

        await connectDB()
        await Order.insertMany(orders)

        return { success: true, processed: orders.length };

    }
)

// New function to handle item status updates
export const handleItemStatusUpdated = inngest.createFunction(
    {
        id: 'handle-item-status-update',
    },
    { event: 'order/item-status-updated' },
    async ({ event, step }) => {
        const { 
            orderId, 
            itemId, 
            productId, 
            productName, 
            previousStatus, 
            status, 
            updatedBy, 
            updatedAt 
        } = event.data;
        
        await connectDB();
        
        // Log the status change for audit purposes
        await step.run("Log status change", async () => {
            console.log(`Item ${itemId} in order ${orderId} updated from ${previousStatus} to ${status} by seller ${updatedBy}`);
            
            // You could store this in a dedicated audit log collection if needed
            // await StatusChangeLog.create({
            //     orderId,
            //     itemId,
            //     previousStatus,
            //     newStatus: status,
            //     updatedBy,
            //     updatedAt
            // });
        });
        
        // Handle status-specific actions
        if (previousStatus !== "shipped" && status === "shipped") {
            await step.run("Process shipping status", async () => {
                // Find the order to get customer information
                const order = await Order.findById(orderId);
                if (order) {
                    // Here you could:
                    // 1. Send shipping notification to customer
                    // 2. Update inventory systems
                    // 3. Notify fulfillment partners
                    
                    console.log(`Shipping notification would be sent to user ${order.userId} for product ${productName}`);
                }
            });
        }
        
        if (status === "cancelled") {
            await step.run("Handle cancellation", async () => {
                // Update inventory for cancelled items
                // Process refund if payment was already made
                console.log(`Order item ${itemId} cancelled - processing inventory return and possible refund`);
            });
        }
        
        return { 
            success: true, 
            message: `Successfully processed status update for item ${itemId} in order ${orderId}` 
        };
    }
)

// Function to handle overall order status changes
export const handleOrderStatusUpdated = inngest.createFunction(
    {
        id: 'handle-order-status-update',
    },
    { event: 'order/status-updated' },
    async ({ event, step }) => {
        const { 
            orderId, 
            previousStatus, 
            status, 
            updatedBy, 
            updatedAt 
        } = event.data;
        
        await connectDB();
        
        // Log overall order status change
        await step.run("Log order status change", async () => {
            console.log(`Order ${orderId} overall status updated from ${previousStatus} to ${status}`);
        });
        
        // Process complete order fulfillment when all items are delivered
        if (status === "delivered") {
            await step.run("Process complete order fulfillment", async () => {
                const order = await Order.findById(orderId);
                if (order) {
                    // Handle order completion actions:
                    // - Send customer satisfaction survey
                    // - Update sales analytics
                    // - Process seller payouts
                    
                    console.log(`Order ${orderId} for user ${order.userId} is now complete`);
                }
            });
        }
        
        return { 
            success: true, 
            message: `Successfully processed order status update for order ${orderId}` 
        };
    }
)