import mongoose from "mongoose";

const vehicleSubscriptionSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    package_id: { type: mongoose.Schema.Types.ObjectId, ref: "ServicePackage", required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "PENDING"], default: "ACTIVE" }
});

export const VehicleSubscription = mongoose.model("VehicleSubscription", vehicleSubscriptionSchema);
