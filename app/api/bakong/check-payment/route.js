// app/api/bakong/check-payment/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { transaction_hash } = await req.json();
    const bakongToken = process.env.BAKONG_TOKEN;

    if (!transaction_hash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }
    if (!bakongToken) {
      return NextResponse.json({ error: 'Bakong token not configured on server' }, { status: 500 });
    }

    // Call the correct Bakong API endpoint
    const response = await fetch('https://api-bakong.nbc.org.kh/v1/check_transaction_by_md5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bakongToken}`,
      },
      body: JSON.stringify({ md5: transaction_hash }),
    });

    const result = await response.json();

    // Check for success based on the official documentation's responseCode
    const isPaid = result.responseCode === 0 && result.data && result.data.hash;

    return NextResponse.json({
      success: true,
      status: isPaid ? 'PAID' : 'PENDING',
      is_paid: isPaid,
      bakong_response: result, // Include for debugging
    });

  } catch (error) {
    console.error('Error checking Bakong payment:', error);
    return NextResponse.json({ error: 'Failed to check payment status.' }, { status: 500 });
  }
}