import mongoose, { Document, Schema } from 'mongoose';

const customerSchema = new Schema({
    customerId: {
        type: String,
        unique: true,
        default: function() {
            return 'CUST' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        }
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required']
    },
    dateOfBirth: {
        type: Date
    },
    phone: {
        type: String,
        required: [true, 'Phone is required']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    }
}, {
    timestamps: true
});

export default mongoose.model('Customer', customerSchema);