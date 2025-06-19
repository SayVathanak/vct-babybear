// app/api/khqr/generate-qr/route.js
import { BakongKHQR, MerchantInfo, khqrData } from 'bakong-khqr';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(req) {
  try {
    const { amount, currency } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Load required merchant details from environment variables
    const merchantId = process.env.BAKONG_MERCHANT_ID;
    const merchantName = process.env.BAKONG_MERCHANT_NAME;
    const acquiringBank = process.env.BAKONG_ACQUIRING_BANK;

    if (!merchantId || !merchantName || !acquiringBank) {
      console.error("Bakong merchant details are not fully set in environment variables.");
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }
    
    // As per the official SDK docs, optional data is passed in an object
    const optionalData = {
      currency: currency === 'USD' ? khqrData.currency.usd : khqrData.currency.khr,
      amount: parseFloat(amount),
      billNumber: `TRX${Date.now()}`,
      mobileNumber: '855928866006', // From python example
      storeLabel: 'Baby Bear',      // From python example
      terminalLabel: 'Cashier-01',  // From python example
    };

    // Use the official SDK's MerchantInfo class
    const merchantInfo = new MerchantInfo(
      merchantId,      // Bakong Account ID
      merchantName,
      'Phnom Penh',    // Merchant City
      merchantId,      // Merchant ID
      acquiringBank,
      optionalData
    );

    const KHQR = new BakongKHQR();
    const response = KHQR.generateMerchant(merchantInfo);

    if (response.status.code !== 0) {
      return NextResponse.json({ error: 'Failed to generate KHQR string from SDK', details: response.status.message }, { status: 500 });
    }

    const qrDataString = response.data.qr;
    const md5Hash = response.data.md5;

    const qrCodeImage = await QRCode.toDataURL(qrDataString);

    return NextResponse.json({
      success: true,
      qr_image_base64: qrCodeImage,
      transaction_hash: md5Hash,
    });

  } catch (error) {
    console.error('Error in generate-qr:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}