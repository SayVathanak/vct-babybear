import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import PromoCode from "@/models/PromoCode";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Extract ALL data from the request
    const requestData = await request.json();
    const { 
      address, 
      items, 
      promoCodeId, 
      subtotal: requestSubtotal,
      discount: requestDiscount,
      deliveryFee: requestDeliveryFee,
      amount: requestAmount,
      promoCode: requestPromoDetails 
    } = requestData;

    console.log("Received request data:", requestData);

    if (!address || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    await connectDB();

    // Calculate subtotal with fixed 2 decimal precision
    const calculatedSubtotal = Number(
      (await items.reduce(async (accPromise, item) => {
        const acc = await accPromise;
        const product = await Product.findById(item.product);
        // Use the same price logic as frontend - including fallback to regular price
        const price = product.offerPrice || product.price;
        return acc + price * item.quantity;
      }, Promise.resolve(0))).toFixed(2)
    );

    // Delivery fee - fixed to 2 decimals
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const calculatedDeliveryFee = Number((itemCount > 1 ? 0 : 1.5).toFixed(2));

    // Promo code logic - improved version to use frontend values if provided
    let discount = requestDiscount || 0;
    let promoCodeDetails = null;
    
    // Use client-provided values for consistency if available
    const subtotal = requestSubtotal || calculatedSubtotal;
    const deliveryFee = requestDeliveryFee !== undefined ? requestDeliveryFee : calculatedDeliveryFee;

    // If the client already provided processed promo code details, use them
    if (requestPromoDetails) {
      console.log("Using client-provided promo code details:", requestPromoDetails);
      promoCodeDetails = {
        id: requestPromoDetails.id,
        code: requestPromoDetails.code,
        discountAmount: requestPromoDetails.discountAmount || discount
      };
      
      // Ensure the discount value is properly set
      discount = requestDiscount || discount;
    }
    // Otherwise look up the promo code if an ID was provided
    else if (promoCodeId) {
      console.log("Looking up promo code with ID:", promoCodeId);

      try {
        const promoCode = await PromoCode.findOne({
          _id: promoCodeId,
          isActive: true,
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } }
          ]
        });

        if (!promoCode) {
          console.log("No active promo code found with this ID or code has expired");
        } else {
          console.log("Found promo code:", {
            code: promoCode.code,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue,
            minPurchaseAmount: promoCode.minPurchaseAmount,
            maxDiscountAmount: promoCode.maxDiscountAmount
          });

          // Check minimum purchase amount
          if (promoCode.minPurchaseAmount && subtotal < promoCode.minPurchaseAmount) {
            console.log(`Minimum purchase amount not met. Required: ${promoCode.minPurchaseAmount}, Current: ${subtotal}`);
          } else {
            // Apply discount based on type
            if (promoCode.discountType === "percentage") {
              // Ensure percentage is within valid range (0-100)
              const validPercentage = Math.min(Math.max(promoCode.discountValue, 0), 100);
              discount = (subtotal * validPercentage) / 100;

              // Apply maximum discount cap if specified
              if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
                console.log(`Discount capped at maximum: ${promoCode.maxDiscountAmount}`);
                discount = promoCode.maxDiscountAmount;
              }
            } else if (promoCode.discountType === "fixed") {
              // For fixed discount, don't allow more than the subtotal
              discount = Math.min(promoCode.discountValue, subtotal);
            } else {
              console.log(`Unknown discount type: ${promoCode.discountType}`);
            }

            // Format to 2 decimal places
            discount = Number(discount.toFixed(2));
            console.log("Calculated discount amount:", discount);

            // Increment usage count
            promoCode.usageCount = (promoCode.usageCount || 0) + 1;
            await promoCode.save();

            // Set promo code details for the response
            promoCodeDetails = {
              id: promoCode._id,
              code: promoCode.code,
              discountAmount: discount,
              discountType: promoCode.discountType,
              discountValue: promoCode.discountValue
            };

            console.log("Set promoCodeDetails:", promoCodeDetails);
          }
        }
      } catch (error) {
        console.error("Error processing promo code:", error);
        // Continue checkout without promo code if there's an error
      }
    } else {
      console.log("No promoCodeId or promoCode details provided in request");
    }

    // Final amount - use client amount if provided, otherwise calculate
    const finalAmount = requestAmount || Number((subtotal + deliveryFee - discount).toFixed(2));
    console.log("Calculated order amounts:", { subtotal, deliveryFee, discount, finalAmount });

    // Compose full order data
    const orderData = {
      userId,
      address,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      promoCode: promoCodeDetails,
      amount: finalAmount,
      date: Date.now()
    };

    console.log("Final order data being sent to Inngest:", orderData);

    await inngest.send({
      name: "order/created",
      data: orderData
    });

    // Clear user's cart
    const user = await User.findById(userId);
    user.cartItems = {};
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Order Placed",
      orderId: Date.now().toString(), // Replace with actual order ID logic later
      orderData
    });
  } catch (error) {
    console.log("Error in order creation:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}