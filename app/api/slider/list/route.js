import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Slider from "@/models/Slider";

export async function GET(request) {
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

        // Sort by createdAt instead of date for consistency
        const sliders = await Slider.find({ userId }).sort({ createdAt: -1 });

        // Format the response to match what the frontend expects
        const formattedSliders = sliders.map(slider => ({
            _id: slider._id,
            imgSrcSm: slider.imgSrcSm,
            imgSrcMd: slider.imgSrcMd,
            isActive: slider.isActive,
            date: slider.createdAt || slider.date, // Use createdAt, fallback to date
            createdAt: slider.createdAt,
            updatedAt: slider.updatedAt,
            cloudinaryIds: slider.cloudinaryIds
        }));

        return NextResponse.json({
            success: true,
            sliders: formattedSliders
        });

    } catch (error) {
        console.error('Error fetching sliders:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}