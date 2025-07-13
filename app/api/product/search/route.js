// File: /app/api/product/search/route.js

import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server"; // Temporarily disabled for testing
// import authSeller from "@/lib/authSeller"; // Temporarily disabled for testing
import connectDB from "@/config/db";
import Product from "@/models/Product";

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} string The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request) {
    await connectDB();
    try {
        // --- AUTHENTICATION TEMPORARILY REMOVED FOR DEVELOPMENT ---
        // // 1. Authenticate the user and ensure they are a seller
        // const { userId } = getAuth(request);
        // const isSeller = await authSeller(userId);
        // if (!isSeller) {
        //     return NextResponse.json({ success: false, message: "Not Authorized" }, { status: 403 });
        // }
        // ---------------------------------------------------------

        // 2. Get the search query from the URL's query parameters
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query || query.trim() === '') {
            return NextResponse.json({ success: false, message: "A search query parameter is required." }, { status: 400 });
        }

        const trimmedQuery = query.trim();
        const escapedQuery = escapeRegex(trimmedQuery);

        // 3. Build the search criteria to look in both barcode and name fields
        // The userId filter has been temporarily removed for testing.
        const searchCriteria = {
            // userId: userId, // Temporarily disabled
            $or: [
                // Case-insensitive exact match for the barcode field
                { barcode: { $regex: `^${escapedQuery}$`, $options: 'i' } },
                // Case-insensitive partial match for the name field
                { name: { $regex: escapedQuery, $options: 'i' } }
            ]
        };

        // 4. Execute the search query to find a single matching product
        const product = await Product.findOne(searchCriteria);

        // 5. If no product is found, return a 404 error
        if (!product) {
            return NextResponse.json({ success: false, message: `Product not found for "${trimmedQuery}".` }, { status: 404 });
        }

        // 6. If a product is found, return it with a success response
        return NextResponse.json({ success: true, product });

    } catch (error) {
        console.error("Error searching for product:", error);
        return NextResponse.json({ success: false, message: "An internal server error occurred while searching." }, { status: 500 });
    }
}
