// /api/product/delete/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
    try {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        return publicId;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
}

// Helper function to delete images from Cloudinary
async function deleteImagesFromCloudinary(imageUrls) {
    const deletionPromises = imageUrls.map(async (url) => {
        try {
            const publicId = extractPublicIdFromUrl(url);
            if (publicId) {
                const result = await cloudinary.uploader.destroy(publicId);
                return { url, success: result.result === 'ok', publicId };
            }
            return { url, success: false, error: 'Could not extract public ID' };
        } catch (error) {
            console.error(`Error deleting image ${url}:`, error);
            return { url, success: false, error: error.message };
        }
    });

    return Promise.all(deletionPromises);
}

export async function DELETE(request) {
    try {
        // Get the authenticated user's ID using Clerk's getAuth
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "Authentication failed"
            }, { status: 401 });
        }

        // Verify the user is a seller
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({
                success: false,
                message: "Not Authorized"
            }, { status: 403 });
        }

        // Get product ID from request body
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({
                success: false,
                message: "Product ID is required"
            }, { status: 400 });
        }

        // Connect to the database
        await connectDB();

        // Find the product
        const product = await Product.findById(productId);

        if (!product) {
            return NextResponse.json({
                success: false,
                message: "Product not found"
            }, { status: 404 });
        }

        // --- REMOVED: Ownership verification check ---
        // if (product.userId !== userId) {
        //     return NextResponse.json({
        //         success: false,
        //         message: "You are not authorized to delete this product"
        //     }, { status: 403 });
        // }

        // Delete images from Cloudinary if they exist
        let imageDeletionResults = [];
        if (product.image && product.image.length > 0) {
            imageDeletionResults = await deleteImagesFromCloudinary(product.image);

            // Log any failed image deletions (but don't fail the entire operation)
            const failedDeletions = imageDeletionResults.filter(result => !result.success);
            if (failedDeletions.length > 0) {
                console.warn('Some images could not be deleted from Cloudinary:', failedDeletions);
            }
        }

        // Delete the product from the database
        await Product.findByIdAndDelete(productId);

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully",
            deletedProduct: {
                id: product._id,
                name: product.name
            },
            imageDeletionResults: imageDeletionResults.length > 0 ? imageDeletionResults : null
        });

    } catch (error) {
        console.error("Error in DELETE route:", error);

        return NextResponse.json({
            success: false,
            message: error.message || "An unexpected error occurred while deleting the product"
        }, { status: 500 });
    }
}