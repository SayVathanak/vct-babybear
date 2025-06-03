// In your API route file: e.g., app/api/promo-codes/[id]/route.js

import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";         // Ensure this path is correct
import PromoCode from "@/models/PromoCode";   // Ensure this path is correct
import authSeller from "@/lib/authSeller";   // Ensure this path is correct and authSeller works

export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request); // Extracts userId from Clerk authentication
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized: User not logged in" }, { status: 401 });
    }

    // Check if the authenticated user has a seller role
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      // 403 Forbidden is appropriate if user is authenticated but not authorized for the role
      return NextResponse.json({ success: false, message: "Forbidden: User is not a seller" }, { status: 403 });
    }

    const { id } = params; // Gets the promo code ID from the URL path
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Promo code ID is required in the URL path",
      }, { status: 400 });
    }

    await connectDB(); // Establish database connection

    // Find the promo code by its ID and delete it.
    // This does NOT check who created the promo code.
    const deletedPromoCode = await PromoCode.findByIdAndDelete(id);

    if (!deletedPromoCode) {
      // If no promo code is found with that ID
      return NextResponse.json({
        success: false,
        message: "Promo code not found",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Promo code deleted successfully by a seller", // Updated message for clarity
    });

  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An error occurred while deleting the promo code.",
    }, { status: 500 });
  }
}