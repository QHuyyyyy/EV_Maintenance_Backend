import mongoose, { Schema, Document } from 'mongoose';

export interface ISlot extends Document {
    center_id: mongoose.Types.ObjectId; // center that owns this slot
    start_time: string; // HH:mm start time only
    end_time: string;   // HH:mm end time only
    slot_date: Date; // date component only (00:00:00)
    capacity: number; // how many appointments can be booked into this slot
    booked_count: number; // current number of booked appointments
    status: 'active' | 'inactive' | 'full' | 'expired';
    workshift_id: mongoose.Types.ObjectId; // reference to the WorkShift that created this slot
    createdAt: Date;
    updatedAt: Date;
}

const SlotSchema: Schema = new Schema({
    center_id: {
        type: Schema.Types.ObjectId,
        ref: 'Center',
        required: true,
        index: true
    },
    start_time: {
        type: String,
        required: true,
        trim: true,
        // Expected format HH:mm
        validate: {
            validator: function (v: string) {
                return /^\d{2}:\d{2}$/.test(v);
            },
            message: 'start_time must be in format HH:mm'
        }
    },
    end_time: {
        type: String,
        required: true,
        trim: true,
        // Expected format HH:mm
        validate: {
            validator: function (v: string) {
                return /^\d{2}:\d{2}$/.test(v);
            },
            message: 'end_time must be in format HH:mm'
        }
    },
    slot_date: {
        type: Date,
        required: true,
        index: true
    },
    capacity: {
        type: Number,
        required: true,
    },
    booked_count: {
        type: Number,
        required: true,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'full', 'expired'],
        default: 'active'
    },
    workshift_id: {
        type: Schema.Types.ObjectId,
        ref: 'WorkShift',
        required: true,
        index: true
    }
}, { timestamps: true });

// Auto status update pre-save
SlotSchema.pre('save', function (next) {
    const slot = this as any as ISlot;
    if (slot.booked_count >= slot.capacity) {
        slot.status = 'full';
    } else if (slot.status === 'full' && slot.booked_count < slot.capacity) {
        slot.status = 'active';
    }
    next();
});


SlotSchema.index({ center_id: 1, slot_date: 1 });


export const Slot = mongoose.model<ISlot>('Slot', SlotSchema);
export default Slot;