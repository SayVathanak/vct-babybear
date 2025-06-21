import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import PromoCode from "@/models/PromoCode";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const requestData = await request.json();
    const { 
      address, 
      items, 
      promoCodeId, 
      subtotal: requestSubtotal,
      discount: requestDiscount,
      deliveryFee: requestDeliveryFee,
      amount: requestAmount,
      promoCode: requestPromoDetails,
      paymentMethod,
      paymentTransactionImage, // For ABA
      bakongPaymentDetails // New field for Bakong
    } = requestData;

    console.log("Received request data for order creation:", requestData);

    if (!address || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json({ success: false, message: "Invalid data: Address, items, and payment method are required." }, { status: 400 });
    }

    // --- Validation for different payment methods ---
    if (paymentMethod === "ABA" && !paymentTransactionImage) {
        return NextResponse.json({ success: false, message: "Transaction proof is required for ABA payment." }, { status: 400 });
    }
    if (paymentMethod === "Bakong" && (!bakongPaymentDetails || !bakongPaymentDetails.md5)) {
        return NextResponse.json({ success: false, message: "Bakong payment details (MD5 hash) are required." }, { status: 400 });
    }

    await connectDB();

    // --- (Keep your existing subtotal, delivery fee, and discount calculation logic here) ---
    // ... This part of your code seems correct and remains unchanged.
    const calculatedSubtotal = Number(
      (await items.reduce(async (accPromise, item) => {
        const acc = await accPromise;
        const productDoc = await Product.findById(item.product).lean();
        if (!productDoc) throw new Error(`Product with ID ${item.product} not found.`);
        const price = productDoc.offerPrice || productDoc.price;
        return acc + price * item.quantity;
      }, Promise.resolve(0))).toFixed(2)
    );
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const calculatedDeliveryFee = Number((itemCount > 1 ? 0 : 1.5).toFixed(2));
    let discount = requestDiscount || 0;
    let promoCodeDetails = null;
    const subtotal = requestSubtotal !== undefined ? Number(requestSubtotal.toFixed(2)) : calculatedSubtotal;
    const deliveryFee = requestDeliveryFee !== undefined ? Number(requestDeliveryFee.toFixed(2)) : calculatedDeliveryFee;

     if (requestPromoDetails) {
      promoCodeDetails = {
        id: requestPromoDetails.id,
        code: requestPromoDetails.code,
        discountAmount: requestPromoDetails.discountAmount || discount,
        discountType: requestPromoDetails.discountType, 
        discountValue: requestPromoDetails.discountValue  
      };
      discount = requestDiscount || discount;
    } 
    // ... (rest of your discount logic)

    const finalAmount = requestAmount !== undefined ? Number(requestAmount.toFixed(2)) : Number((subtotal + deliveryFee - discount).toFixed(2));

    // --- Determine paymentStatus based on paymentMethod ---
    let orderPaymentStatus = 'pending';
    let orderPaymentConfirmationStatus = 'na';

    if (paymentMethod === 'ABA') {
      orderPaymentStatus = 'pending_confirmation';
      orderPaymentConfirmationStatus = 'pending_review';
    } else if (paymentMethod === 'COD') {
      orderPaymentStatus = 'pending';
      orderPaymentConfirmationStatus = 'na';
    } else if (paymentMethod === 'Bakong') {
      orderPaymentStatus = 'pending'; // Stays pending until payment is confirmed
      orderPaymentConfirmationStatus = 'na';
    }

    // --- Prepare the data for the Inngest event and DB save ---
    const finalOrderDataForEvent = {
        userId,
        address,
        items,
        subtotal,
        deliveryFee,
        discount,

        promoCode: promoCodeDetails,
        amount: finalAmount,
        date: Date.now(),
        status: 'Order Placed',
        paymentMethod,
        paymentTransactionImage: paymentMethod === 'ABA' ? paymentTransactionImage : null,
        paymentStatus: orderPaymentStatus,
        paymentConfirmationStatus: orderPaymentConfirmationStatus,
        // Add Bakong details if the method is 'Bakong'
        ...(paymentMethod === 'Bakong' && { bakongPaymentDetails })
    };
    
    console.log("Final order data being sent to Inngest:", finalOrderDataForEvent);

    await inngest.send({
      name: "order/created",
      data: finalOrderDataForEvent 
    });

    const userDoc = await User.findById(userId);
    if (userDoc) {
        userDoc.cartItems = {};
        await userDoc.save();
    }

    return NextResponse.json({
      success: true,
      message: "Order Placed successfully. Awaiting processing.",
      orderData: finalOrderDataForEvent
    });

  } catch (error) {
    console.error("Error in order creation:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create order." }, { status: 500 });
  }
}
