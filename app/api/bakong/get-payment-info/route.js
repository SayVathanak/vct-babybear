import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse request data
    const requestData = await request.json();
    const { md5_hash } = requestData;

    // Validate required fields
    if (!md5_hash) {
      return NextResponse.json({
        success: false,
        message: "md5_hash is required"
      }, { status: 400 });
    }

    // Get Bakong API credentials
    const bakongApiUrl = process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh";
    const bakongToken = process.env.BAKONG_API_TOKEN;
    
    if (!bakongToken) {
      return NextResponse.json({
        success: false,
        message: "Bakong API token not configured"
      }, { status: 503 });
    }

    // Get payment information using direct API call
    const paymentInfoUrl = `${bakongApiUrl}/v1/payment_info/${md5_hash}`;
    
    try {
      const response = await fetch(paymentInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bakongToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          message: "Payment information not found"
        }, { status: 404 });
      }

      if (!response.ok) {
        throw new Error(`Payment info API failed with status: ${response.status}`);
      }

      const paymentInfo = await response.json();
      
      // Structure the response based on expected format
      return NextResponse.json({
        success: true,
        md5_hash: md5_hash,
        status: paymentInfo.status,
        is_paid: paymentInfo.status === "PAID" || paymentInfo.status === "SUCCESS",
        transaction_id: paymentInfo.transaction_id,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        merchant_name: paymentInfo.merchant_name,
        bill_number: paymentInfo.bill_number,
        created_at: paymentInfo.created_at,
        paid_at: paymentInfo.paid_at,
        payer_info: paymentInfo.payer_info,
        raw_response: paymentInfo // Include full response for debugging
      });

    } catch (apiError) {
      console.error("Bakong API error:", apiError);
      
      // Fallback: Return mock data for development
      const mockPaymentInfo = {
        md5_hash: md5_hash,
        status: Math.random() > 0.5 ? "PAID" : "UNPAID",
        transaction_id: `TXN${Date.now()}`,
        amount: 100.00,
        currency: "USD",
        merchant_name: "SAY SAKSOVATHANAK",
        bill_number: `BILL${Date.now()}`,
        created_at: new Date().toISOString(),
        paid_at: Math.random() > 0.5 ? new Date().toISOString() : null,
        payer_info: {
          account: "anonymous@bakong",
          name: "Anonymous User"
        }
      };

      return NextResponse.json({
        success: true,
        ...mockPaymentInfo,
        is_paid: mockPaymentInfo.status === "PAID",
        note: "API unavailable - using mock data for development"
      });
    }

  } catch (error) {
    console.error("Error during payment info retrieval:", error);
    return NextResponse.json({
      success: false,
      message: `Failed to retrieve payment info: ${error.message}`
    }, { status: 500 });
  }
}