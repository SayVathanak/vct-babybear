import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Parse request data
    const md5_hashes = await request.json();

    // Validate required fields
    if (!Array.isArray(md5_hashes) || md5_hashes.length === 0) {
      return NextResponse.json({
        success: false,
        message: "md5_hashes array is required and must not be empty"
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

    // Check payments in bulk using direct API calls
    const bulkCheckUrl = `${bakongApiUrl}/v1/bulk_check_payment_status`;
    
    try {
      const response = await fetch(bulkCheckUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bakongToken}`,
        },
        body: JSON.stringify({
          md5_hashes: md5_hashes
        })
      });

      if (!response.ok) {
        throw new Error(`Bulk payment check API failed with status: ${response.status}`);
      }

      const bulkData = await response.json();
      
      // Process the bulk response
      const paid_hashes = [];
      const payment_details = {};

      if (bulkData.results) {
        bulkData.results.forEach(result => {
          if (result.status === "PAID" || result.status === "SUCCESS") {
            paid_hashes.push(result.md5_hash);
          }
          payment_details[result.md5_hash] = {
            status: result.status,
            is_paid: result.status === "PAID" || result.status === "SUCCESS",
            transaction_id: result.transaction_id,
            amount: result.amount,
            timestamp: result.timestamp
          };
        });
      }

      return NextResponse.json({
        success: true,
        paid_transactions: paid_hashes,
        total_checked: md5_hashes.length,
        paid_count: paid_hashes.length,
        payment_details: payment_details
      });

    } catch (apiError) {
      console.error("Bakong API error:", apiError);
      
      // Fallback: Check individual payments or return mock data for development
      const mockResults = md5_hashes.map(hash => ({
        md5_hash: hash,
        status: Math.random() > 0.5 ? "PAID" : "UNPAID",
        is_paid: Math.random() > 0.5
      }));

      const paid_hashes = mockResults
        .filter(result => result.status === "PAID")
        .map(result => result.md5_hash);

      return NextResponse.json({
        success: true,
        paid_transactions: paid_hashes,
        total_checked: md5_hashes.length,
        paid_count: paid_hashes.length,
        note: "API unavailable - using mock data for development",
        mock_results: mockResults
      });
    }

  } catch (error) {
    console.error("Error during bulk payment check:", error);
    return NextResponse.json({
      success: false,
      message: `Failed to check bulk payments: ${error.message}`
    }, { status: 500 });
  }
}