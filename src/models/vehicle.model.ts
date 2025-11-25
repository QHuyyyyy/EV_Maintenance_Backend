import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    vehicleName: { type: String },
    model: { type: String },
    year: { type: Number }, // Manufacturing year
    VIN: { type: String, unique: true },
    price: { type: Number },
    mileage: { type: Number, default: 0 }, // Current mileage
    plateNumber: { type: String, unique: true }, // License plate number
    last_service_date: { type: Date }, // Last service/maintenance date
    last_alert_mileage: { type: Number, default: 0 }, // Last mileage when SERVICE_DUE alert was triggered
    image: { type: String }, // URL của ảnh từ Firebase Storage
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    vehicle_warranty_start_time: { type: Date, default: null }, // Warranty start date
    vehicle_warranty_end_time: { type: Date, default: null } // Warranty end date
}, {
    timestamps: true
});

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
