import { NextResponse } from "next/server";

// Alternative approach: Store payment status in database and update via webhook
export async function POST(request) {
  try {
    const requestData = await request.json();
    const { md5_hash } = requestData;

    if (!md5_hash) {
      return NextResponse.json({
        success: false,
        message: "md5_hash is required"
      }, { status: 400 });
    }

    // Option 1: Check from your database (recommended)
    // You would store payment status when webhook is received from Bakong
    /*
    const paymentRecord = await db.payments.findOne({ md5_hash });
    
    if (!paymentRecord) {
      return NextResponse.json({
        success: false,
        message: "Payment record not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: paymentRecord.status,
      is_paid: paymentRecord.status === "PAID",
      updated_at: paymentRecord.updated_at
    });
    */

    // Option 2: Mock response for testing
    // Remove this in production
    const mockStatuses = ["PAID", "UNPAID", "PENDING"];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
    
    return NextResponse.json({
      success: true,
      status: randomStatus,
      is_paid: randomStatus === "PAID",
      note: "This is a mock response - implement actual database check"
    });

  } catch (error) {
    console.error("Error during payment check:", error);
    return NextResponse.json({
      success: false,
      message: `Failed to check payment status: ${error.message}`
    }, { status: 500 });
  }
}

// Webhook endpoint to receive payment updates from Bakong
export async function PUT(request) {
  try {
    const webhookData = await request.json();
    
    // Verify webhook signature if required
    const signature = request.headers.get('x-bakong-signature');
    // ... verify signature logic
    
    const { md5_hash, status, transaction_id } = webhookData;
    
    // Update payment status in your database
    /*
    await db.payments.updateOne(
      { md5_hash },
      { 
        status, 
        transaction_id,
        updated_at: new Date(),
        webhook_data: webhookData 
      }
    );
    */
    
    console.log(`Payment ${md5_hash} updated to status: ${status}`);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}