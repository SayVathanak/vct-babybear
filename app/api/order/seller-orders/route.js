// pages/api/order/seller-orders/route.js
import Order from '@/models/Order';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import authSeller from '@/lib/authSeller'; // Your seller authentication utility
import { NextResponse } from 'next/server';

// Ensure all models involved in population are imported so Mongoose registers their schemas
import Product from '@/models/Product'; // Already likely imported if items.product is populated
import Address from '@/models/Address'; // <<< --- ADD THIS IMPORT ---
// If your Address model is in a different location, adjust the path.
// For example, if it's models/Address.js or models/address.js

export async function GET(request) {
    await connectDB();

    try {
        // Seller Authentication
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized: No user ID found.' }, { status: 401 });
        }
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Forbidden: User is not a seller.' }, { status: 403 });
        }

        // Fetch orders
        const orders = await Order.find({}) // Add seller-specific filters here if necessary
            .populate({
                path: 'items.product',
                select: 'name price image offerPrice'
            })
            .populate({
                path: 'address' // Now Mongoose should know about the 'address' model
            })
            .sort({ date: -1 })
            .lean();

        // The console.log from your frontend page.jsx (fetchSellerOrders) is more useful for debugging client-side data.
        // If you need to debug server-side data before sending:
        // console.log("Seller orders fetched on server:", JSON.stringify(orders, null, 2));

        return NextResponse.json({ success: true, orders: orders });

    } catch (error) {
        console.error("Error fetching seller orders:", error);
        // Send a more specific error message if it's a known type
        if (error.name === 'MissingSchemaError') {
            return NextResponse.json({
                success: false,
                message: `Schema Error: ${error.message}. Ensure all referenced models are imported.`
            }, { status: 500 });
        }
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch seller orders."
        }, { status: 500 });
    }
}
