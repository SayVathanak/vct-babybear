import mongoose from "mongoose";

const SliderSchema = new mongoose.Schema({
    imgSrcSm: { type: String, required: true },
    imgSrcMd: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    cloudinaryIds: {
        mobile: { type: String },
        desktop: { type: String }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Keep date field for backward compatibility if needed
    date: { type: Date, default: Date.now }
});

const Slider = mongoose.models.Slider || mongoose.model("Slider", SliderSchema);

export default Slider;