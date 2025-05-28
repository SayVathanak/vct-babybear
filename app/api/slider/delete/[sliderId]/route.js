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

export async function DELETE(request, { params }) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'Not Authorized' }, { status: 403 });
        }

        const { sliderId } = params;

        if (!sliderId) {
            return NextResponse.json({ success: false, message: 'Slider ID is required' }, { status: 400 });
        }

        await connectDB();

        const slider = await Slider.findById(sliderId);
        if (!slider) {
            return NextResponse.json({ success: false, message: 'Slider not found' }, { status: 404 });
        }

        const deletePromises = [];

        if (slider.cloudinaryIds?.mobile) {
            deletePromises.push(cloudinary.uploader.destroy(slider.cloudinaryIds.mobile));
        }

        if (slider.cloudinaryIds?.desktop) {
            deletePromises.push(cloudinary.uploader.destroy(slider.cloudinaryIds.desktop));
        }

        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
        }

        await Slider.findByIdAndDelete(sliderId);

        return NextResponse.json({ success: true, message: "Slider deleted successfully" });
    } catch (error) {
        console.error('Error deleting slider:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}