import mongoose, { Document, Schema } from 'mongoose';
const systemUserSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date
    },
    certificates: {
        type: [
            {
                name: { type: String },
                issuingOrganization: { type: String },
                issueDate: { type: Date },
                expirationDate: { type: Date },
                credentialUrl: { type: String }
            }
        ],
        default: [],
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    centerId: {
        type: Schema.Types.ObjectId,
        ref: 'Center',
    }
}, {
    timestamps: true
});

export default mongoose.model('SystemUser', systemUserSchema);