import mongoose, { Document, Schema } from 'mongoose';

const vehicleSchema = new Schema({
    vehicleId: {
        type: String,
        required: [true, 'Vehicle ID is required'],
        unique: true,
        trim: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer ID is required']
    },
    vehicleName: {
        type: String,
        required: [true, 'Vehicle name is required'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'Model is required'],
        trim: true
    },
    VIN: {
        type: String,
        required: [true, 'VIN is required'],
        unique: true,
        uppercase: true,
        validate: {
            validator: function(vin: string) {
                return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
            },
            message: 'VIN must be exactly 17 characters and contain valid characters'
        }
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    batteryCapacity: {
        type: Number,
        min: [1, 'Battery capacity must be positive']
    },
    manufacturingYear: {
        type: Number,
        min: [1990, 'Manufacturing year must be 1990 or later'],
        max: [new Date().getFullYear() + 1, 'Manufacturing year cannot be in the future']
    },
    lastServiceDate: {
        type: Date
    },
    nextServiceDue: {
        type: Date
    },
    warrantyExpiry: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

// Indexes for better performance (VIN and vehicleId already have unique indexes)
vehicleSchema.index({ customerId: 1 });
vehicleSchema.index({ isActive: 1 });

// Pre-save middleware to set next service due date
vehicleSchema.pre('save', function(next) {
    if (this.lastServiceDate && !this.nextServiceDue) {
        // Set next service due to 6 months from last service
        const nextDue = new Date(this.lastServiceDate);
        nextDue.setMonth(nextDue.getMonth() + 6);
        this.nextServiceDue = nextDue;
    }
    next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;