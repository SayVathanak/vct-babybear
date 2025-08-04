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

// GET - Fetch current logo
export async function GET(request) {
    try {
        await connectDB();
        
        const logoSettings = await Settings.findOne({ type: 'logo' });
        
        if (!logoSettings) {
            return NextResponse.json({
                success: true,
                logo: null,
                message: 'No logo uploaded yet'
            });
        }

        return NextResponse.json({
            success: true,
            logo: logoSettings.data,
            updatedAt: logoSettings.updatedAt
        });

    } catch (error) {
        console.error('Error fetching logo:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to fetch logo'
        });
    }
}

// POST - Upload new logo
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        
        // Check if user is authorized (seller/admin)
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ 
                success: false, 
                message: 'Not Authorized' 
            });
        }

        const formData = await request.formData();
        const logoFile = formData.get('logo');

        if (!logoFile) {
            return NextResponse.json({
                success: false,
                message: 'No logo file provided'
            });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!validTypes.includes(logoFile.type)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid file type. Please upload JPG, PNG, or SVG files only.'
            });
        }

        // Validate file size (2MB limit)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (logoFile.size > maxSize) {
            return NextResponse.json({
                success: false,
                message: 'File size too large. Maximum size is 2MB.'
            });
        }

        await connectDB();

        // Get current logo to delete old one from Cloudinary
        const currentLogoSettings = await Settings.findOne({ type: 'logo' });
        let oldPublicId = null;
        
        if (currentLogoSettings?.data?.publicId) {
            oldPublicId = currentLogoSettings.data.publicId;
        }

        // Upload to Cloudinary
        const arrayBuffer = await logoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'babybear/logos', // Organize in folders
                    transformation: [
                        { width: 400, height: 120, crop: 'fit' }, // Optimize logo size
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

        // Prepare logo data to save
        const logoData = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            originalName: logoFile.name,
            size: logoFile.size,
            format: uploadResult.format,
            width: uploadResult.width,
            height: uploadResult.height
        };

        // Save or update logo settings in database
        const logoSettings = await Settings.findOneAndUpdate(
            { type: 'logo' },
            {
                type: 'logo',
                data: logoData,
                updatedBy: userId,
                updatedAt: new Date()
            },
            {
                upsert: true, // Create if doesn't exist
                new: true // Return updated document
            }
        );

        // Delete old logo from Cloudinary if exists
        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
            } catch (deleteError) {
                console.error('Error deleting old logo:', deleteError);
                // Don't fail the request if old logo deletion fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Logo uploaded successfully',
            logo: logoData,
            updatedAt: logoSettings.updatedAt
        });

    } catch (error) {
        console.error('Logo upload error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to upload logo'
        });
    }
}

// DELETE - Remove logo
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ 
                success: false, 
                message: 'Not Authorized' 
            });
        }

        await connectDB();

        const logoSettings = await Settings.findOne({ type: 'logo' });
        
        if (!logoSettings) {
            return NextResponse.json({
                success: false,
                message: 'No logo found to delete'
            });
        }

        // Delete from Cloudinary
        if (logoSettings.data.publicId) {
            try {
                await cloudinary.uploader.destroy(logoSettings.data.publicId);
            } catch (deleteError) {
                console.error('Error deleting from Cloudinary:', deleteError);
            }
        }

        // Remove from database
        await Settings.deleteOne({ type: 'logo' });

        return NextResponse.json({
            success: true,
            message: 'Logo deleted successfully'
        });

    } catch (error) {
        console.error('Logo deletion error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to delete logo'
        });
    }
}
