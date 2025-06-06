import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address";

// Helper to generate a simple Order ID
const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${random}`;
};


export async function POST(request) {
  try {
    // 1. Authenticate the seller
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized: No seller ID found." }, { status: 401 });
    }

    const { items, amount } = await request.json();

    // 2. Validate input
    if (!items || items.length === 0 || amount === undefined) {
      return NextResponse.json({ success: false, message: "Invalid data: Items and amount are required." }, { status: 400 });
    }

    await connectDB();

    // 3. Find or create a default "Walk-in" address for the seller
    let posAddress = await Address.findOne({ userId, fullName: "Walk-in Customer" });

    if (!posAddress) {
      // If no default address, create one.
      // You might want to get seller's actual store address here in a real app.
      posAddress = new Address({
        userId,
        fullName: "Walk-in Customer",
        phoneNumber: 1234567890,
        area: "In-Store",
        state: "In-Store Sale",
      });
      await posAddress.save();
    }

    // 4. Create the new order document
    const newOrder = new Order({
      orderId: generateOrderId(),
      userId,
      address: posAddress._id,
      items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
      })),
      subtotal: amount,
      deliveryFee: 0, // No delivery fee for POS
      discount: 0, // No discount logic for now
      amount,
      date: Date.now(),
      // Status for a completed in-person sale
      status: 'Completed',
      paymentMethod: 'COD', // 'COD' can represent in-person cash/card payment
      paymentStatus: 'paid',
      paymentConfirmationStatus: 'confirmed',
    });

    await newOrder.save();
    
    // (Optional but Recommended) 5. Decrement stock levels
    for (const item of items) {
        // Use $inc with a negative value to decrement stock
        // This assumes you have a 'stock' field in your Product model
        await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: -item.quantity } }
        );
    }


    return NextResponse.json({
      success: true,
      message: "Sale completed successfully!",
      order: newOrder,
    }, { status: 201 });

  } catch (error) {
    console.error("Error in POS order creation:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error while creating order." }, { status: 500 });
  }
}
