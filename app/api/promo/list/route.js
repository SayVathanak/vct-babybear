import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import PromoCode from "@/models/PromoCode";
import authSeller from "@/lib/authSeller";

export async function GET(request) {
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

    await connectDB();

    // Get ALL promo codes from all sellers (removed the createdBy filter)
    const promoCodes = await PromoCode.find({})
      .populate('createdBy', 'firstName lastName email') // Optional: populate creator info
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    return NextResponse.json({
      success: true,
      promoCodes,
    });

  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An error occurred while fetching promo codes",
    }, { status: 500 });
  }
}