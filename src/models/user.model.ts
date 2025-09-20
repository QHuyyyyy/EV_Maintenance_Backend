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
            values: ['customer', 'admin', 'staff', 'technician'],
            message: 'Role must be either customer, admin, staff, or technician'
        },
        default: 'customer'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});


// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model('User', userSchema);

export default User;