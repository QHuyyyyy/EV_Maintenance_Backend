import { Worker } from 'bullmq';
import centerAutoPartService from '../../services/centerAutoPart.service';
import llmAnalysis from '../services/llmAnalysis.service';
import chatSocketService from '../../socket/chat.socket';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function processCenterAnalysis(job: any) {
  const centerId: string = job.data.centerId;
  let page = 1;
  const limit = 50;
  let totalResults = 0;

  while (true) {
    let resp: any;
    try {
      resp = await centerAutoPartService.getAllCenterAutoParts({ center_id: centerId, page, limit });
    } catch (e) {
      console.error('centerAutoPart fetch failed, skipping center', centerId, e);
      break;
    }
    const items = resp.items || [];
    if (!items || items.length === 0) break;
    for (const cp of items) {
      try {
        // cp.part_id may be a populated object (AutoPart) or a plain id string/ObjectId.
        // If it's an object, use its _id; otherwise use the value directly.
        const partId = typeof cp.part_id === 'string'
          ? cp.part_id
          : (cp.part_id && (cp.part_id._id ?? cp.part_id.id))
            ? (cp.part_id._id ?? cp.part_id.id).toString()
            : undefined;

        if (!partId) {
          console.error('Skipping analysis: invalid part id for centerPart', cp);
          continue;
        }

        await llmAnalysis.analyzePart(partId, centerId);
        totalResults++;
      } catch (err) {
        console.error('analyzePart failed for', cp.part_id, err);
      }
    }
    if (items.length < limit) break;
    page++;
  }

  return { totalResults };
}

export function startAnalysisWorker() {
  // Worker will pick jobs from 'analysis' queue and process them with controlled concurrency
  const worker = new Worker('analysis', async (job) => {
    return await processCenterAnalysis(job);
  }, { connection: { url: REDIS_URL }, concurrency: 2 });

  worker.on('completed', (job, returnvalue) => {
    console.log('Analysis job completed', job.id, returnvalue);
    const center_id = job?.data?.centerId;
    const totalResults = (returnvalue && returnvalue.totalResults) || 0;
    // Only emit via socket (no persistence)
    chatSocketService.emitForecastBatchComplete({ center_id, totalResults });
  });

  worker.on('failed', (job, err) => {
    console.error('Analysis job failed', job?.id, err);
  });
}

export default { startAnalysisWorker };
