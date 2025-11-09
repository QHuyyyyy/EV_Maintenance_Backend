import { ShiftAssignment as ShiftAssignmentModel } from '../models/shift-assignment.model';
import { WorkShift } from '../models/workshift.model';
import { IShiftAssignment } from '../models/shift-assignment.model';
import SystemUser from '../models/systemUser.model';
import { Types } from 'mongoose';

export class ShiftAssignmentService {
    async assignShifts(system_user_id: string, workshift_ids: string[]) {
        try {

            const user = await SystemUser.findById(system_user_id).lean();
            if (!user) throw new Error('System user not found');
            const userCenter = (user as any).centerId?.toString();
            if (!userCenter) throw new Error('System user has no center assigned');

            const created = [] as IShiftAssignment[];
            for (const workshift_id of workshift_ids) {

                const shift = await WorkShift.findById(workshift_id).lean();
                if (!shift) throw new Error(`WorkShift ${workshift_id} not found`);
                if ((shift as any).center_id?.toString() !== userCenter) {
                    throw new Error(`User center: ${userCenter} different from workshift: ${(shift as any).center_id}`);
                }
                const existing = await ShiftAssignmentModel.findOne({ system_user_id, workshift_id });
                if (existing) {
                    throw new Error(`WorkShift ${workshift_id} is already assigned to user ${system_user_id}`);
                }
                const doc = new ShiftAssignmentModel({ system_user_id, workshift_id });
                const saved = await doc.save();
                created.push(saved as IShiftAssignment);
            }
            return created;
        } catch (error) {
            if (error instanceof Error) throw new Error(error.message);
            throw new Error('Failed to assign shifts');
        }
    }

    async getShiftsOfUser(system_user_id: string) {
        if (!Types.ObjectId.isValid(system_user_id)) throw new Error('Invalid system_user_id');
        const assignments = await ShiftAssignmentModel.find({ system_user_id }).lean();
        const workshiftIds = assignments.map(a => (a as any).workshift_id);
        if (workshiftIds.length === 0) return [];
        const shifts = await WorkShift.find({ _id: { $in: workshiftIds } }).lean();
        return shifts;
    }

    async getUsersOfShift(workshift_id: string) {
        if (!Types.ObjectId.isValid(workshift_id)) throw new Error('Invalid workshift_id');
        const assignments = await ShiftAssignmentModel.find({ workshift_id }).lean();
        return assignments.map(a => a.system_user_id);
    }

    async deleteAssignment(id: string) {
        const deleted = await ShiftAssignmentModel.findByIdAndDelete(id);
        return !!deleted;
    }
}
