import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import axios from "axios";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "babybear-next" });

// The URL of your running Python FastAPI service
// IMPORTANT: Add this to your .env.local file
const FASTAPI_SERVICE_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";


// Inngest function to save user data to a db
export const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
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
    { id: 'update-user-from-clerk' },
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
    { id: 'delete-user-with-clerk' },
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
    async ({ events, step }) => {
        const ordersToInsert = events.map((singleEvent) => {
            const eventData = singleEvent.data;
            // CRITICAL: Ensure bakongPaymentDetails is passed to the DB
            return {
                userId: eventData.userId,
                items: eventData.items,
                subtotal: eventData.subtotal,
                deliveryFee: eventData.deliveryFee,
                discount: eventData.discount,
                promoCode: eventData.promoCode,
                amount: eventData.amount,
                address: eventData.address,
                date: eventData.date,
                status: eventData.status || 'Order Placed',
                paymentMethod: eventData.paymentMethod,
                paymentTransactionImage: eventData.paymentTransactionImage,
                paymentStatus: eventData.paymentStatus,
                paymentConfirmationStatus: eventData.paymentConfirmationStatus,
                bakongPaymentDetails: eventData.bakongPaymentDetails, // This line is crucial
            };
        });

        if (ordersToInsert.length > 0) {
            await step.run("save-orders-to-db", async () => {
                await connectDB();
                const result = await Order.insertMany(ordersToInsert);
                console.log(`${result.length} orders successfully inserted via Inngest.`);
                return { insertedCount: result.length };
            });
        } else {
            console.log("No orders to insert in this Inngest batch.");
        }
        return { success: true, processed: ordersToInsert.length };
    }
);

// Function to handle item status updates
export const handleItemStatusUpdated = inngest.createFunction(
    {
        id: 'handle-item-status-update',
    },
    { event: 'order/item-status-updated' },
    async ({ event, step }) => {
        // ... your existing logic
        return { success: true, message: "Stub function" };
    }
);

// Function to handle overall order status changes
export const handleOrderStatusUpdated = inngest.createFunction(
    {
        id: 'handle-order-status-update',
    },
    { event: 'order/status-updated' },
    async ({ event, step }) => {
        // ... your existing logic
        return { success: true, message: "Stub function" };
    }
);

// --- NEW FUNCTION TO VERIFY BAKONG PAYMENTS ---
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
