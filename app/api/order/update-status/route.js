import { inngest } from "@/config/inngest";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Needed for populating product name if sending notifications
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";


export async function PUT(request) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        const { orderId, status: newItemStatus, itemIds = [], paymentConfirmationAction } = payload;

        if (!orderId) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
        }

        const order = await Order.findById(orderId)
            .populate({ path: 'items.product', select: 'name price image' }) // Keep populate for item updates
            .session(session);

        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        // --- Handle ABA Payment Confirmation ---
        if (paymentConfirmationAction) {
            if (order.paymentMethod !== 'ABA') {
                await session.abortTransaction();
                session.endSession();
                return NextResponse.json({ success: false, message: "Payment confirmation is only for ABA orders." }, { status: 400 });
            }

            const validActions = ['confirm', 'reject'];
            if (!validActions.includes(paymentConfirmationAction)) {
                await session.abortTransaction();
                session.endSession();
                return NextResponse.json({ success: false, message: "Invalid payment confirmation action." }, { status: 400 });
            }

            if (paymentConfirmationAction === 'confirm') {
                order.paymentConfirmationStatus = 'confirmed';
                order.paymentStatus = 'paid';
                // Optionally, update overall order status if it was pending payment
                if (order.status === 'Order Placed' || order.status === 'pending_payment') { // Assuming 'pending_payment' could be a status
                    order.status = 'processing'; // Or your desired status after payment confirmation
                }
            } else if (paymentConfirmationAction === 'reject') {
                order.paymentConfirmationStatus = 'rejected';
                order.paymentStatus = 'failed'; // Or 'pending' if you want them to retry
                order.status = 'payment rejected'; // A specific status to indicate this
            }
            
            // Add history/log for payment confirmation action
            // order.statusHistory.push({ status: `Payment ${paymentConfirmationAction}ed`, date: Date.now(), updatedBy: userId });

            await order.save({ session });
            await session.commitTransaction();
            session.endSession();

            // Send Inngest event for payment confirmation
            await inngest.send({
                name: 'order/payment-confirmation-updated',
                data: {
                    orderId: order._id.toString(),
                    paymentMethod: order.paymentMethod,
                    paymentConfirmationStatus: order.paymentConfirmationStatus,
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.status,
                    confirmedBy: userId,
                    confirmedAt: Date.now()
                }
            });

            return NextResponse.json({
                success: true,
                message: `Payment ${paymentConfirmationAction}ed successfully.`,
                order // Send back the updated order
            });
        }

        // --- Handle Item Status Updates (existing logic) ---
        if (!newItemStatus || itemIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({
                success: false,
                message: "For item updates, new status and at least one item ID are required."
            }, { status: 400 });
        }

        const validItemStatuses = ['pending', 'processing', 'out for delivery', 'delivered', 'cancelled'];
        if (!validItemStatuses.includes(newItemStatus.toLowerCase())) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ success: false, message: "Invalid item status value" }, { status: 400 });
        }

        const updatedItemsInfo = []; // For Inngest events
        let itemsActuallyUpdatedCount = 0;

        order.items.forEach(item => {
            if (itemIds.includes(item._id.toString())) {
                if (item.status !== newItemStatus.toLowerCase()) { // Check if status is actually changing
                    const previousItemStatus = item.status;
                    item.status = newItemStatus.toLowerCase(); // Assuming item schema has 'status' field
                    itemsActuallyUpdatedCount++;
                    updatedItemsInfo.push({
                        itemId: item._id.toString(),
                        productId: item.product?._id?.toString() || 'N/A',
                        productName: item.product?.name || 'N/A',
                        previousStatus: previousItemStatus,
                        newStatus: item.status
                    });
                }
            }
        });
        
        if (itemsActuallyUpdatedCount === 0) {
             await session.abortTransaction();
             session.endSession();
             return NextResponse.json({ success: false, message: "No items required a status update." }, { status: 200 });
        }


        // Recalculate overall order status based on item statuses
        const statusCounts = {};
        let allItemsCancelled = true;
        let allItemsDelivered = true;

        order.items.forEach(item => {
            const currentItemStatus = item.status || 'pending'; // Default to pending if no status
            statusCounts[currentItemStatus] = (statusCounts[currentItemStatus] || 0) + 1;
            if (currentItemStatus !== 'cancelled') allItemsCancelled = false;
            if (currentItemStatus !== 'delivered') allItemsDelivered = false;
        });

        const previousOrderStatus = order.status;
        let newOverallStatus = order.status; // Default to current

        if (allItemsCancelled) {
            newOverallStatus = 'cancelled';
        } else if (allItemsDelivered) {
            newOverallStatus = 'delivered';
            if(order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') { // For COD, mark as paid on delivery
                order.paymentStatus = 'paid';
                order.paymentConfirmationStatus = 'confirmed'; // or 'na' if COD doesn't need this
            }
        } else if (statusCounts['out for delivery'] > 0) {
            newOverallStatus = 'out for delivery';
        } else if (statusCounts['processing'] > 0) {
            newOverallStatus = 'processing';
        } else if (statusCounts['pending'] === order.items.length) {
             newOverallStatus = 'pending'; // Or 'Order Placed' if that's preferred for all pending
        }
        // Add more sophisticated logic if needed, e.g., if some items are cancelled and others processed.

        if (newOverallStatus !== order.status) {
            order.status = newOverallStatus;
        }
        
        // order.statusHistory.push({ status: `Items updated, overall status: ${order.status}`, date: Date.now(), updatedBy: userId });


        await order.save({ session });
        await session.commitTransaction();
        session.endSession();

        // Send Inngest events for each updated item
        for (const itemInfo of updatedItemsInfo) {
            await inngest.send({
                name: 'order/item-status-updated',
                data: {
                    orderId: order._id.toString(),
                    ...itemInfo,
                    updatedBy: userId,
                    updatedAt: Date.now()
                }
            });
        }

        // Send Inngest event if overall order status changed
        if (newOverallStatus !== previousOrderStatus) {
            await inngest.send({
                name: 'order/status-updated',
                data: {
                    orderId: order._id.toString(),
                    previousStatus: previousOrderStatus,
                    newStatus: newOverallStatus,
                    paymentStatus: order.paymentStatus, // include payment status
                    updatedBy: userId,
                    updatedAt: Date.now()
                }
            });
        }
        
        return NextResponse.json({
            success: true,
            message: 'Order items status updated successfully',
            order // Send back the updated order
        });

    } catch (error) {
        console.error("Error in update-status API:", error);
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
    }
}
