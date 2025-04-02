import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid data" });
        }

        // Calculate amount using items
        const amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            return await acc + product.offerPrice * item.quantity;
        }, 0)

        // Calculate delivery fee - free for more than 1 item, otherwise $1.5
        const itemCount = items.reduce((count, item) => count + item.quantity, 0);
        const deliveryFee = itemCount > 1 ? 0 : 1.5;

        // const finalAmount = Number((amount + Math.floor(amount * 0.02)).toFixed(2));
        const finalAmount = Number((amount + deliveryFee).toFixed(2));

        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                deliveryFee,
                // amount: amount + Math.floor(amount * 0.02),
                amount: finalAmount,
                date: Date.now()
            }
        })

        // Clear user's cart
        const user = await User.findById(userId)
        user.cartItems = {}
        await user.save()

        return NextResponse.json({ success: true, message: 'Order Placed' })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, message: error.message })
    }
}