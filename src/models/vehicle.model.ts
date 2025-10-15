import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    vehicleName: { type: String, required: true },
    model: { type: String },
    VIN: { type: String, unique: true },
    price: { type: Number },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }
}, {
    timestamps: true
});

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
