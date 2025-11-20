import cron from 'node-cron';
import moment from 'moment-timezone';
import { WorkShift } from '../models/workshift.model';

const VN = 'Asia/Ho_Chi_Minh';

function shouldBeCompleted(shiftDate: Date, endTime: string): boolean {
    const now = moment().tz(VN);
    const dateMoment = moment(shiftDate).tz(VN).startOf('day');
    const todayStart = now.clone().startOf('day');
    if (dateMoment.isBefore(todayStart)) return true;
    if (dateMoment.isSame(todayStart)) {
        const [hh, mm] = endTime.split(':').map(Number);
        const endMoment = todayStart.clone().hour(hh || 0).minute(mm || 0);
        return endMoment.isBefore(now);
    }
    return false;
}

async function markCompletedShifts() {
    try {
        const allActive = await WorkShift.find({ status: 'active' });
        if (!allActive.length) return;

        const toCompleteIds: string[] = [];
        for (const ws of allActive) {
            if (shouldBeCompleted(ws.shift_date as Date, ws.end_time as string)) {
                toCompleteIds.push(ws._id.toString());
            }
        }
        if (toCompleteIds.length) {
            await WorkShift.updateMany({ _id: { $in: toCompleteIds } }, { $set: { status: 'completed' } });
            console.log(`[WorkShiftScheduler] Marked ${toCompleteIds.length} shifts completed.`);
        } else {
            console.log('[WorkShiftScheduler] No shifts to mark completed.');
        }
    } catch (err) {
        console.error('[WorkShiftScheduler] Failed to mark completed shifts:', err);
    }
}

export function initWorkShiftDailyJob() {
    markCompletedShifts();
    cron.schedule('0 22 * * *', () => {
        console.log('[WorkShiftScheduler] Daily cron triggered (22:00).');
        markCompletedShifts();
    });
}

export async function runWorkShiftCompletionNow() {
    await markCompletedShifts();
}
