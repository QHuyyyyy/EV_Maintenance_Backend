import moment from 'moment-timezone';

interface NotificationItem {
    id: string;
    type: string; // 'forecast' | 'forecast_batch' | other types later
    title: string;
    message: string;
    meta?: any;
    createdAt: string; // ISO string
    read?: boolean;
}

class NotificationService {
    private items: NotificationItem[] = [];
    private MAX_ITEMS = 5; // cap to avoid unbounded growth

    push(n: { type: string; title: string; message: string; meta?: any }) {
        const item: NotificationItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: n.type,
            title: n.title,
            message: n.message,
            meta: n.meta,
            createdAt: moment().tz('Asia/Ho_Chi_Minh').toISOString(),
            read: false,
        };
        this.items.unshift(item); // newest first
        if (this.items.length > this.MAX_ITEMS) {
            this.items = this.items.slice(0, this.MAX_ITEMS);
        }
        return item;
    }

    list(params?: { limit?: number }) {
        const limit = params?.limit && params.limit > 0 ? params.limit : 50;
        return this.items.slice(0, limit);
    }

    markRead(id: string) {
        const it = this.items.find(i => i.id === id);
        if (it) it.read = true;
        return it;
    }
}

const notificationService = new NotificationService();
export default notificationService;
export type { NotificationItem };