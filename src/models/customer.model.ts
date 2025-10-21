import mongoose, { Document, Schema } from 'mongoose';

const customerSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        type: String,
        default: ''
    },
    deviceTokens: {
        type: [String],
        default: [],
        description: 'Array of Firebase Cloud Messaging device tokens for push notifications'
    }
}, {
    timestamps: true
});

export default mongoose.model('Customer', customerSchema);