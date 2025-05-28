import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Slider from "@/models/Slider";

export async function GET() {
    try {
        await connectDB();

        // Only fetch active sliders for public endpoint
        const sliders = await Slider.find({ isActive: true })
            .select('imgSrcSm imgSrcMd isActive createdAt')
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance

        const formattedSliders = sliders.map(slider => ({
            _id: slider._id,
            imgSrcSm: slider.imgSrcSm,
            imgSrcMd: slider.imgSrcMd,
            isActive: slider.isActive,
            createdAt: slider.createdAt
        }));

        return NextResponse.json({
            success: true,
            sliders: formattedSliders
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });
    } catch (error) {
        console.error('Error fetching public sliders:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch sliders'
        }, { status: 500 });
    }
}