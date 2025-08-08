// app/api/settings/aba-khqr/route.js
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Settings from "@/models/Settings";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// GET - Fetch current ABA KHQR
export async function GET(request) {
    try {
        await connectDB();
        
        const khqrSettings = await Settings.findOne({ type: 'aba-khqr' });
        
        if (!khqrSettings) {
            return NextResponse.json({
                success: true,
                khqr: null,
                bankDetails: null,
                message: 'No ABA KHQR uploaded yet'
            });
        }

        return NextResponse.json({
            success: true,
            khqr: khqrSettings.data.khqr,
            bankDetails: khqrSettings.data.bankDetails,
            updatedAt: khqrSettings.updatedAt
        });

    } catch (error) {
        console.error('Error fetching ABA KHQR:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to fetch ABA KHQR'
        }, { status: 500 });
    }
}

// POST - Upload new ABA KHQR
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        
        // Check if user is authorized (seller/admin)
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ 
                success: false, 
                message: 'Not Authorized' 
            }, { status: 403 });
        }

        const formData = await request.formData();
        const khqrFile = formData.get('khqr');
        const bankDetailsStr = formData.get('bankDetails');

        if (!khqrFile) {
            return NextResponse.json({
                success: false,
                message: 'No KHQR file provided'
            }, { status: 400 });
        }

        // Parse bank details
        let bankDetails = {};
        if (bankDetailsStr) {
            try {
                bankDetails = JSON.parse(bankDetailsStr);
            } catch (e) {
                return NextResponse.json({
                    success: false,
                    message: 'Invalid bank details format'
                }, { status: 400 });
            }
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(khqrFile.type)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid file type. Please upload JPG or PNG files only.'
            }, { status: 400 });
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (khqrFile.size > maxSize) {
            return NextResponse.json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
            }, { status: 400 });
        }

        await connectDB();

        // Get current KHQR to delete old one from Cloudinary
        const currentKHQRSettings = await Settings.findOne({ type: 'aba-khqr' });
        let oldPublicId = null;
        
        if (currentKHQRSettings?.data?.khqr?.publicId) {
            oldPublicId = currentKHQRSettings.data.khqr.publicId;
        }

        // Upload to Cloudinary
        const arrayBuffer = await khqrFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'babybear/aba-khqr', // Organize in folders
                    transformation: [
                        { width: 800, height: 800, crop: 'limit' }, // Optimize KHQR size
                        { quality: 'auto' },
                        { format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(buffer);
        });

        // Prepare KHQR data to save
        const khqrData = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            originalName: khqrFile.name,
            size: khqrFile.size,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height,
            uploadedAt: new Date()
        };

        // Prepare complete data structure
        const settingsData = {
            khqr: khqrData,
            bankDetails: {
                accountNumber: bankDetails.accountNumber || '',
                accountName: bankDetails.accountName || '',
                bankName: bankDetails.bankName || 'ABA Bank',
                isActive: bankDetails.isActive !== undefined ? bankDetails.isActive : true
            }
        };

        // Save or update ABA KHQR settings in database
        const khqrSettings = await Settings.findOneAndUpdate(
            { type: 'aba-khqr' },
            {
                type: 'aba-khqr',
                data: settingsData,
                updatedBy: userId,
                updatedAt: new Date()
            },
            {
                upsert: true, // Create if doesn't exist
                new: true // Return updated document
            }
        );

        // Delete old KHQR from Cloudinary if exists
        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error('Error deleting old KHQR:', deleteError);
                // Don't fail the request if old KHQR deletion fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'ABA KHQR uploaded successfully',
            khqr: khqrData,
            bankDetails: settingsData.bankDetails,
            updatedAt: khqrSettings.updatedAt
        });

    } catch (error) {
        console.error('ABA KHQR upload error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to upload ABA KHQR'
        }, { status: 500 });
    }
}

// DELETE - Remove ABA KHQR
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ 
                success: false, 
                message: 'Not Authorized' 
            }, { status: 403 });
        }

        await connectDB();

        const khqrSettings = await Settings.findOne({ type: 'aba-khqr' });
        
        if (!khqrSettings) {
            return NextResponse.json({
                success: false,
                message: 'No ABA KHQR found to delete'
            }, { status: 404 });
        }

        // Delete from Cloudinary
        if (khqrSettings.data.khqr?.publicId) {
            try {
                await cloudinary.uploader.destroy(khqrSettings.data.khqr.publicId);
            } catch (deleteError) {
                console.error('Error deleting from Cloudinary:', deleteError);
            }
        }

        // Remove from database
        await Settings.deleteOne({ type: 'aba-khqr' });

        return NextResponse.json({
            success: true,
            message: 'ABA KHQR deleted successfully'
        });

    } catch (error) {
        console.error('ABA KHQR deletion error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to delete ABA KHQR'
        }, { status: 500 });
    }
}