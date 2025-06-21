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
    amount: { type: Number, required: true },
    address: { type: String, ref: 'address', required: true },
    status: { type: String, required: true, default: 'Order Placed' },
    date: { type: Number, required: true },

    // --- Payment Fields Update ---
    paymentMethod: {
        type: String,
        enum: ['COD', 'ABA', 'Bakong'], // Added 'Bakong'
        required: true
    },
    paymentTransactionImage: { // For ABA uploads
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'pending_confirmation'],
        default: 'pending'
    },
    paymentConfirmationStatus: {
        type: String,
        enum: ['na', 'pending_review', 'confirmed', 'rejected'],
        default: 'na'
    },
    // --- New Field for Bakong ---
    bakongPaymentDetails: {
        md5: { type: String }, // To store the MD5 hash from the FastAPI service
        qrString: { type: String } // To store the QR string itself (optional, but good for reference)
    }
});

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;