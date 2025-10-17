import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';


const userSchema = new Schema({
    email: {
        type: String,
        required: function (this: any) {
            return this.role !== 'CUSTOMER';
        },
        unique: true,
        sparse: true, // Allows multiple null values
        validate: {
            validator: function (email: string) {
                if (!email) return true; // Allow empty email for customers
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Please enter a valid email address'
        }
    },
    phone: {
        type: String,
        required: function (this: any) {
            return this.role === 'CUSTOMER';
        },
        unique: true,
        sparse: true, // Allows multiple null values
        validate: {
            validator: function (phone: string) {
                if (!phone) return true; // Allow empty phone for non-customers
                return /^[0-9]{10,11}$/.test(phone);
            },
            message: 'Please enter a valid phone number (10-11 digits)'
        }
    },
    password: {
        type: String,
        required: function (this: any) {
            return this.role !== 'CUSTOMER';
        },
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
    },
    refreshToken: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
});



export const User = mongoose.model('User', userSchema);

export default User;