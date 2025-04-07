import connectDB from "@/config/db";
import { sendOrderConfirmationEmail } from '@/lib/emailService';
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Authenticate the user with Clerk
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized access"
      }, { status: 401 });
    }

    // Parse the request body
    const { user, orderDetails } = await request.json();

    // Validate required data
    if (!user?.email || !orderDetails || !orderDetails.orderId) {
      return NextResponse.json({
        success: false,
        message: "Missing required data"
      }, { status: 400 });
    }

    // Connect to the database if needed
    await connectDB();

    // Send the email
    const result = await sendOrderConfirmationEmail({
      user,
      orderDetails
    });

    if (!result.success) {
      console.error("Email sending failed:", result.error);
      return NextResponse.json({
        success: false,
        message: "Failed to send email",
        error: result.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      emailId: result.data?.id
    });
  } catch (error) {
    console.error("Error in send-order-email API:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Internal server error"
    }, { status: 500 });
  }
}