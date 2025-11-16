import express from 'express';
import statisticsController from '../controllers/statistics.controller';
import { validate } from '../middlewares/auth';

const router = express.Router();

router.get('/revenue/total', validate, statisticsController.getRevenueTotal);
router.get('/revenue/total/subscription', validate, statisticsController.getRevenueTotalSubscription);
router.get('/revenue/total/service-completion', validate, statisticsController.getRevenueTotalServiceCompletion);


router.get('/revenue/daily', validate, statisticsController.getDailyRevenue);
router.get('/revenue/daily/subscription', validate, statisticsController.getDailyRevenueSubscription);
router.get('/revenue/daily/service-completion', validate, statisticsController.getDailyRevenueServiceCompletion);

router.get('/revenue/monthly', validate, statisticsController.getMonthlyRevenue);
router.get('/revenue/monthly/subscription', validate, statisticsController.getMonthlyRevenueSubscription);
router.get('/revenue/monthly/service-completion', validate, statisticsController.getMonthlyRevenueServiceCompletion);

router.get('/subscriptions/count-by-package', validate, statisticsController.getSubscriptionCountsByPackage);



export default router;
