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

    const { address, items, promoCodeId } = await request.json();

    if (!address || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    await connectDB();

    // Calculate subtotal with fixed 2 decimal precision
    const subtotal = Number(
      (await items.reduce(async (accPromise, item) => {
        const acc = await accPromise;
        const product = await Product.findById(item.product);
        return acc + product.offerPrice * item.quantity;
      }, Promise.resolve(0))).toFixed(2)
    );

    // Delivery fee - fixed to 2 decimals
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const deliveryFee = Number((itemCount > 1 ? 0 : 1.5).toFixed(2));

    // Promo code logic
    let discount = 0;
    let promoCodeDetails = null;

    if (promoCodeId) {
      const promoCode = await PromoCode.findOne({
        _id: promoCodeId,
        isActive: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: new Date() } }
        ]
      });

      if (promoCode) {
        if (!promoCode.minPurchaseAmount || subtotal >= promoCode.minPurchaseAmount) {
          if (promoCode.discountType === "percentage") {
            discount = (subtotal * promoCode.discountValue) / 100;

            if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
              discount = promoCode.maxDiscountAmount;
            }
          } else {
            discount = Math.min(promoCode.discountValue, subtotal);
          }

          discount = Number(discount.toFixed(2));

          promoCode.usageCount = (promoCode.usageCount || 0) + 1;
          await promoCode.save();

          promoCodeDetails = {
            id: promoCode._id,
            code: promoCode.code,
            discountAmount: discount
          };
        }
      }
    }

    // Final amount with fixed 2 decimals
    const finalAmount = Number((subtotal + deliveryFee - discount).toFixed(2));

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
    console.log(error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
