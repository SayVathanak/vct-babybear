import { NextResponse } from "next/server";
import { BakongKHQR, khqrData, IndividualInfo } from "bakong-khqr";

export async function POST(request) {
  try {
    // Initialize KHQR client (no token needed based on docs)
    const khqrClient = new BakongKHQR();

    // Parse request data
    const requestData = await request.json();
    const {
      amount,
      bill_number,
      currency = "USD",
      generate_deeplink = false,
      callback_url,
      app_name = "Baby Bear",
      app_icon_url
    } = requestData;

    // Validate required fields
    if (!amount || !bill_number) {
      return NextResponse.json({
        success: false,
        message: "Amount and bill_number are required"
      }, { status: 400 });
    }

    // Prepare optional data based on documentation structure
    const optionalData = {
      currency: currency === "USD" ? khqrData.currency.usd : khqrData.currency.khr,
      amount: parseFloat(amount),
      billNumber: bill_number,
      mobileNumber: "85592886006",
      storeLabel: "Baby Bear",
      terminalLabel: "Cashier-01"
    };

    // Create IndividualInfo object based on documentation
    const individualInfo = new IndividualInfo(
      "say_vathanak@aclb",        // bakongAccountId
      "SAY SAKSOVATHANAK",        // merchantName
      "Phnom Penh",               // merchantCity
      optionalData                // optional data object
    );

    // Generate the QR using the correct method from documentation
    const response = khqrClient.generateIndividual(individualInfo);

    // Check if generation was successful
    if (response.status.code !== 0) {
      return NextResponse.json({
        success: false,
        message: `QR generation failed: ${response.status.message}`,
        error_code: response.status.errorCode
      }, { status: 400 });
    }

    const response_data = {
      qr_string: response.data.qr,
      md5_hash: response.data.md5
    };

    // Generate deeplink if requested
    if (generate_deeplink) {
      try {
        // Import SourceInfo for deeplink generation
        const { SourceInfo } = await import("bakong-khqr");
        
        // Set default callback URL if not provided
        const final_callback_url = callback_url || "https://vct-babybear.vercel.app/payment-success";
        
        // Set default app icon URL if not provided
        const final_app_icon_url = app_icon_url || "https://vct-babybear.vercel.app/logo.png";
        
        // Create SourceInfo object
        const sourceInfo = new SourceInfo(
          final_app_icon_url,
          app_name,
          final_callback_url
        );

        // Generate deeplink using the correct method signature
        // Note: You'll need to provide the correct deeplink API URL from NBC
        const deeplink_api_url = process.env.BAKONG_DEEPLINK_API_URL || "http://api.example.com/v1/generate_deeplink_by_qr";
        
        const deeplinkResponse = await khqrClient.generateDeepLink(
          deeplink_api_url,
          response.data.qr,
          sourceInfo
        );
        
        if (deeplinkResponse.status.code === 0) {
          response_data.deeplink = deeplinkResponse.data.shortLink;
        } else {
          console.warn("Deeplink generation failed:", deeplinkResponse.status.message);
          response_data.deeplink = null;
        }
        
      } catch (deeplink_error) {
        console.error("Warning: Failed to generate deeplink:", deeplink_error);
        response_data.deeplink = null;
      }
    }

    return NextResponse.json({
      success: true,
      ...response_data
    });

  } catch (error) {
    console.error("Error during QR generation:", error);
    return NextResponse.json({
      success: false,
      message: `Failed to generate QR code: ${error.message}`
    }, { status: 500 });
  }
}