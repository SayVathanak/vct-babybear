import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import PromoCode from "@/models/PromoCode";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

// Helper to generate a simple Order ID
const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
};

// In-memory cache to prevent duplicate orders (use Redis in production)
const processingOrders = new Map();

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
      paymentTransactionImage
    } = requestData;

    console.log("Received request data for order creation:", requestData);

    if (!address || !items || items.length === 0 || !paymentMethod) {
      return NextResponse.json({ success: false, message: "Invalid data: Address, items, and payment method are required." }, { status: 400 });
    }

    if (paymentMethod === "ABA" && !paymentTransactionImage) {
        return NextResponse.json({ success: false, message: "Transaction proof is required for ABA payment." }, { status: 400 });
    }

    // Create a unique key for this order attempt
    const orderKey = `${userId}-${JSON.stringify(items)}-${address}-${Date.now()}`;
    const orderKeySimple = `${userId}-${items.map(i => `${i.product}:${i.quantity}`).join('-')}`;
    
    // Check if this exact order is already being processed
    if (processingOrders.has(orderKeySimple)) {
      return NextResponse.json({ 
        success: false, 
        message: "Duplicate order detected. Please wait for the current order to complete." 
      }, { status: 409 });
    }

    // Mark this order as being processed
    processingOrders.set(orderKeySimple, true);
    
    // Clean up the processing flag after 30 seconds
    setTimeout(() => {
      processingOrders.delete(orderKeySimple);
    }, 30000);

    try {
      await connectDB();

      // Check if user has any recent pending orders with same items (additional safety check)
      const recentOrderTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
      const recentOrder = await Order.findOne({
        userId,
        date: { $gte: recentOrderTime },
        'items.product': { $in: items.map(item => item.product) },
        status: { $in: ['Order Placed', 'Processing'] }
      });

      if (recentOrder) {
        processingOrders.delete(orderKeySimple);
        return NextResponse.json({ 
          success: false, 
          message: "You have a recent order with similar items. Please check your order history." 
        }, { status: 409 });
      }

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

      let orderPaymentStatus = 'pending';
      let orderPaymentConfirmationStatus = 'na';

      if (paymentMethod === 'ABA') {
        orderPaymentStatus = 'pending_confirmation';
        orderPaymentConfirmationStatus = 'pending_review';
      }

      // Generate unique orderId
      let orderId;
      let orderIdExists = true;
      let attempts = 0;
      
      while (orderIdExists && attempts < 5) {
        orderId = generateOrderId();
        const existingOrder = await Order.findOne({ orderId });
        orderIdExists = !!existingOrder;
        attempts++;
      }

      if (orderIdExists) {
        throw new Error("Unable to generate unique order ID. Please try again.");
      }

      const finalOrderDataForEvent = {
        orderId,
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
        paymentTransactionImage,
        paymentStatus: orderPaymentStatus,
        paymentConfirmationStatus: orderPaymentConfirmationStatus
      };
      
      console.log("Final order data being sent to Inngest:", finalOrderDataForEvent);

      await inngest.send({
        name: "order/created",
        data: finalOrderDataForEvent 
      });

      // Clear user's cart
      const userDoc = await User.findById(userId);
      if (userDoc) {
          userDoc.cartItems = {};
          await userDoc.save();
      }

      // Clean up processing flag on success
      processingOrders.delete(orderKeySimple);

      return NextResponse.json({
        success: true,
        message: "Order placed successfully. Awaiting processing.",
        orderId: orderId,
        orderData: finalOrderDataForEvent
      });

    } catch (error) {
      // Clean up processing flag on error
      processingOrders.delete(orderKeySimple);
      throw error;
    }

  } catch (error) {
    console.error("Error in order creation:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to create order." 
    }, { status: 500 });
  }
}