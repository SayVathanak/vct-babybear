import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    userId: { type: String, required: true, ref: 'user' },
    items: [{
        // Store complete product information at time of order
        product: {
            _id: { type: String, required: true }, // Original product ID for reference
            name: { type: String, required: true }, // Product name at time of order
            price: { type: Number, required: true }, // Price at time of order
            image: { type: String }, // Product image URL
            category: { type: String }, // Product category
            description: { type: String }, // Product description
            // Add any other fields you need for analytics/display
        },
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

    // Payment fields
    paymentMethod: {
        type: String,
        enum: ['COD', 'ABA'],
        default: 'COD'
    },
    paymentTransactionImage: {
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
    }
});

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;