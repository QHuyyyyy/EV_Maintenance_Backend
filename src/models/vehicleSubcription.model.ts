import mongoose from "mongoose";

const vehicleSubscriptionSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    package_id: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage", required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "PENDING"], default: "PENDING" },
    // Pricing fields - calculated when creating subscription
    original_price: { type: Number, required: true, default: 0 },
    discount_percent: { type: Number, default: 0, min: 0, max: 100 },
    discount_amount: { type: Number, default: 0 },
    final_price: { type: Number, required: true, default: 0 }
}, {
    timestamps: true
});

export const VehicleSubscription = mongoose.model("VehicleSubscription", vehicleSubscriptionSchema);
