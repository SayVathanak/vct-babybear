import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'user' },
    items: [{
        product: { type: String, required: true, ref: 'product' },
        quantity: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    promoCode: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode' },
        code: { type: String },
        discountAmount: { type: Number },
        discountType: { type: String },
        discountValue: { type: Number }
    },
    amount: { type: Number, required: true }, // Total amount after all calculations
    address: { type: String, ref: 'address', required: true },
    status: { type: String, required: true, default: 'Order Placed' },
    date: { type: Number, required: true }
})

const Order = mongoose.models.order || mongoose.model('order', orderSchema)

export default Order