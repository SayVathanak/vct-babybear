// // File: /app/api/product/update-stock/route.js

import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server"; // Temporarily disabled for testing
// import authSeller from "@/lib/authSeller"; // Temporarily disabled for testing
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function PUT(request) {
    await connectDB();
    try {
        // --- AUTHENTICATION TEMPORARILY REMOVED FOR DEVELOPMENT ---
        // // 1. Authenticate the user as a seller
        // const { userId } = getAuth(request);
        // const isSeller = await authSeller(userId);
        // if (!isSeller) {
        //     return NextResponse.json({ success: false, message: "Not Authorized" }, { status: 403 });
        // }
        // ---------------------------------------------------------

        // 2. Get productId and quantityToAdd from the request body
        const { productId, quantityToAdd } = await request.json();

        if (!productId || !quantityToAdd) {
            return NextResponse.json({ success: false, message: "Product ID and quantity to add are required." }, { status: 400 });
        }

        const quantity = Number(quantityToAdd);
        if (isNaN(quantity) || quantity <= 0) {
            return NextResponse.json({ success: false, message: "Quantity must be a positive number." }, { status: 400 });
        }

        // 3. Find the product and update its stock atomically
        // The userId filter has been temporarily removed for testing.
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId /*, userId: userId */ }, // Ensure the product belongs to the seller
            { 
                $inc: { stock: quantity }, // Increment the stock by the new amount
                $set: { isAvailable: true } // Always set to available when adding stock
            },
            { new: true } // Return the updated document
        );

        // 4. Handle case where product is not found
        if (!updatedProduct) {
            return NextResponse.json({ success: false, message: "Product not found or you do not have permission to update it." }, { status: 404 });
        }

        // 5. Return the successfully updated product
        return NextResponse.json({
            success: true,
            message: "Stock updated successfully!",
            product: updatedProduct,
        });

    } catch (error) {
        console.error("Error updating product stock:", error);
        return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 });
    }
}

// File: /app/api/product/update-stock/route.js

// import { NextResponse } from "next/server";
// import { getAuth } from "@clerk/nextjs/server";
// import authSeller from "@/lib/authSeller";
// import connectDB from "@/config/db";
// import Product from "@/models/Product";

// export async function PUT(request) {
//     await connectDB();
//     try {
//         // 1. Authenticate the user as a seller
//         const { userId } = getAuth(request);
//         const isSeller = await authSeller(userId);
//         if (!isSeller) {
//             return NextResponse.json({ success: false, message: "Not Authorized" }, { status: 403 });
//         }

//         // 2. Get productId and quantityToAdd from the request body
//         const { productId, quantityToAdd } = await request.json();

//         if (!productId || !quantityToAdd) {
//             return NextResponse.json({ success: false, message: "Product ID and quantity to add are required." }, { status: 400 });
//         }

//         const quantity = Number(quantityToAdd);
//         if (isNaN(quantity) || quantity <= 0) {
//             return NextResponse.json({ success: false, message: "Quantity must be a positive number." }, { status: 400 });
//         }

//         // 3. Find the product and update its stock atomically
//         // The userId filter ensures a seller can only update their own products.
//         const updatedProduct = await Product.findOneAndUpdate(
//             { _id: productId, userId: userId }, 
//             { 
//                 $inc: { stock: quantity }, // Increment the stock by the new amount
//                 $set: { isAvailable: true } // Always set to available when adding stock
//             },
//             { new: true } // Return the updated document
//         );

//         // 4. Handle case where product is not found or doesn't belong to the user
//         if (!updatedProduct) {
//             return NextResponse.json({ success: false, message: "Product not found or you do not have permission to update it." }, { status: 404 });
//         }

//         // 5. Return the successfully updated product
//         return NextResponse.json({
//             success: true,
//             message: "Stock updated successfully!",
//             product: updatedProduct,
//         });

//     } catch (error) {
//         console.error("Error updating product stock:", error);
//         return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 });
//     }
// }
