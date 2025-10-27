import mongoose, { Schema } from 'mongoose';

const centerSchema = new Schema({
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
    ,
    image: {
        type: String,
    }
}, {
    timestamps: true
});

export default mongoose.model('Center', centerSchema);
