import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Slider from "@/models/Slider";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({
                success: false,
                message: 'Not Authorized'
            }, { status: 403 });
        }

        const formData = await request.formData();
        const sliderId = formData.get('sliderId');
        const isActive = formData.get('isActive') === 'true';
        const imgSrcSm = formData.get('imgSrcSm');
        const imgSrcMd = formData.get('imgSrcMd');

        if (!sliderId) {
            return NextResponse.json({
                success: false,
                message: 'Slider ID is required'
            }, { status: 400 });
        }

        await connectDB();

        // Find existing slider
        const existingSlider = await Slider.findOne({ _id: sliderId, userId });
        if (!existingSlider) {
            return NextResponse.json({
                success: false,
                message: 'Slider not found or unauthorized'
            }, { status: 404 });
        }

        const updateData = {
            isActive,
            updatedAt: new Date()
        };

        // If new images are provided, upload them
        if (imgSrcSm || imgSrcMd) {
            const filesToUpload = [];

            if (imgSrcSm) filesToUpload.push(imgSrcSm);
            if (imgSrcMd) filesToUpload.push(imgSrcMd);

            const result = await Promise.all(
                filesToUpload.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'auto',
                                folder: 'sliders'
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
                })
            );

            // Update the data with new image URLs
            if (imgSrcSm) {
                updateData.imgSrcSm = result[0].secure_url;
                updateData.cloudinaryIds = {
                    ...existingSlider.cloudinaryIds,
                    mobile: result[0].public_id
                };
            }
            if (imgSrcMd) {
                const mdResult = imgSrcSm ? result[1] : result[0];
                updateData.imgSrcMd = mdResult.secure_url;
                updateData.cloudinaryIds = {
                    ...updateData.cloudinaryIds || existingSlider.cloudinaryIds,
                    desktop: mdResult.public_id
                };
            }
        }

        // Update the slider
        const updatedSlider = await Slider.findByIdAndUpdate(
            sliderId,
            updateData,
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Slider updated successfully",
            slider: updatedSlider
        });

    } catch (error) {
        console.error('Error updating slider:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}