// pages/api/upload/transaction-proof/route.js
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server"; // To ensure an authenticated user is uploading
import { NextResponse } from "next/server";

// Configure Cloudinary (ensure these environment variables are set)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized: User not authenticated." }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('transactionProofImage'); // Expecting a single file with this key

        if (!file) {
            return NextResponse.json({ success: false, message: "No file uploaded. Please provide 'transactionProofImage'." }, { status: 400 });
        }

        // Convert file to buffer to upload to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { 
                    resource_type: 'image', // Explicitly set to image
                    folder: "transaction_proofs" // Optional: organize uploads in Cloudinary
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(buffer);
        });

        if (!result || !result.secure_url) {
            throw new Error("Cloudinary upload failed to return a secure URL.");
        }

        // Return the secure URL of the uploaded image
        return NextResponse.json({ 
            success: true, 
            message: "Transaction proof uploaded successfully.", 
            imageUrl: result.secure_url 
        });

    } catch (error) {
        console.error("Error in transaction proof upload API:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to upload transaction proof." }, { status: 500 });
    }
}
