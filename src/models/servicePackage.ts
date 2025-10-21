import mongoose from "mongoose";

const servicePackageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // Duration in days (subscription active period)
    km_interval: { type: Number, required: true }, // Mileage interval for maintenance check
    service_interval_days: { type: Number, required: true, default: 365 }, // Days interval to trigger SERVICE_DUE alert (maintenance frequency)
}, {
    timestamps: true
});

export const ServicePackage = mongoose.model("ServicePackage", servicePackageSchema);
