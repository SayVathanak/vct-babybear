import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Slider from "@/models/Slider";

// configure environment variables
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

        const isActive = formData.get('isActive') === 'true';
        const imgSrcSm = formData.get('imgSrcSm');
        const imgSrcMd = formData.get('imgSrcMd');

        // Validate required fields
        if (!imgSrcSm || !imgSrcMd) {
            return NextResponse.json({
                success: false,
                message: 'Both mobile and desktop images are required'
            }, { status: 400 });
        }

        // Validate file types
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(imgSrcSm.type) || !allowedTypes.includes(imgSrcMd.type)) {
            return NextResponse.json({
                success: false,
                message: 'Only JPEG, PNG, and WebP images are allowed'
            }, { status: 400 });
        }

        // Upload images
        const files = [imgSrcSm, imgSrcMd];

        const result = await Promise.all(
            files.map(async (file) => {
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

        const [smResult, mdResult] = result;

        // Connect to database and create slider
        await connectDB();

        const newSlider = await Slider.create({
            imgSrcSm: smResult.secure_url,
            imgSrcMd: mdResult.secure_url,
            isActive,
            cloudinaryIds: {
                mobile: smResult.public_id,
                desktop: mdResult.public_id
            },
            date: Date.now()
        });

        return NextResponse.json({
            success: true,
            message: "Slider created successfully",
            slider: newSlider
        });

    } catch (error) {
        console.error('Slider creation error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}