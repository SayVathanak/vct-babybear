import { inngest } from "@/config/inngest";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import authSeller from "@/lib/authSeller";

export async function PUT(request) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId } = getAuth(request);

        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { orderId, status, itemIds = [] } = await request.json();

        if (!orderId || !status || itemIds.length === 0) {
            return NextResponse.json({
                success: false,
                message: "Order ID, status, and at least one item ID are required"
            }, { status: 400 });
        }

        const validStatuses = ['pending', 'processing', 'out for delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return NextResponse.json({
                success: false,
                message: "Invalid status value"
            }, { status: 400 });
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'items.product',
                select: 'name price image'
            })
            .session(session);

        if (!order) {
            await session.abortTransaction();
            await session.endSession();
            return NextResponse.json({
                success: false,
                message: "Order not found"
            }, { status: 404 });
        }

        const updatedItems = [];
        for (const itemId of itemIds) {
            const item = order.items.find(i => i._id.toString() === itemId);

            if (item) {
                if (item.status !== status.toLowerCase()) {
                    const itemIndex = order.items.findIndex(i => i._id.toString() === itemId);
                    if (itemIndex !== -1) {
                        order.items[itemIndex].status = status.toLowerCase();
                        updatedItems.push({
                            itemId: item._id,
                            productId: item.product._id,
                            productName: item.product.name,
                            previousStatus: item.status,
                            newStatus: status.toLowerCase()
                        });
                    }
                }
            }
        }

        if (updatedItems.length === 0) {
            await session.abortTransaction();
            await session.endSession();
            return NextResponse.json({
                success: false,
                message: "No items needed status update"
            }, { status: 200 });
        }

        // Calculate overall order status
        const statusCounts = {};
        order.items.forEach(item => {
            const itemStatus = item.status || 'pending';
            statusCounts[itemStatus] = (statusCounts[itemStatus] || 0) + 1;
        });

        let maxCount = 0;
        let overallStatus = order.status;

        for (const [itemStatus, count] of Object.entries(statusCounts)) {
            if (count > maxCount) {
                maxCount = count;
                overallStatus = itemStatus;
            }
        }

        const previousOrderStatus = order.status;
        if (overallStatus !== previousOrderStatus) {
            order.status = overallStatus;
        }

        // ✅ If all items are delivered, update paymentStatus to "paid"
        const allDelivered = order.items.every(item => item.status === 'delivered');
        if (allDelivered) {
            order.paymentStatus = 'paid';
        }

        await order.save({ session });

        await Promise.all(updatedItems.map(async (item) => {
            await inngest.send({
                name: 'order/item-status-updated',
                data: {
                    orderId,
                    itemId: item.itemId.toString(),
                    productId: item.productId.toString(),
                    productName: item.productName,
                    previousStatus: item.previousStatus,
                    status: item.newStatus,
                    updatedBy: userId,
                    updatedAt: Date.now()
                }
            });
        }));

        if (overallStatus !== previousOrderStatus) {
            await inngest.send({
                name: 'order/status-updated',
                data: {
                    orderId,
                    previousStatus: previousOrderStatus,
                    status: overallStatus,
                    updatedBy: userId,
                    updatedAt: Date.now()
                }
            });
        }

        await session.commitTransaction();
        await session.endSession();

        return NextResponse.json({
            success: true,
            message: 'Order items status updated successfully',
            updatedItems,
            order
        });

    } catch (error) {
        console.error(error);
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
