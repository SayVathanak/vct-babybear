import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address";
import authSeller from "@/lib/authSeller";

export async function POST(request) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId } = getAuth(request);
        if (!userId || !(await authSeller(userId))) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { items } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, message: "Invalid data: Items array is required." }, { status: 400 });
        }

        let serverCalculatedSubtotal = 0;
        const productDetails = [];

        for (const item of items) {
            if (!item.product || !item.quantity || item.quantity <= 0) {
                await session.abortTransaction();
                return NextResponse.json({ success: false, message: `Invalid item data provided.` }, { status: 400 });
            }

            const productDoc = await Product.findById(item.product).session(session);
            if (!productDoc) {
                await session.abortTransaction();
                return NextResponse.json({ success: false, message: `Product with ID ${item.product} not found.` }, { status: 404 });
            }

            if (productDoc.stock < item.quantity) {
                await session.abortTransaction();
                return NextResponse.json({ success: false, message: `Not enough stock for ${productDoc.name}. Only ${productDoc.stock} left.` }, { status: 400 });
            }

            const price = productDoc.offerPrice > 0 ? productDoc.offerPrice : productDoc.price;
            serverCalculatedSubtotal += price * item.quantity;
            productDetails.push({ product: productDoc, quantity: item.quantity });
        }

        let posAddress = await Address.findOne({ userId, fullName: "Walk-in Customer" }).session(session);
        if (!posAddress) {
            posAddress = new Address({
                userId,
                fullName: "Walk-in Customer",
                phoneNumber: "None",
                area: "In Store",
                state: "Baby Bear",
            });
            await posAddress.save({ session });
        }

        // --- FIX: Generate a new ObjectId and create a user-friendly orderId ---
        const newMongoId = new mongoose.Types.ObjectId();
        const userFriendlyOrderId = `POS-${newMongoId.toString().slice(-8).toUpperCase()}`;

        const newOrder = new Order({
            _id: newMongoId, // Use the pre-generated ID
            orderId: userFriendlyOrderId, // Save the user-friendly ID
            userId,
            address: posAddress._id,
            items: items.map(item => ({
                product: item.product,
                quantity: item.quantity,
            })),
            subtotal: serverCalculatedSubtotal,
            deliveryFee: 0,
            discount: 0,
            amount: serverCalculatedSubtotal,
            date: Date.now(),
            status: 'Completed',
            paymentMethod: 'COD',
            paymentStatus: 'paid',
            paymentConfirmationStatus: 'confirmed',
        });

        const savedOrder = await newOrder.save({ session });

        for (const detail of productDetails) {
            await Product.updateOne(
                { _id: detail.product._id },
                { $inc: { stock: -detail.quantity } },
                { session }
            );
        }

        await session.commitTransaction();

        const populatedItems = await Promise.all(
            savedOrder.items.map(async (item) => {
                const product = await Product.findById(item.product).lean();
                return { ...item.toObject(), product };
            })
        );

        const orderForFrontend = {
            ...savedOrder.toObject(),
            items: populatedItems,
        };

        return NextResponse.json({
            success: true,
            message: "Sale completed successfully!",
            order: orderForFrontend,
        }, { status: 201 });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error in POS order creation:", error);
        return NextResponse.json({ success: false, message: error.message || "Server error while creating order." }, { status: 500 });
    } finally {
        session.endSession();
    }
}
