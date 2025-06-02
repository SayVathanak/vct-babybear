// pages/api/order/seller-orders/route.js
// This is an example, adjust the path if your file is named differently (e.g., seller-orders.js)

import Order from '@/models/Order';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import authSeller from '@/lib/authSeller'; // Your seller authentication utility
import { NextResponse } from 'next/server';

export async function GET(request) {
    await connectDB();

    try {
        // Seller Authentication
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized: No user ID found.' }, { status: 401 });
        }
        const isSeller = await authSeller(userId); // Assuming this checks if the user is a seller
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Forbidden: User is not a seller.' }, { status: 403 });
        }

        // Fetch orders - adjust query as needed (e.g., if sellers only see certain orders)
        const orders = await Order.find({}) // Add seller-specific filters here if necessary
            .populate({
                path: 'items.product', // Populate product details for each item
                select: 'name price image offerPrice' // Select specific fields
            })
            .populate({
                path: 'address' // Populate address details
            })
            .sort({ date: -1 }) // Sort by newest first
            .lean(); // Use .lean() for plain JS objects, good for read-only operations

        // Ensure all necessary fields are present. Mongoose typically includes all schema fields
        // with .lean(), but explicitly checking or transforming here can be useful if needed.
        // For example, if paymentTransactionImage needs to be a full URL:
        // const processedOrders = orders.map(order => ({
        //     ...order,
        //     paymentTransactionImage: order.paymentTransactionImage 
        //         ? `YOUR_IMAGE_BASE_URL/${order.paymentTransactionImage}` // Construct full URL if it's just a filename
        //         : null,
        // }));

        return NextResponse.json({ success: true, orders: orders /* or processedOrders */ });

    } catch (error) {
        console.error("Error fetching seller orders:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || "Failed to fetch seller orders." 
        }, { status: 500 });
    }
}
