import { ShiftAssignment as ShiftAssignmentModel } from '../models/shift-assignment.model';
import { WorkShift } from '../models/workshift.model';
import { IShiftAssignment } from '../models/shift-assignment.model';

export class ShiftAssignmentService {
    async assignShifts(system_user_id: string, shift_ids: string[]) {
        try {
            const created = [] as IShiftAssignment[];
            for (const shift_id of shift_ids) {
                // Optional: verify shift exists
                const shift = await WorkShift.findOne({ shift_id });
                if (!shift) continue; // skip invalid shift_id
                const existing = await ShiftAssignmentModel.findOne({ system_user_id, shift_id });
                if (existing) {
                    throw new Error(`Shift ${shift_id} is already assigned to user ${system_user_id}`);
                }
                const a = new ShiftAssignmentModel({ system_user_id, shift_id });
                const saved = await a.save();
                created.push(saved as IShiftAssignment);
            }
            return created;
        } catch (error) {
            if (error instanceof Error) throw new Error(error.message);
            throw new Error('Failed to assign shifts');
        }
    }

    async getShiftsOfUser(system_user_id: string) {
        const assignments = await ShiftAssignmentModel.find({ system_user_id }).lean();
        const shiftIds = assignments.map(a => a.shift_id);
        const shifts = await WorkShift.find({ shift_id: { $in: shiftIds } }).lean();
        return shifts;
    }

    async getUsersOfShift(shift_id: string) {
        const assignments = await ShiftAssignmentModel.find({ shift_id }).lean();
        return assignments.map(a => a.system_user_id);
    }

    async deleteAssignment(id: string) {
        const deleted = await ShiftAssignmentModel.findByIdAndDelete(id);
        return !!deleted;
    }
}
