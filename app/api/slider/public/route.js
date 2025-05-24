// /api/slider/public/route.js
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Slider from "@/models/Slider";

export async function GET(request) {
    try {
        await connectDB();

        // Only fetch active sliders for public display
        const sliders = await Slider.find({ isActive: true }).sort({ createdAt: -1 });

        const formattedSliders = sliders.map(slider => ({
            _id: slider._id,
            imgSrcSm: slider.imgSrcSm,
            imgSrcMd: slider.imgSrcMd,
            alt: slider.alt || '',
            href: slider.href || null
        }));

        return NextResponse.json({ success: true, sliders: formattedSliders });
    } catch (error) {
        console.error('Error fetching public sliders:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}