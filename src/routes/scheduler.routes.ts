import { Router, Request, Response } from 'express';
import { maintenanceScheduler } from '../services/maintenanceScheduler.service';
import { validate } from '../middlewares/auth';

const router = Router();

/**
 * POST /scheduler/trigger
 * Manually trigger maintenance check (for testing)
 * 
 * Authentication: Required (system user)
 */
router.post('/trigger', validate, async (req: Request, res: Response) => {
    // #swagger.tags = ['Scheduler']
    // #swagger.summary = 'Manually trigger maintenance check'
    // #swagger.description = 'Trigger the maintenance scheduler to check for upcoming maintenance tasks (for testing/manual execution)'
    /* #swagger.security = [{
               "bearerAuth": []
       }] */
    /* #swagger.responses[200] = {
        description: 'Maintenance check triggered successfully',
        schema: {
            success: true,
            message: 'Maintenance check triggered successfully'
        }
    } */
    /* #swagger.responses[401] = {
        description: 'Unauthorized - authentication required',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    /* #swagger.responses[500] = {
        description: 'Internal server error',
        schema: {
            success: false,
            message: 'Failed to trigger maintenance check',
            error: 'string'
        }
    } */
    try {
        console.log('📢 Manual trigger requested');
        await maintenanceScheduler.manualTrigger();

        res.status(200).json({
            success: true,
            message: 'Maintenance check triggered successfully'
        });
    } catch (error) {
        console.error('Error triggering maintenance check:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger maintenance check',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});



export default router;
