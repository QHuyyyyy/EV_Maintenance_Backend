import mongoose from "mongoose";

const servicePackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    km_interval: { type: Number, required: true },
});

export const ServicePackage = mongoose.model("ServicePackage", servicePackageSchema);
