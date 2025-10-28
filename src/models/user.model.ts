import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';


const userSchema = new Schema({
    email: {
        type: String,
        required: function (this: any) {
            return this.role !== 'CUSTOMER';
        },
        validate: {
            validator: function (email: string) {
                if (!email) return true; // Allow empty email for customers
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Please enter a valid email address'
        },
        default: null,
    },
    phone: {
        type: String,
        required: function (this: any) {
            return this.role === 'CUSTOMER';
        },
        validate: {
            validator: function (phone: string) {
                if (!phone) return true; // Allow empty phone for non-customers
                // Accept both formats: +84123456789 or 0123456789 or 84123456789
                return /^\+?[0-9]{10,12}$/.test(phone);
            },
            message: 'Please enter a valid phone number (10-12 digits, optionally with + prefix)'
        },
        default: null,
    },
    password: {
        type: String,
        required: function (this: any) {
            return this.role !== 'CUSTOMER';
        },
        minlength: [6, 'Password must be at least 6 characters long'],
        default: null,
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

userSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } },
    }
);

userSchema.index(
    { phone: 1 },
    {
        unique: true,
        partialFilterExpression: { phone: { $type: 'string' } },
    }
);


export const User = mongoose.model('User', userSchema);

export default User;