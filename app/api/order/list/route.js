import connectDB from "@/config/db";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        // Get authenticated user
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        // Connect to database
        await connectDB();

        // Ensure models are loaded (this prevents potential issues with population)
        Address.schema;
        Product.schema;

        // Find orders for the authenticated user and populate related data
        const orders = await Order.find({ userId })
            .populate({
                path: 'address',
                select: 'fullName area state phoneNumber' // Only select needed fields
            })
            .populate({
                path: 'items.product',
                select: 'name image offerPrice _id' // Only select needed fields
            })
            .sort({ date: -1 }) // Sort by newest first
            .lean(); // Use lean() for better performance when only reading data

        // Transform orders to ensure consistent data structure
        const transformedOrders = orders.map(order => ({
            ...order,
            // Ensure status exists with default value
            status: order.status || 'pending',
            // Calculate subtotal if not exists
            subtotal: order.subtotal || order.amount,
            // Ensure total exists
            total: order.total || order.amount,
            // Format discount
            discount: order.discount || 0,
            // Format delivery fee
            deliveryFee: order.deliveryFee !== undefined ? order.deliveryFee : 0,
            // Ensure payment status
            paymentStatus: order.paymentStatus || 'pending'
        }));

        return NextResponse.json({
            success: true,
            orders: transformedOrders,
            count: transformedOrders.length
        });

    } catch (error) {
        console.error('Error fetching orders:', error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch orders. Please try again later.",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// Optional: Add POST method for creating orders if needed
export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            items,
            address,
            amount,
            subtotal,
            total,
            discount = 0,
            deliveryFee = 0,
            promoCode,
            paymentMethod = 'COD'
        } = body;

        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, message: "Order items are required" },
                { status: 400 }
            );
        }

        if (!address) {
            return NextResponse.json(
                { success: false, message: "Delivery address is required" },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, message: "Valid order amount is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Create new order
        const newOrder = new Order({
            userId,
            items,
            address,
            amount,
            subtotal: subtotal || amount,
            total: total || amount,
            discount,
            deliveryFee,
            promoCode,
            paymentMethod,
            status: 'pending',
            paymentStatus: 'pending',
            date: new Date()
        });

        const savedOrder = await newOrder.save();

        // Populate the saved order before returning
        const populatedOrder = await Order.findById(savedOrder._id)
            .populate('address')
            .populate('items.product');

        return NextResponse.json({
            success: true,
            message: "Order created successfully",
            order: populatedOrder
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating order:', error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create order. Please try again later.",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}