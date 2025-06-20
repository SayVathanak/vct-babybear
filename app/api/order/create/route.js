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
      paymentTransactionImage,
      paymentTransactionId
    } = requestData;

    console.log("Received request data for order creation:", requestData);

    // --- Validation ---
    if (!address || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json({ success: false, message: "Invalid data: Address, items, and payment method are required." }, { status: 400 });
    }

    if (paymentMethod === "ABA" && !paymentTransactionImage) {
        return NextResponse.json({ success: false, message: "Transaction proof is required for ABA payment." }, { status: 400 });
    }

    // <-- MODIFIED: Check for 'BAKONG' and update error message
    if (paymentMethod === "BAKONG" && !paymentTransactionId) {
        return NextResponse.json({ success: false, message: "Transaction ID is required for Bakong payment." }, { status: 400 });
    }
    
    await connectDB();

    // --- Server-Side Calculation (code unchanged) ---
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
    const finalAmount = requestAmount !== undefined ? Number(requestAmount.toFixed(2)) : Number((subtotal + deliveryFee - discount).toFixed(2));
    // --- End of calculation ---

    let orderPaymentStatus = 'pending';
    let orderPaymentConfirmationStatus = 'na'; 

    if (paymentMethod === 'ABA') {
      orderPaymentStatus = 'pending_confirmation';
      orderPaymentConfirmationStatus = 'pending_review';
    } else if (paymentMethod === 'COD') {
      orderPaymentStatus = 'pending';
    } else if (paymentMethod === 'BAKONG') { // <-- MODIFIED: Check for 'BAKONG'
      orderPaymentStatus = 'paid';
      orderPaymentConfirmationStatus = 'confirmed';
    }
    
    const newOrderData = {
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
        paymentTransactionId: paymentMethod === 'BAKONG' ? paymentTransactionId : null, // <-- MODIFIED: Check for 'BAKONG'
        paymentStatus: orderPaymentStatus,
        paymentConfirmationStatus: orderPaymentConfirmationStatus
    };
    
    const createdOrder = await Order.create(newOrderData);
    
    console.log("Order successfully created in MongoDB:", createdOrder);
    console.log("Sending created order to Inngest:", createdOrder);

    await inngest.send({
      name: "order/created",
      data: createdOrder 
    });

    await User.updateOne({ _id: userId }, { $set: { cartItems: {} } });

    return NextResponse.json({
      success: true,
      message: "Order Placed successfully. Awaiting processing.",
      orderData: createdOrder
    });

  } catch (error) {
    console.error("Error in order creation:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create order." }, { status: 500 });
  }
}