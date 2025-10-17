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
    }
}, {
    timestamps: true
});

export default mongoose.model('Customer', customerSchema);