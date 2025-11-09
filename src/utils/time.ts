// Vietnam timezone helpers using moment-timezone
import moment from 'moment-timezone';

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

// Return a Date that represents the current time in Vietnam timezone
export function nowVN(): Date {
    return moment().tz(VIETNAM_TIMEZONE).toDate();
}



export default {
    VIETNAM_TIMEZONE,
    nowVN,
};
