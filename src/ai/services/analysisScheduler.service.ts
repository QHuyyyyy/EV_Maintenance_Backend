import cron from 'node-cron';
import centerAutoPartService from '../../services/centerAutoPart.service';
import { enqueueCenterJob } from '../services/analysisJob.service';

export function startAnalysisScheduler() {
  // Schedule weekly at 04:00 AM (Sunday)
  cron.schedule(
    '0 4 * * 0',
    async () => {
      console.log('Starting scheduler: enqueueing analysis jobs for all centers (single-instance)');
      try {
        let page = 1;
        const limit = 50;
        while (true) {
          const resp = await centerAutoPartService.getAllCenterAutoParts({ page, limit });
          const items = resp.items || [];
          for (const it of items) {
            const centerId = it.center_id?._id?.toString() ?? it.center_id?.toString();
            if (centerId) await enqueueCenterJob(centerId);
          }
          if (items.length < limit) break;
          page++;
        }
        console.log('Enqueue complete.');
      } catch (err) {
        console.error('Failed to enqueue analysis jobs', err);
      }
    },
    {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  );
}

export default { startAnalysisScheduler };
