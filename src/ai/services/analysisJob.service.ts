import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// single shared queue instance for analysis jobs
export const analysisQueue = new Queue('analysis', { connection: { url: REDIS_URL } });

export async function enqueueCenterJob(centerId: string) {
    // Add a job to Redis/BullMQ queue. Workers will consume and run analysis.
    const job = await analysisQueue.add(
        'center-analysis',
        { centerId },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: false,
        },
    );

    return job;
}

export default {
    analysisQueue,
    enqueueCenterJob,
};
