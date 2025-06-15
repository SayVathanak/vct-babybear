import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import PromoCode from "@/models/PromoCode";
import Order from "@/models/Order"; // Make sure to import your Order model
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
      paymentMethod, // New field
      paymentTransactionImage // New field (filename or URL)
    } = requestData;

    console.log("Received request data for order creation:", requestData);

    if (!address || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json({ success: false, message: "Invalid data: Address, items, and payment method are required." }, { status: 400 });
    }

    if (paymentMethod === "ABA" && !paymentTransactionImage) {
        return NextResponse.json({ success: false, message: "Transaction proof is required for ABA payment." }, { status: 400 });
    }

    await connectDB();

    const calculatedSubtotal = Number(
      (await items.reduce(async (accPromise, item) => {
        const acc = await accPromise;
        const productDoc = await Product.findById(item.product).lean(); // Use .lean() for plain JS object
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
        // Ensure discountType and discountValue are also passed if needed by the Order model
        discountType: requestPromoDetails.discountType, 
        discountValue: requestPromoDetails.discountValue  
      };
      discount = requestDiscount || discount;
    } else if (promoCodeId) {
      const promoCodeDoc = await PromoCode.findOne({
        _id: promoCodeId,
        isActive: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } }
        ]
      }).lean();

      if (promoCodeDoc) {
        if (!promoCodeDoc.minPurchaseAmount || subtotal >= promoCodeDoc.minPurchaseAmount) {
          if (promoCodeDoc.discountType === "percentage") {
            const validPercentage = Math.min(Math.max(promoCodeDoc.discountValue, 0), 100);
            discount = (subtotal * validPercentage) / 100;
            if (promoCodeDoc.maxDiscountAmount && discount > promoCodeDoc.maxDiscountAmount) {
              discount = promoCodeDoc.maxDiscountAmount;
            }
          } else if (promoCodeDoc.discountType === "fixed") {
            discount = Math.min(promoCodeDoc.discountValue, subtotal);
          }
          discount = Number(discount.toFixed(2));
          
          // Increment usage count (important: do this on the actual PromoCode model, not the lean object)
          await PromoCode.updateOne({ _id: promoCodeId }, { $inc: { usageCount: 1 } });

          promoCodeDetails = {
            id: promoCodeDoc._id,
            code: promoCodeDoc.code,
            discountAmount: discount,
            discountType: promoCodeDoc.discountType,
            discountValue: promoCodeDoc.discountValue
          };
        }
      }
    }

    const finalAmount = requestAmount !== undefined ? Number(requestAmount.toFixed(2)) : Number((subtotal + deliveryFee - discount).toFixed(2));

    // Determine paymentStatus and paymentConfirmationStatus based on paymentMethod
    let orderPaymentStatus = 'pending';
    let orderPaymentConfirmationStatus = 'na'; // Not applicable by default

    if (paymentMethod === 'ABA') {
      orderPaymentStatus = 'pending_confirmation'; // Or 'pending' if you prefer, then seller confirms to 'paid'
      orderPaymentConfirmationStatus = 'pending_review';
    } else if (paymentMethod === 'COD') {
      // For COD, payment is typically made upon delivery.
      // paymentStatus remains 'pending' until delivery and payment confirmation.
      // paymentConfirmationStatus is 'na' as it's not an upfront bank transfer.
    }


    const orderDataForInngest = { // This is for the event, not directly for DB save if schema differs
      userId,
      address, // Should be address ID
      items,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      discount: discount,
      promoCode: promoCodeDetails, // This should match the structure expected by Inngest/Order model
      amount: finalAmount,
      date: Date.now(),
      paymentMethod: paymentMethod,
      paymentTransactionImage: paymentTransactionImage, // Filename or URL
      // status: 'Order Placed', // Set by default in schema or here
      // paymentStatus: orderPaymentStatus, // Set based on logic above
      // paymentConfirmationStatus: orderPaymentConfirmationStatus // Set based on logic above
    };
    
    // Create the order document for DB
    const newOrder = {
        userId,
        address, // Assuming this is the Address ID string
        items,
        subtotal,
        deliveryFee,
        discount,
        promoCode: promoCodeDetails, // Save the detailed promo object
        amount: finalAmount,
        date: Date.now(),
        status: 'Order Placed', // Initial status
        paymentMethod,
        paymentTransactionImage,
        paymentStatus: orderPaymentStatus,
        paymentConfirmationStatus: orderPaymentConfirmationStatus
    };


    // Send to Inngest first, so if DB fails, we might have a record in Inngest
    // However, it's often better to save to DB first to get an order ID.
    // For this example, let's assume Inngest can handle an order without a pre-existing DB ID or uses a temporary one.
    
    // The `inngest.send` for "order/created" might trigger the actual order saving to DB
    // via an Inngest function. If so, the data sent to Inngest should be complete.
    // If this API route is *solely* responsible for DB saving, then save here.
    // The provided `create.js` sends to Inngest and then clears cart, implying Inngest handles DB.
    // Let's adjust `orderDataForInngest` to include all necessary fields for DB creation by Inngest.

    const finalOrderDataForEvent = {
        ...orderDataForInngest, // contains most fields
        status: 'Order Placed', // Explicitly set initial status for the event
        paymentStatus: orderPaymentStatus,
        paymentConfirmationStatus: orderPaymentConfirmationStatus
    };
    
    console.log("Final order data being sent to Inngest:", finalOrderDataForEvent);

    await inngest.send({
      name: "order/created", // This Inngest function should handle saving the order to MongoDB
      data: finalOrderDataForEvent 
    });

    // Clear user's cart (assuming Inngest successfully creates the order)
    const userDoc = await User.findById(userId);
    if (userDoc) {
        userDoc.cartItems = {};
        await userDoc.save();
    }

    return NextResponse.json({
      success: true,
      message: "Order Placed successfully. Awaiting processing.",
      // orderId: newOrder._id // If saved here, you'd have an ID. If Inngest saves, ID comes later.
      // For now, let's assume Inngest event is the source of truth for creation.
      orderData: finalOrderDataForEvent // Return the data sent, useful for client if needed
    });

  } catch (error) {
    console.error("Error in order creation:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create order." }, { status: 500 });
  }
}