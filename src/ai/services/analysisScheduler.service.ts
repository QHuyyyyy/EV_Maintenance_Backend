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
        await triggerAnalysisNow();
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

// Manual trigger: enqueue analysis for all centers immediately
export async function triggerAnalysisNow() {
  let page = 1;
  const limit = 50;
  const enqueuedCenters = new Set<string>(); // Deduplicate centers

  while (true) {
    const resp = await centerAutoPartService.getAllCenterAutoParts({ page, limit });
    const items = (resp as any).items || [];
    for (const it of items) {
      const centerId = it.center_id?._id?.toString?.() ?? it.center_id?.toString?.();
      // Only enqueue each center once
      if (centerId && !enqueuedCenters.has(centerId)) {
        enqueuedCenters.add(centerId);
        await enqueueCenterJob(centerId);
      }
    }
    if (items.length < limit) break;
    page++;
  }
}

export default { startAnalysisScheduler, triggerAnalysisNow };
