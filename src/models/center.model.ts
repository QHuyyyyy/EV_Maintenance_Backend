import mongoose, { Schema } from 'mongoose';

const centerSchema = new Schema({
    center_id: {
        type: String,
        required: true,
        unique: true,
        default: () => 'CTR' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
    },
    name: {
        type: String,
        required: [true, 'Center name is required']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone is required']
    }
}, {
    timestamps: true
});

export default mongoose.model('Center', centerSchema);
