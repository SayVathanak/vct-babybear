import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import PromoCode from "@/models/PromoCode";
import authSeller from "@/lib/authSeller";

export async function PATCH(request, { params }) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // Check if user is a seller
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({
                success: false,
                message: "Promo code ID is required",
            }, { status: 400 });
        }

        const { isActive } = await request.json();
        if (typeof isActive !== 'boolean') {
            return NextResponse.json({
                success: false,
                message: "isActive must be a boolean value",
            }, { status: 400 });
        }

        await connectDB();

        // Find promo code by ID and check ownership
        const promoCode = await PromoCode.findOne({ _id: id, createdBy: userId });
        if (!promoCode) {
            return NextResponse.json({
                success: false,
                message: "Promo code not found or you don't have permission to update it",
            }, { status: 404 });
        }

        // Update status
        promoCode.isActive = isActive;
        await promoCode.save();

        return NextResponse.json({
            success: true,
            message: `Promo code ${isActive ? 'activated' : 'deactivated'} successfully`,
            promoCode,
        });

    } catch (error) {
        console.error("Error updating promo code status:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "An error occurred while updating the promo code status",
        }, { status: 500 });
    }
}