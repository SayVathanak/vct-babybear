import { NextResponse } from "next/server";

export async function GET() {
  try {
    const startTime = Date.now();
    const healthData = {
      service: "bakong-khqr-api",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    };

    // Check if Bakong token is configured
    const bakongToken = process.env.BAKONG_API_TOKEN;
    const bakongApiUrl = process.env.BAKONG_API_URL;
    
    let tokenStatus = "missing";
    let apiConnectivity = "unknown";
    
    if (bakongToken) {
      tokenStatus = "configured";
      
      // Test API connectivity if URL is configured
      if (bakongApiUrl) {
        try {
          const testResponse = await fetch(`${bakongApiUrl}/health`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${bakongToken}`
            },
            timeout: 5000 // 5 second timeout
          });
          
          apiConnectivity = testResponse.ok ? "connected" : "error";
        } catch (connectError) {
          console.warn("Bakong API connectivity test failed:", connectError.message);
          apiConnectivity = "unreachable";
        }
      }
    }

    // Check KHQR SDK availability
    let sdkStatus = "unknown";
    try {
      const { BakongKHQR } = await import("bakong-khqr");
      sdkStatus = BakongKHQR ? "available" : "missing";
    } catch (sdkError) {
      console.warn("KHQR SDK check failed:", sdkError.message);
      sdkStatus = "error";
    }

    const responseTime = Date.now() - startTime;
    
    // Determine overall health status
    let overallStatus = "healthy";
    const issues = [];
    
    if (tokenStatus === "missing") {
      issues.push("Bakong API token not configured");
      overallStatus = "degraded";
    }
    
    if (apiConnectivity === "error" || apiConnectivity === "unreachable") {
      issues.push("Bakong API connectivity issues");
      overallStatus = "degraded";
    }
    
    if (sdkStatus === "error" || sdkStatus === "missing") {
      issues.push("KHQR SDK not available");
      overallStatus = "unhealthy";
    }

    const healthResponse = {
      status: overallStatus,
      message: overallStatus === "healthy" ? 
        "Bakong QR Service is running" : 
        `Service issues detected: ${issues.join(", ")}`,
      ...healthData,
      checks: {
        bakong_token: tokenStatus,
        api_connectivity: apiConnectivity,
        khqr_sdk: sdkStatus
      },
      response_time_ms: responseTime,
      issues: issues.length > 0 ? issues : undefined
    };

    const statusCode = overallStatus === "healthy" ? 200 : 
                      overallStatus === "degraded" ? 200 : 503;

    return NextResponse.json(healthResponse, { status: statusCode });

  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message,
      service: "bakong-khqr-api",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}