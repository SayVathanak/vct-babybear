import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Slider from "@/models/Slider";

export async function PATCH(request, { params }) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({
                success: false,
                message: 'Not Authorized'
            }, { status: 403 });
        }

        const { sliderId } = params;
        const { isActive } = await request.json();

        if (!sliderId) {
            return NextResponse.json({
                success: false,
                message: 'Slider ID is required'
            }, { status: 400 });
        }

        await connectDB();

        // Update slider status
        const updatedSlider = await Slider.findOneAndUpdate(
            { _id: sliderId, userId },
            {
                isActive: isActive,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedSlider) {
            return NextResponse.json({
                success: false,
                message: 'Slider not found or unauthorized'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Slider ${isActive ? 'activated' : 'deactivated'} successfully`,
            slider: updatedSlider
        });

    } catch (error) {
        console.error('Error toggling slider status:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}