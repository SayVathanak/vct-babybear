import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
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
      bakongPaymentDetails 
    } = requestData;

    if (!address || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json({ success: false, message: "Invalid data: Address, items, and payment method are required." }, { status: 400 });
    }
    
    await connectDB();

    // --- INVENTORY VALIDATION ---
    for (const item of items) {
        const productDoc = await Product.findById(item.product).lean();
        if (!productDoc) {
            return NextResponse.json({ success: false, message: `Product with ID ${item.product} not found.` }, { status: 404 });
        }
        if (productDoc.stock < item.quantity) {
            return NextResponse.json({ success: false, message: `Not enough stock for ${productDoc.name}. Only ${productDoc.stock} left.` }, { status: 400 });
        }
    }
    // --- END INVENTORY VALIDATION ---

    if (paymentMethod === "ABA" && !paymentTransactionImage) {
        return NextResponse.json({ success: false, message: "Transaction proof is required for ABA payment." }, { status: 400 });
    }
    if (paymentMethod === "Bakong" && (!bakongPaymentDetails || !bakongPaymentDetails.md5)) {
        return NextResponse.json({ success: false, message: "Bakong payment details (MD5 hash) are required." }, { status: 400 });
    }

    const calculatedSubtotal = Number(
      (await items.reduce(async (accPromise, item) => {
        const acc = await accPromise;
        const productDoc = await Product.findById(item.product).lean();
        // We already checked for the product existence, so no need to re-validate here.
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

    let orderPaymentStatus = 'pending';
    let orderPaymentConfirmationStatus = 'na';

    if (paymentMethod === 'ABA') {
      orderPaymentStatus = 'pending_confirmation';
      orderPaymentConfirmationStatus = 'pending_review';
    } else if (paymentMethod === 'COD') {
      orderPaymentStatus = 'pending';
    } else if (paymentMethod === 'Bakong') {
      orderPaymentStatus = 'pending';
    }

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
        ...(paymentMethod === 'Bakong' && { bakongPaymentDetails })
    };
    
    // The order data is validated, now send it to Inngest for processing
    await inngest.send({
      name: "order/created",
      data: finalOrderDataForEvent 
    });

    // Clear user's cart after successful order submission
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
