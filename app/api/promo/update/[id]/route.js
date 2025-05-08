import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import PromoCode from "@/models/PromoCode";
import authSeller from "@/lib/authSeller";

export async function PUT(request, { params }) {
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

    const {
      code,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      expiryDate,
      isActive,
    } = await request.json();

    // Validate required fields
    if (!code || !discountType || !discountValue) {
      return NextResponse.json({
        success: false,
        message: "Code, discount type, and discount value are required",
      }, { status: 400 });
    }

    // Validate discount type
    if (!["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json({
        success: false,
        message: "Discount type must be either 'percentage' or 'fixed'",
      }, { status: 400 });
    }

    // Validate percentage discount value
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      }, { status: 400 });
    }

    // Validate fixed discount value
    if (discountType === "fixed" && discountValue < 0) {
      return NextResponse.json({
        success: false,
        message: "Fixed discount value cannot be negative",
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

    // Check if the code is being changed and if it already exists
    if (code.toUpperCase() !== promoCode.code) {
      const existingPromo = await PromoCode.findOne({ code: code.toUpperCase() });
      if (existingPromo) {
        return NextResponse.json({
          success: false,
          message: "A promo code with this code already exists",
        }, { status: 400 });
      }
    }

    // Update promo code
    promoCode.code = code.toUpperCase();
    promoCode.discountType = discountType;
    promoCode.discountValue = discountValue;
    promoCode.minPurchaseAmount = minPurchaseAmount || 0;
    promoCode.maxDiscountAmount = maxDiscountAmount || null;
    promoCode.expiryDate = expiryDate || null;
    promoCode.isActive = isActive ?? true;

    await promoCode.save();

    return NextResponse.json({
      success: true,
      message: "Promo code updated successfully",
      promoCode,
    });

  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An error occurred while updating the promo code",
    }, { status: 500 });
  }
}