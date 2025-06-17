import connectDB from "@/config/db";
import Address from "@/models/Address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { addressId } = params;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!addressId) {
      return NextResponse.json({ success: false, message: "Address ID is required" }, { status: 400 });
    }

    await connectDB();

    // Find and delete the address, ensuring it belongs to the user
    const deletedAddress = await Address.findOneAndDelete({ _id: addressId, userId });
    
    if (!deletedAddress) {
      return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to delete address" 
    }, { status: 500 });
  }
}