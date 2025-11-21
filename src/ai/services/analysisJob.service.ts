import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const analysisQueue = new Queue('analysis', { connection: { url: REDIS_URL } });

export async function enqueueCenterJob(centerId: string) {
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
