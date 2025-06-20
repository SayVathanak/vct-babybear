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
    status: { type: String, required: true, default: 'Order Placed' }, // Overall order status
    date: { type: Number, required: true },

    paymentMethod: {
        type: String,
        enum: ['COD', 'ABA', 'BAKONG'], // <-- MODIFIED: Changed 'KHQR' to 'BAKONG' 
        default: 'COD'
    },
    paymentTransactionImage: { // Stores filename or URL for ABA transaction proof
        type: String,
        default: null
    },
    paymentTransactionId: { // Stores the unique transaction hash for Bakong payments
        type: String,
        default: null
    },
    paymentStatus: { // Tracks the financial status of the payment
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'pending_confirmation'],
        default: 'pending'
    },
    paymentConfirmationStatus: { // Specifically for seller's review of ABA or instant confirmation for Bakong
        type: String,
        enum: ['na', 'pending_review', 'confirmed', 'rejected'],
        default: 'na'
    }
});

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;