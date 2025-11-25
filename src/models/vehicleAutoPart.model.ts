import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleAutoPartDocument extends Document {
    serial_number: string;
    vehicle_id: mongoose.Types.ObjectId;
    autopart_id: mongoose.Types.ObjectId;
    quantity: number;
    isWarranty: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const VehicleAutoPartSchema: Schema = new Schema(
    {
        serial_number: {
            type: String,
            required: [true, 'Serial number is required'],
            unique: true
        },
        vehicle_id: {
            type: Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle reference is required']
        },
        autopart_id: {
            type: Schema.Types.ObjectId,
            ref: 'AutoPart',
            required: [true, 'AutoPart reference is required']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative']
        },
        isWarranty: {
            type: Boolean,
            required: [true, 'isWarranty is required'],
            default: false
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IVehicleAutoPartDocument>('VehicleAutoPart', VehicleAutoPartSchema);
