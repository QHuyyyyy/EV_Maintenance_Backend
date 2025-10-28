import { startAnalysisWorker } from '../services/analysisWorker.service';

// Start the analysis worker and wire graceful shutdown handlers.
async function run() {
    console.log('Starting analysis worker...');
    startAnalysisWorker();

    const shutdown = async (signal: string) => {
        console.log(`Received ${signal}, shutting down worker...`);
        // The worker instance is created inside startAnalysisWorker; it closes on process exit.
        // If we later refactor to return the Worker instance, we can call worker.close() here.
        // Give some time for in-flight jobs to complete.
        setTimeout(() => {
            console.log('Exiting process');
            process.exit(0);
        }, 1000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection at:', reason);
    });
}

run().catch((err) => {
    console.error('Worker runner failed to start', err);
    process.exit(1);
});
