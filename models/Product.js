import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "user" },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    barcode: { type: String, unique: true, sparse: true },
    date: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    stock: { type: Number, required: true, default: 0 }
});

const Product = mongoose.models.product || mongoose.model('product', productSchema);

export default Product;