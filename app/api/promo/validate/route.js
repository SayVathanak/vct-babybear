import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import PromoCode from "@/models/PromoCode";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "You need to be logged in to use a promo code." }, { status: 401 });
    }

    const { code, cartAmount } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: "Please enter a promo code." }, { status: 400 });
    }

    await connectDB();

    // Find an active promo code with the given code
    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ]
    });

    if (!promoCode) {
      return NextResponse.json({
        success: false,
        message: "This promo code is either invalid or has expired."
      }, { status: 404 });
    }

    // Check minimum purchase amount if it exists
    if (promoCode.minPurchaseAmount && cartAmount < promoCode.minPurchaseAmount) {
      return NextResponse.json({
        success: false,
        message: `To use this code, your order must be at least $${promoCode.minPurchaseAmount.toFixed(2)}.`,
        minAmount: promoCode.minPurchaseAmount
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = (cartAmount * promoCode.discountValue) / 100;

      // Apply maximum discount cap if set
      if (promoCode.maxDiscountAmount && discountAmount > promoCode.maxDiscountAmount) {
        discountAmount = promoCode.maxDiscountAmount;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(promoCode.discountValue, cartAmount); // Don't discount more than cart amount
    }

    return NextResponse.json({
      success: true,
      message: "Promo code applied! Your discount has been added.",
      discountAmount,
      promoCode: {
        id: promoCode._id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        maxDiscountAmount: promoCode.maxDiscountAmount
      }
    });

  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json({
      success: false,
      message: "Something went wrong while applying the promo code. Please try again."
    }, { status: 500 });
  }
}
