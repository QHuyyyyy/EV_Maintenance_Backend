import { Request, Response } from 'express';
import invoiceService from '../services/invoice.service';
import vehicleSubscriptionService from '../services/vehicleSubcription.service';

export class StatisticsController {
    async getRevenueTotal(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get total revenue from issued invoices (all types).'
           #swagger.security = [{ "bearerAuth": [] }]
        */
        try {
            const stats = await invoiceService.getRevenueStats();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get total revenue' });
            }
        }
    }

    async getRevenueTotalSubscription(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get total revenue for Subscription Package invoices (issued only).'
           #swagger.security = [{ "bearerAuth": [] }]
        */
        try {
            const data = await invoiceService.getRevenueStats({ invoiceType: 'Subscription Package' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get total revenue (subscription)' });
            }
        }
    }

    async getRevenueTotalServiceCompletion(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get total revenue for Service Completion invoices (issued only).'
           #swagger.security = [{ "bearerAuth": [] }]
        */
        try {
            const data = await invoiceService.getRevenueStats({ invoiceType: 'Service Completion' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get total revenue (service completion)' });
            }
        }
    }

    async getDailyRevenue(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get daily revenue for a month (Vietnam time) across all invoice types.'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['month'] = { in: 'query', description: 'Target month (1-12)', required: true, type: 'integer' }
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (default: current year)', required: false, type: 'integer' }
        */
        try {
            const month = req.query.month ? parseInt(req.query.month as string, 10) : NaN;
            const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

            if (!month || Number.isNaN(month)) {
                return res.status(400).json({ success: false, message: 'month is required (1-12)' });
            }

            const data = await invoiceService.getDailyRevenueByMonth({ month, year });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get daily revenue' });
            }
        }
    }

    async getDailyRevenueSubscription(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get daily revenue for a month (Vietnam time) for Subscription Package invoices.'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['month'] = { in: 'query', description: 'Target month (1-12)', required: true, type: 'integer' }
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (default: current year)', required: false, type: 'integer' }
        */
        try {
            const month = req.query.month ? parseInt(req.query.month as string, 10) : NaN;
            const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

            if (!month || Number.isNaN(month)) {
                return res.status(400).json({ success: false, message: 'month is required (1-12)' });
            }

            const data = await invoiceService.getDailyRevenueByMonth({ month, year, invoiceType: 'Subscription Package' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get daily revenue (subscription)' });
            }
        }
    }

    async getDailyRevenueServiceCompletion(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get daily revenue for a month (Vietnam time) for Service Completion invoices.'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['month'] = { in: 'query', description: 'Target month (1-12)', required: true, type: 'integer' }
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (default: current year)', required: false, type: 'integer' }
        */
        try {
            const month = req.query.month ? parseInt(req.query.month as string, 10) : NaN;
            const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

            if (!month || Number.isNaN(month)) {
                return res.status(400).json({ success: false, message: 'month is required (1-12)' });
            }

            const data = await invoiceService.getDailyRevenueByMonth({ month, year, invoiceType: 'Service Completion' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get daily revenue (service completion)' });
            }
        }
    }


    async getMonthlyRevenue(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get monthly revenue for a year (Vietnam time) across all invoice types.'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (e.g., 2025)', required: true, type: 'integer' }
        */
        try {
            const year = req.query.year ? parseInt(req.query.year as string, 10) : NaN;

            if (!year || Number.isNaN(year)) {
                return res.status(400).json({ success: false, message: 'year is required' });
            }

            const data = await invoiceService.getMonthlyRevenueByYear({ year });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get monthly revenue' });
            }
        }
    }
    async getMonthlyRevenueSubscription(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get monthly revenue for Subscription Package invoices in a year (Vietnam time).'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (e.g., 2025)', required: true, type: 'integer' }
        */
        try {
            const year = req.query.year ? parseInt(req.query.year as string, 10) : NaN;
            if (!year || Number.isNaN(year)) {
                return res.status(400).json({ success: false, message: 'year is required' });
            }
            const data = await invoiceService.getMonthlyRevenueByYear({ year, invoiceType: 'Subscription Package' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get monthly revenue (subscription)' });
            }
        }
    }

    async getMonthlyRevenueServiceCompletion(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get monthly revenue for Service Completion invoices in a year (Vietnam time).'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (e.g., 2025)', required: true, type: 'integer' }
        */
        try {
            const year = req.query.year ? parseInt(req.query.year as string, 10) : NaN;
            if (!year || Number.isNaN(year)) {
                return res.status(400).json({ success: false, message: 'year is required' });
            }
            const data = await invoiceService.getMonthlyRevenueByYear({ year, invoiceType: 'Service Completion' });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get monthly revenue (service completion)' });
            }


        }
    }
    async getSubscriptionCountsByPackage(req: Request, res: Response) {
        /* #swagger.tags = ['Statistics']
           #swagger.description = 'Get total number of vehicle subscriptions grouped by service package. Optional month/year filtering (Vietnam time).'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['month'] = { in: 'query', description: 'Target month (1-12). If omitted, aggregate all time', required: false, type: 'integer' }
           #swagger.parameters['year'] = { in: 'query', description: 'Target year (defaults to current year when month is provided)', required: false, type: 'integer' }
        */
        try {
            const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
            const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;

            if (month !== undefined && (Number.isNaN(month) || month < 1 || month > 12)) {
                return res.status(400).json({ success: false, message: 'month must be 1-12 when provided' });
            }

            const data = await vehicleSubscriptionService.getSubscriptionCountsByPackage({ month, year });
            res.status(200).json({ success: true, data });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(400).json({ success: false, message: 'Failed to get subscription counts by package' });
            }
        }
    }
}

export default new StatisticsController();
