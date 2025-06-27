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
        // 1. Authenticate the seller
        const { userId } = getAuth(request);
        if (!userId || !(await authSeller(userId))) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { items } = await request.json();

        // 2. Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            await session.abortTransaction();
            return NextResponse.json({ success: false, message: "Invalid data: Items array is required." }, { status: 400 });
        }

        let serverCalculatedSubtotal = 0;
        const productDetails = [];

        // 3. Validate stock and calculate totals on the server
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

            // Use offerPrice if available, otherwise use regular price
            const price = productDoc.offerPrice > 0 ? productDoc.offerPrice : productDoc.price;
            serverCalculatedSubtotal += price * item.quantity;
            productDetails.push({ product: productDoc, quantity: item.quantity });
        }

        // 4. Find or create a default "Walk-in" address for the seller
        let posAddress = await Address.findOne({ userId, fullName: "Walk-in Customer" }).session(session);
        if (!posAddress) {
            posAddress = new Address({
                userId,
                fullName: "Walk-in Customer",
                phoneNumber: "0000000000",
                area: "In-Store",
                state: "In-Store Sale",
            });
            await posAddress.save({ session });
        }

        // 5. Create the new order document using server-calculated values
        const newOrder = new Order({
            userId,
            address: posAddress._id,
            items: items.map(item => ({
                product: item.product,
                quantity: item.quantity,
            })),
            subtotal: serverCalculatedSubtotal,
            deliveryFee: 0,
            discount: 0,
            amount: serverCalculatedSubtotal, // Total amount is the subtotal for POS
            date: Date.now(),
            status: 'Completed',
            paymentMethod: 'COD', // 'COD' represents an in-person payment
            paymentStatus: 'paid',
            paymentConfirmationStatus: 'confirmed',
        });

        const savedOrder = await newOrder.save({ session });

        // 6. Decrement stock levels for each product
        for (const detail of productDetails) {
            await Product.updateOne(
                { _id: detail.product._id },
                { $inc: { stock: -detail.quantity } },
                { session }
            );
        }

        // 7. Commit the transaction
        await session.commitTransaction();

        // 8. Prepare the order data for the frontend response
        const orderForFrontend = {
            ...savedOrder.toObject(), // Convert Mongoose doc to plain JS object
            orderId: savedOrder._id.toString(), // Add the 'orderId' field
            items: productDetails // Send populated product details for the receipt
        };

        return NextResponse.json({
            success: true,
            message: "Sale completed successfully!",
            order: orderForFrontend, // Send the transformed object
        }, { status: 201 });

    } catch (error) {
        // If any error occurs, abort the transaction
        await session.abortTransaction();
        console.error("Error in POS order creation:", error);
        return NextResponse.json({ success: false, message: error.message || "Server error while creating order." }, { status: 500 });
    } finally {
        // End the session
        session.endSession();
    }
}
