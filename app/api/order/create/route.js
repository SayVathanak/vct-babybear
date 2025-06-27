import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import mongoose from "mongoose";

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
      return NextResponse.json({ 
        success: false, 
        message: "Invalid data: Address, items, and payment method are required." 
      }, { status: 400 });
    }
    
    await connectDB();

    // --- ENHANCED INVENTORY VALIDATION ---
    const stockValidationErrors = [];
    const validatedItems = [];
    
    for (const item of items) {
      const productDoc = await Product.findById(item.product).lean();
      
      if (!productDoc) {
        stockValidationErrors.push(`Product with ID ${item.product} not found`);
        continue;
      }
      
      if (!productDoc.isAvailable) {
        stockValidationErrors.push(`${productDoc.name} is currently unavailable`);
        continue;
      }
      
      if (productDoc.stock < item.quantity) {
        stockValidationErrors.push(
          `${productDoc.name} only has ${productDoc.stock} items in stock (requested ${item.quantity})`
        );
        continue;
      }
      
      validatedItems.push({
        ...item,
        productName: productDoc.name,
        availableStock: productDoc.stock,
        price: productDoc.offerPrice || productDoc.price
      });
    }

    if (stockValidationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Stock validation failed',
        errors: stockValidationErrors
      }, { status: 400 });
    }
    // --- END ENHANCED INVENTORY VALIDATION ---

    if (paymentMethod === "ABA" && !paymentTransactionImage) {
      return NextResponse.json({ 
        success: false, 
        message: "Transaction proof is required for ABA payment." 
      }, { status: 400 });
    }
    
    if (paymentMethod === "Bakong" && (!bakongPaymentDetails || !bakongPaymentDetails.md5)) {
      return NextResponse.json({ 
        success: false, 
        message: "Bakong payment details (MD5 hash) are required." 
      }, { status: 400 });
    }

    const calculatedSubtotal = Number(
      validatedItems.reduce((acc, item) => {
        return acc + item.price * item.quantity;
      }, 0).toFixed(2)
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // --- FIX: Generate a new ObjectId and create a user-friendly orderId ---
      const newMongoId = new mongoose.Types.ObjectId();
      const userFriendlyOrderId = `ORD-${newMongoId.toString().slice(-8).toUpperCase()}`;

      const order = new Order({
        _id: newMongoId, // Use the pre-generated ID
        orderId: userFriendlyOrderId, // Save the user-friendly ID
        userId,
        address,
        items: validatedItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          productName: item.productName,
          price: item.price
        })),
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
      });

      await order.save({ session });

      for (const item of validatedItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      const userDoc = await User.findById(userId);
      if (userDoc) {
        userDoc.cartItems = {};
        await userDoc.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      const finalOrderDataForEvent = {
        ...order.toObject(), // Use the full order object
      };
      
      await inngest.send({
        name: "order/created",
        data: finalOrderDataForEvent 
      });

      return NextResponse.json({
        success: true,
        message: "Order placed successfully",
        orderId: order.orderId, // Return the user-friendly ID
        orderData: finalOrderDataForEvent
      });

    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error("Error in order creation:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to create order." 
    }, { status: 500 });
  }
}
