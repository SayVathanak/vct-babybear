import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product";
import axios from "axios";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "babybear-next" });

const FASTAPI_SERVICE_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

// SOLUTION 1: Add concurrency control and timeout
export const verifyBakongPayments = inngest.createFunction(
  { 
    id: "verify-bakong-payments-cron",
    // Prevent concurrent executions
    concurrency: { limit: 1 },
    // Set a reasonable timeout (5 minutes)
    timeout: "5m"
  },
  // Reduce frequency to every 5 minutes to avoid overlaps
  { cron: "*/5 * * * *" }, 
  async ({ step }) => {
    const startTime = Date.now();
    console.log(`[Inngest] Starting Bakong payment verification at ${new Date().toISOString()}`);
    
    try {
      await connectDB();

      const pendingOrders = await step.run("find-pending-bakong-orders", async () => {
        // Add a limit to prevent processing too many orders at once
        return await Order.find({
          paymentMethod: "Bakong",
          paymentStatus: "pending",
        })
        .limit(50) // Process max 50 orders per run
        .lean();
      });

      if (pendingOrders.length === 0) {
        console.log(`[Inngest] No pending Bakong orders found. Completed in ${Date.now() - startTime}ms`);
        return { message: "No pending Bakong orders to check.", processedCount: 0 };
      }
      
      console.log(`[Inngest] Found ${pendingOrders.length} pending Bakong orders to process`);
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      let processedCount = 0;
      let cancelledCount = 0;
      let paidCount = 0;

      // Process orders in smaller batches to avoid timeout
      const batchSize = 10;
      for (let i = 0; i < pendingOrders.length; i += batchSize) {
        const batch = pendingOrders.slice(i, i + batchSize);
        
        await step.run(`process-batch-${i}-to-${i + batch.length - 1}`, async () => {
          const batchPromises = batch.map(async (order) => {
            processedCount++;
            
            // Check if the order is older than 10 minutes
            if (new Date(order.date).getTime() < tenMinutesAgo) {
              console.log(`[Inngest] Bakong order ${order._id} is older than 10 minutes. Cancelling.`);
              
              // Update order status to Failed/Cancelled
              await Order.findByIdAndUpdate(order._id, {
                status: 'Cancelled',
                paymentStatus: 'failed',
              });
              
              // Send event to restore inventory (fire and forget to avoid blocking)
              try {
                await inngest.send({
                  name: "order/cancelled",
                  data: { orderId: order._id }
                });
              } catch (eventError) {
                console.error(`[Inngest] Failed to send cancellation event for order ${order._id}:`, eventError);
              }

              cancelledCount++;
              return { orderId: order._id, status: 'cancelled_expired' };
            } else {
              // Order is still within the 10-minute window. Check for payment.
              const md5Hash = order.bakongPaymentDetails?.md5;

              if (!md5Hash) {
                return { orderId: order._id, status: "skipped", reason: "Missing MD5 hash" };
              }

              try {
                const response = await axios.post(
                  `${FASTAPI_SERVICE_URL}/api/v1/check-payment-status`,
                  { md5_hash: md5Hash },
                  { timeout: 10000 } // 10 second timeout for each API call
                );

                if (response.data.is_paid) {
                  await Order.updateOne(
                    { _id: order._id }, 
                    { $set: { paymentStatus: "paid" } }
                  );
                  paidCount++;
                  return { orderId: order._id, status: "updated_to_paid" };
                } else {
                  return { orderId: order._id, status: "still_unpaid" };
                }
              } catch (error) {
                console.error(`[Inngest] Failed to verify payment for order ${order._id}:`, error.response?.data || error.message);
                return { orderId: order._id, status: "error", error: error.message };
              }
            }
          });

          // Wait for all orders in this batch to complete
          return await Promise.allSettled(batchPromises);
        });
      }
      
      const duration = Date.now() - startTime;
      const summary = {
        message: `Processed ${processedCount} pending Bakong orders in ${duration}ms`,
        processedCount,
        cancelledCount,
        paidCount,
        duration
      };
      
      console.log(`[Inngest] Bakong verification completed:`, summary);
      return summary;
      
    } catch (error) {
      console.error(`[Inngest] Error in Bakong payment verification:`, error);
      throw error; // Let Inngest handle the retry
    }
  }
);

// ALTERNATIVE SOLUTION 2: Use a different approach with manual execution control
export const verifyBakongPaymentsManual = inngest.createFunction(
  { 
    id: "verify-bakong-payments-manual",
    concurrency: { limit: 1 }
  },
  { event: "bakong/verify-payments" }, // Trigger manually instead of cron
  async ({ step }) => {
    // Same logic as above but triggered by events instead of cron
    // This gives you more control over when the function runs
  }
);

// Helper function to trigger manual verification (call this from your API routes)
export const triggerBakongVerification = async () => {
  try {
    await inngest.send({
      name: "bakong/verify-payments",
      data: { triggeredAt: new Date().toISOString() }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to trigger Bakong verification:", error);
    return { success: false, error: error.message };
  }
};

// SOLUTION 3: Debounced cron with state checking
let isVerificationRunning = false;

export const verifyBakongPaymentsDebounced = inngest.createFunction(
  { 
    id: "verify-bakong-payments-debounced",
    concurrency: { limit: 1 }
  },
  { cron: "*/2 * * * *" },
  async ({ step }) => {
    // Quick exit if already running (though concurrency limit should prevent this)
    if (isVerificationRunning) {
      console.log(`[Inngest] Bakong verification already running, skipping`);
      return { message: "Verification already in progress, skipping" };
    }
    
    isVerificationRunning = true;
    
    try {
      // Your existing logic here
      await connectDB();
      
      const pendingOrders = await step.run("find-pending-bakong-orders", async () => {
        return await Order.find({
          paymentMethod: "Bakong",
          paymentStatus: "pending",
        }).limit(20).lean(); // Smaller batch size
      });

      if (pendingOrders.length === 0) {
        return { message: "No pending Bakong orders to check." };
      }
      
      // Process orders quickly without complex nested steps
      const results = await Promise.allSettled(
        pendingOrders.map(async (order) => {
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
          
          if (new Date(order.date).getTime() < tenMinutesAgo) {
            // Cancel expired order
            await Order.findByIdAndUpdate(order._id, {
              status: 'Cancelled',
              paymentStatus: 'failed',
            });
            
            // Fire and forget inventory restoration
            inngest.send({
              name: "order/cancelled",
              data: { orderId: order._id }
            }).catch(console.error);
            
            return { orderId: order._id, status: 'cancelled' };
          } else if (order.bakongPaymentDetails?.md5) {
            // Check payment status
            try {
              const response = await axios.post(
                `${FASTAPI_SERVICE_URL}/api/v1/check-payment-status`,
                { md5_hash: order.bakongPaymentDetails.md5 },
                { timeout: 5000 }
              );
              
              if (response.data.is_paid) {
                await Order.updateOne(
                  { _id: order._id }, 
                  { $set: { paymentStatus: "paid" } }
                );
                return { orderId: order._id, status: 'paid' };
              }
            } catch (error) {
              console.error(`Payment check failed for ${order._id}:`, error.message);
            }
          }
          
          return { orderId: order._id, status: 'unchanged' };
        })
      );
      
      return { 
        message: `Processed ${pendingOrders.length} orders`,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
      };
      
    } finally {
      isVerificationRunning = false;
    }
  }
);