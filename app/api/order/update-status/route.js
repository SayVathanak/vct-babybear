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

        // --- MODIFICATION ---
        // Find the order and populate both the items.product AND the address.
        // This ensures the full address object is returned to the frontend.
        const order = await Order.findById(orderId)
            .populate({ path: 'items.product', select: 'name price image' }) 
            .populate('address') // <-- This is the added line
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
                if (order.status === 'Order Placed' || order.status === 'pending_payment') {
                    order.status = 'processing'; 
                }
            } else if (paymentConfirmationAction === 'reject') {
                order.paymentConfirmationStatus = 'rejected';
                order.paymentStatus = 'failed';
                order.status = 'payment rejected'; 
            }
            
            await order.save({ session });
            await session.commitTransaction();
            session.endSession();

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
                order // The 'order' object here now includes the populated address
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

        const updatedItemsInfo = [];
        let itemsActuallyUpdatedCount = 0;

        order.items.forEach(item => {
            if (itemIds.includes(item._id.toString())) {
                if (item.status !== newItemStatus.toLowerCase()) {
                    const previousItemStatus = item.status;
                    item.status = newItemStatus.toLowerCase();
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

        const statusCounts = {};
        let allItemsCancelled = true;
        let allItemsDelivered = true;

        order.items.forEach(item => {
            const currentItemStatus = item.status || 'pending';
            statusCounts[currentItemStatus] = (statusCounts[currentItemStatus] || 0) + 1;
            if (currentItemStatus !== 'cancelled') allItemsCancelled = false;
            if (currentItemStatus !== 'delivered') allItemsDelivered = false;
        });

        const previousOrderStatus = order.status;
        let newOverallStatus = order.status;

        if (allItemsCancelled) {
            newOverallStatus = 'cancelled';
        } else if (allItemsDelivered) {
            newOverallStatus = 'delivered';
            if(order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
                order.paymentConfirmationStatus = 'confirmed';
            }
        } else if (statusCounts['out for delivery'] > 0) {
            newOverallStatus = 'out for delivery';
        } else if (statusCounts['processing'] > 0) {
            newOverallStatus = 'processing';
        } else if (statusCounts['pending'] === order.items.length) {
             newOverallStatus = 'pending';
        }

        if (newOverallStatus !== order.status) {
            order.status = newOverallStatus;
        }
        
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();

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

        if (newOverallStatus !== previousOrderStatus) {
            await inngest.send({
                name: 'order/status-updated',
                data: {
                    orderId: order._id.toString(),
                    previousStatus: previousOrderStatus,
                    newStatus: newOverallStatus,
                    paymentStatus: order.paymentStatus,
                    updatedBy: userId,
                    updatedAt: Date.now()
                }
            });
        }
        
        return NextResponse.json({
            success: true,
            message: 'Order items status updated successfully',
            order // This 'order' object now includes the populated address
        });

    } catch (error) {
        console.error("Error in update-status API:", error);
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
    }
}
