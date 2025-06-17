import connectDB from "@/config/db";
import Address from "@/models/Address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { addressId } = params;
    const { address } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!addressId) {
      return NextResponse.json({ success: false, message: "Address ID is required" }, { status: 400 });
    }

    await connectDB();

    // Find the address and ensure it belongs to the user
    const existingAddress = await Address.findOne({ _id: addressId, userId });
    
    if (!existingAddress) {
      return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
    }

    // Update the address
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { ...address, userId }, // Ensure userId is preserved
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to update address" 
    }, { status: 500 });
  }
}