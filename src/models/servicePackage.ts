import mongoose from "mongoose";

const servicePackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // Duration in days
    km_interval: { type: Number, required: true },
}, {
    timestamps: true
});

export const ServicePackage = mongoose.model("ServicePackage", servicePackageSchema);
