import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';


const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        validate: {
            validator: function (email: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Please enter a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['CUSTOMER', 'ADMIN', 'STAFF', 'TECHNICIAN'],
            message: 'Role must be either CUSTOMER, ADMIN, STAFF, or TECHNICIAN'
        },
        default: 'CUSTOMER'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});



export const User = mongoose.model('User', userSchema);

export default User;