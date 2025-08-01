import { NextResponse } from "next/server";
import { BakongKHQR, khqrData, IndividualInfo } from "bakong-khqr";

export async function POST(request) {
  try {
    const khqrClient = new BakongKHQR();

    const requestData = await request.json();
    const {
      amount,
      bill_number,
      currency = "USD",
      generate_deeplink = false,
      callback_url,
      app_name = "Baby Bear",
      app_icon_url,
    } = requestData;

    if (!amount || !bill_number) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount and bill_number are required",
        },
        { status: 400 }
      );
    }

    const optionalData = {
      currency:
        currency === "USD" ? khqrData.currency.usd : khqrData.currency.khr,
      amount: parseFloat(amount),
      billNumber: bill_number,
      mobileNumber: "85592886006",
      storeLabel: "Baby Bear",
      terminalLabel: "Cashier-01",
    };

    const individualInfo = new IndividualInfo(
      "say_vathanak@aclb",
      "SAY SAKSOVATHANAK",
      "Phnom Penh",
      optionalData
    );

    const response = khqrClient.generateIndividual(individualInfo);

    if (response.status.code !== 0) {
      return NextResponse.json(
        {
          success: false,
          message: `QR generation failed: ${response.status.message}`,
          error_code: response.status.errorCode,
        },
        { status: 400 }
      );
    }

    const response_data = {
      qr_string: response.data.qr,
      md5_hash: response.data.md5,
    };

    if (generate_deeplink) {
      // ✅ CORRECTED: Switched from SDK to a direct API call using fetch
      try {
        const final_callback_url =
          callback_url || process.env.BAKONG_CALLBACK_URL;
        const final_app_icon_url =
          app_icon_url || process.env.BAKONG_APP_ICON_URL;
        const deeplink_api_url = process.env.BAKONG_DEEPLINK_API_URL;

        // Construct the request body to match the new API specification
        const apiRequestBody = {
          qr: response.data.qr,
          sourceInfo: {
            appIconUrl: final_app_icon_url,
            appName: app_name,
            appDeepLinkCallback: final_callback_url,
          },
        };

        // Make the POST request to the deeplink API
        const apiResponse = await fetch(deeplink_api_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiRequestBody),
        });

        const deeplinkData = await apiResponse.json();

        // Check the responseCode from the API call for success
        if (deeplinkData.responseCode === 0) {
          response_data.deeplink = deeplinkData.data.shortLink;
        } else {
          console.warn(
            `Deeplink API returned an error: ${deeplinkData.responseMessage}`
          );
          response_data.deeplink = null;
        }
      } catch (error) {
        console.error("Failed to call the deeplink generation API:", error);
        response_data.deeplink = null;
      }
    }

    return NextResponse.json({
      success: true,
      ...response_data,
    });
  } catch (error) {
    console.error("Error during QR generation:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate QR code: ${error.message}`,
      },
      { status: 500 }
    );
  }
}