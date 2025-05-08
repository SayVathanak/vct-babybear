import mongoose from "mongoose";

const PromoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create a compound index for efficient searching
PromoCodeSchema.index({ code: 1, isActive: 1 });

export default mongoose.models.PromoCode || mongoose.model("PromoCode", PromoCodeSchema);