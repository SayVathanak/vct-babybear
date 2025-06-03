import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import PromoCode from "@/models/PromoCode";
import authSeller from "@/lib/authSeller"; // Assuming this correctly checks for seller role

// --- PUT: Update a specific promo code (any seller can update any promo) ---
export async function PUT(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      // Use 403 Forbidden if user is authenticated but not authorized for the role
      return NextResponse.json({ success: false, message: "Forbidden: User is not a seller" }, { status: 403 });
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

    // --- Retain detailed validations from your original PUT function ---
    if (!code || !discountType || !discountValue) {
      return NextResponse.json({
        success: false,
        message: "Code, discount type, and discount value are required",
      }, { status: 400 });
    }
    if (!["percentage", "fixed"].includes(discountType)) {
      return NextResponse.json({
        success: false,
        message: "Discount type must be either 'percentage' or 'fixed'",
      }, { status: 400 });
    }
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      }, { status: 400 });
    }
    if (discountType === "fixed" && discountValue < 0) {
      return NextResponse.json({
        success: false,
        message: "Fixed discount value cannot be negative",
      }, { status: 400 });
    }

    await connectDB();

    // Find promo code by ID - REMOVED createdBy: userId check
    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return NextResponse.json({
        success: false,
        message: "Promo code not found", // Updated message
      }, { status: 404 });
    }

    // Check if the code is being changed and if the new code (uppercase) already exists for another promo
    if (code && code.toUpperCase() !== promoCode.code) {
      const existingPromo = await PromoCode.findOne({ code: code.toUpperCase(), _id: { $ne: id } }); // Exclude current promo
      if (existingPromo) {
        return NextResponse.json({
          success: false,
          message: "A promo code with this code already exists",
        }, { status: 400 }); // 400 or 409 Conflict
      }
      promoCode.code = code.toUpperCase(); // Update if different and unique
    }

    // Update promo code fields if they are provided in the request
    if (discountType) promoCode.discountType = discountType;
    if (discountValue !== undefined) promoCode.discountValue = discountValue; // Allow 0
    promoCode.minPurchaseAmount = minPurchaseAmount !== undefined ? minPurchaseAmount : (promoCode.minPurchaseAmount || 0);
    promoCode.maxDiscountAmount = maxDiscountAmount !== undefined ? maxDiscountAmount : (promoCode.maxDiscountAmount || null);
    promoCode.expiryDate = expiryDate !== undefined ? expiryDate : (promoCode.expiryDate || null);
    if (isActive !== undefined) promoCode.isActive = isActive;
    
    promoCode.updatedAt = new Date(); // Manually update updatedAt timestamp

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

// --- DELETE: Allow sellers to delete any promo code ---
export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Forbidden: User is not a seller" }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Promo code ID is required" }, { status: 400 });
    }

    await connectDB();

    const deletedPromoCode = await PromoCode.findByIdAndDelete(id);

    if (!deletedPromoCode) {
      return NextResponse.json({
        success: false,
        message: "Promo code not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An error occurred while deleting promo code"
    }, { status: 500 });
  }
}

// --- PATCH: Allow sellers to activate/deactivate any promo code ---
export async function PATCH(request, { params }) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Forbidden: User is not a seller" }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Promo code ID is required" }, { status: 400 });
    }

    const { isActive } = await request.json();

    // Validate isActive presence and type
    if (typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, message: "'isActive' must be a boolean value (true or false)" }, { status: 400 });
    }

    await connectDB();

    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      id,
      { 
        isActive,
        updatedAt: new Date() // Explicitly update the updatedAt timestamp
      },
      { new: true } // Return the updated document
    );

    if (!updatedPromoCode) {
      return NextResponse.json({
        success: false,
        message: "Promo code not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Promo code ${isActive ? 'activated' : 'deactivated'} successfully`,
      promoCode: updatedPromoCode
    });

  } catch (error) {
    console.error("Error toggling promo code status:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An error occurred while updating promo code status"
    }, { status: 500 });
  }
}