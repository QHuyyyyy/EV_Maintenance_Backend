import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },
    type: {
        type: String,
        enum: ['MAINTENANCE', 'SUBSCRIPTION_EXPIRY', 'SERVICE_DUE', 'SYSTEM', 'WARNING'],
        default: 'SYSTEM'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    }
}, {
    timestamps: true
});


export const Alert = mongoose.model("Alert", alertSchema);