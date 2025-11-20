import Invoice from '../models/invoice.model';
import Payment from '../models/payment.model';
import { CreateInvoiceRequest, IInvoice, UpdateInvoiceRequest } from '../types/invoice.type';
import vehicleSubscriptionService from './vehicleSubcription.service';
import ServiceRecord from '../models/serviceRecord.model';

export class InvoiceService {
    async createInvoice(invoiceData: CreateInvoiceRequest): Promise<IInvoice> {
        try {
            // Get payment details to validate and check payment status
            const payment = await Payment.findById(invoiceData.payment_id)
                .populate({
                    path: 'service_record_id',
                    populate: {
                        path: 'appointment_id',
                        populate: { path: 'vehicle_id' }
                    }
                });

            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'paid') {
                throw new Error('Cannot create invoice for unpaid payment');
            }

            // Calculate discount percentage from package
            let discountPercent = 0;

            // For service_record payments, always try to get discount % from subscription package
            if (payment.payment_type === 'service_record' && payment.service_record_id) {
                const serviceRecord = payment.service_record_id as any;
                if (serviceRecord?.appointment_id?.vehicle_id) {
                    const vehicleId = serviceRecord.appointment_id.vehicle_id._id.toString();
                    
                    // Try to get active subscription (similar to getPackageByServiceRecord)
                    const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                    const activeSubscription = await VehicleSubscription.findOne({
                        vehicleId,
                        status: 'ACTIVE'
                    }).populate('package_id', 'discount_percent');
                    
                    if (activeSubscription) {
                        const packageData = activeSubscription.package_id as any;
                        discountPercent = packageData?.discount_percent || 0;
                    } else {
                        // Fallback to calculateSubscriptionDiscount if direct query fails
                        const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                            vehicleId,
                            payment.amount
                        );
                        if (discountInfo.hasSubscription) {
                            discountPercent = discountInfo.discountPercent;
                        }
                    }
                }
            } else if (payment.payment_type === 'subscription' && payment.subscription_id) {
                // For subscription payments, get discount % from subscription
                const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                const subscription = await VehicleSubscription.findById(payment.subscription_id)
                    .populate('package_id', 'discount_percent');
                if (subscription) {
                    const packageData = subscription.package_id as any;
                    discountPercent = packageData?.discount_percent || 0;
                }
            }

            // If minusAmount is explicitly provided and valid, use it (override calculated value)
            if (invoiceData.minusAmount !== undefined && invoiceData.minusAmount >= 0 && invoiceData.minusAmount <= 100) {
                discountPercent = invoiceData.minusAmount;
            }

            // Ensure discountPercent is within valid range (0-100)
            discountPercent = Math.max(0, Math.min(100, discountPercent));

            // Ensure discountPercent is within valid range (0-100)
            discountPercent = Math.max(0, Math.min(100, discountPercent));

            // Create invoice with discount percentage
            const { payment_id, invoiceType, totalAmount } = invoiceData;
            const invoice = new Invoice({
                payment_id,
                invoiceType,
                minusAmount: discountPercent, // Store discount percentage (0-100)
                totalAmount
            });

            await invoice.save();

            return await Invoice.findById(invoice._id)
                .populate('payment_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create invoice: ${error.message}`);
            }
            throw new Error('Failed to create invoice: Unknown error');
        }
    }

    async getInvoiceById(invoiceId: string): Promise<IInvoice | null> {
        try {
            const invoice = await Invoice.findById(invoiceId)
                .populate('payment_id')
                .lean() as any;
            
            // Recalculate minusAmount (discount %) from package if it's invalid (> 100)
            if (invoice && invoice.minusAmount > 100) {
                const payment = invoice.payment_id as any;
                if (payment) {
                    try {
                        if (payment.payment_type === 'service_record' && payment.service_record_id) {
                            const ServiceRecord = require('../models/serviceRecord.model').default;
                            const serviceRecord = await ServiceRecord.findById(payment.service_record_id)
                                .populate({
                                    path: 'appointment_id',
                                    populate: { path: 'vehicle_id' }
                                });
                            if (serviceRecord?.appointment_id?.vehicle_id) {
                                const vehicleId = serviceRecord.appointment_id.vehicle_id._id.toString();
                                // Try direct query first (faster)
                                const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                                const activeSubscription = await VehicleSubscription.findOne({
                                    vehicleId,
                                    status: 'ACTIVE'
                                }).populate('package_id', 'discount_percent');
                                
                                if (activeSubscription) {
                                    const packageData = activeSubscription.package_id as any;
                                    invoice.minusAmount = packageData?.discount_percent || 0;
                                } else {
                                    // Fallback to calculateSubscriptionDiscount
                                    const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                                        vehicleId,
                                        payment.amount
                                    );
                                    invoice.minusAmount = discountInfo.hasSubscription ? discountInfo.discountPercent : 0;
                                }
                            } else {
                                invoice.minusAmount = 0;
                            }
                        } else if (payment.payment_type === 'subscription' && payment.subscription_id) {
                            const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                            const subscription = await VehicleSubscription.findById(payment.subscription_id)
                                .populate('package_id', 'discount_percent');
                            if (subscription) {
                                const packageData = subscription.package_id as any;
                                invoice.minusAmount = packageData?.discount_percent || 0;
                            } else {
                                invoice.minusAmount = 0;
                            }
                        } else {
                            invoice.minusAmount = 0;
                        }
                    } catch (error) {
                        // If recalculation fails, set to 0
                        invoice.minusAmount = 0;
                    }
                } else {
                    invoice.minusAmount = 0;
                }
            }
            
            return invoice;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get invoice: ${error.message}`);
            }
            throw new Error('Failed to get invoice: Unknown error');
        }
    }

    async getInvoiceByPaymentId(paymentId: string): Promise<IInvoice | null> {
        try {
            const invoice = await Invoice.findOne({ payment_id: paymentId })
                .populate('payment_id')
                .lean() as any;
            
            // Recalculate minusAmount (discount %) from package if it's invalid (> 100) and update database
            if (invoice && invoice.minusAmount > 100) {
                const payment = invoice.payment_id as any;
                let newDiscountPercent = 0;
                
                if (payment) {
                    try {
                        if (payment.payment_type === 'service_record' && payment.service_record_id) {
                            const ServiceRecord = require('../models/serviceRecord.model').default;
                            const serviceRecord = await ServiceRecord.findById(payment.service_record_id)
                                .populate({
                                    path: 'appointment_id',
                                    populate: { path: 'vehicle_id' }
                                });
                            if (serviceRecord?.appointment_id?.vehicle_id) {
                                const vehicleId = serviceRecord.appointment_id.vehicle_id._id.toString();
                                // Try direct query first (faster)
                                const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                                const activeSubscription = await VehicleSubscription.findOne({
                                    vehicleId,
                                    status: 'ACTIVE'
                                }).populate('package_id', 'discount_percent');
                                
                                if (activeSubscription) {
                                    const packageData = activeSubscription.package_id as any;
                                    newDiscountPercent = packageData?.discount_percent || 0;
                                } else {
                                    // Fallback to calculateSubscriptionDiscount
                                    const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                                        vehicleId,
                                        payment.amount
                                    );
                                    newDiscountPercent = discountInfo.hasSubscription ? discountInfo.discountPercent : 0;
                                }
                            }
                        } else if (payment.payment_type === 'subscription' && payment.subscription_id) {
                            const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                            const subscription = await VehicleSubscription.findById(payment.subscription_id)
                                .populate('package_id', 'discount_percent');
                            if (subscription) {
                                const packageData = subscription.package_id as any;
                                newDiscountPercent = packageData?.discount_percent || 0;
                            }
                        }
                    } catch (error) {
                        // If recalculation fails, keep 0
                        newDiscountPercent = 0;
                    }
                }
                
                // Update database with corrected discount percentage
                if (newDiscountPercent !== invoice.minusAmount) {
                    await Invoice.findOneAndUpdate(
                        { payment_id: paymentId },
                        { minusAmount: newDiscountPercent }
                    );
                    invoice.minusAmount = newDiscountPercent;
                }
            }
            
            return invoice;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get invoice: ${error.message}`);
            }
            throw new Error('Failed to get invoice: Unknown error');
        }
    }

    async getAllInvoices(filters?: {
        payment_id?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        invoices: IInvoice[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 10;
            const skip = (page - 1) * limit;

            const query: any = {};
            // Always return issued invoices only
            query.status = 'issued';
            if (filters?.payment_id) {
                query.payment_id = filters.payment_id;
            }

            const [invoices, total] = await Promise.all([
                Invoice.find(query)
                    .populate('payment_id')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                Invoice.countDocuments(query)
            ]);

            // Recalculate minusAmount (discount %) from package for old invoices with invalid values (> 100) and update database
            const normalizedInvoices = await Promise.all(invoices.map(async (invoice: any) => {
                if (invoice.minusAmount > 100) {
                    const payment = invoice.payment_id as any;
                    let newDiscountPercent = 0;
                    
                    if (payment) {
                        try {
                            if (payment.payment_type === 'service_record' && payment.service_record_id) {
                                const ServiceRecord = require('../models/serviceRecord.model').default;
                                const serviceRecord = await ServiceRecord.findById(payment.service_record_id)
                                    .populate({
                                        path: 'appointment_id',
                                        populate: { path: 'vehicle_id' }
                                    });
                                if (serviceRecord?.appointment_id?.vehicle_id) {
                                    const vehicleId = serviceRecord.appointment_id.vehicle_id._id.toString();
                                    // Try direct query first (faster)
                                    const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                                    const activeSubscription = await VehicleSubscription.findOne({
                                        vehicleId,
                                        status: 'ACTIVE'
                                    }).populate('package_id', 'discount_percent');
                                    
                                    if (activeSubscription) {
                                        const packageData = activeSubscription.package_id as any;
                                        newDiscountPercent = packageData?.discount_percent || 0;
                                    } else {
                                        // Fallback to calculateSubscriptionDiscount
                                        const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                                            vehicleId,
                                            payment.amount
                                        );
                                        newDiscountPercent = discountInfo.hasSubscription ? discountInfo.discountPercent : 0;
                                    }
                                }
                            } else if (payment.payment_type === 'subscription' && payment.subscription_id) {
                                const { VehicleSubscription } = require('../models/vehicleSubcription.model');
                                const subscription = await VehicleSubscription.findById(payment.subscription_id)
                                    .populate('package_id', 'discount_percent');
                                if (subscription) {
                                    const packageData = subscription.package_id as any;
                                    newDiscountPercent = packageData?.discount_percent || 0;
                                }
                            }
                        } catch (error) {
                            // If recalculation fails, keep 0
                            newDiscountPercent = 0;
                        }
                    }
                    
                    // Update database with corrected discount percentage
                    if (newDiscountPercent !== invoice.minusAmount) {
                        await Invoice.findByIdAndUpdate(invoice._id, { minusAmount: newDiscountPercent });
                        invoice.minusAmount = newDiscountPercent;
                    }
                }
                return invoice;
            }));

            return {
                invoices: normalizedInvoices,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get invoices: ${error.message}`);
            }
            throw new Error('Failed to get invoices: Unknown error');
        }
    }

    async updateInvoice(invoiceId: string, updateData: UpdateInvoiceRequest): Promise<IInvoice | null> {
        try {
            return await Invoice.findByIdAndUpdate(
                invoiceId,
                updateData,
                { new: true }
            )
                .populate('payment_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update invoice: ${error.message}`);
            }
            throw new Error('Failed to update invoice: Unknown error');
        }
    }

    async deleteInvoice(invoiceId: string): Promise<IInvoice | null> {
        try {
            return await Invoice.findByIdAndDelete(invoiceId)
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete invoice: ${error.message}`);
            }
            throw new Error('Failed to delete invoice: Unknown error');
        }
    }

    async getRevenueStats(params?: { invoiceType?: 'Subscription Package' | 'Service Completion' }): Promise<{
        totalRevenue: number;
    }> {
        try {
            const amountExpr = '$totalAmount' as any;

            const match: any = { status: 'issued' };
            if (params?.invoiceType) {
                match.invoiceType = params.invoiceType;
            }

            const [result] = await Invoice.aggregate([
                { $match: match },
                {
                    $facet: {
                        total: [
                            { $group: { _id: null, revenue: { $sum: amountExpr } } }
                        ]
                    }
                }
            ]);

            const totalRevenue = (result?.total?.[0]?.revenue as number) || 0;


            return { totalRevenue };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get revenue stats: ${error.message}`);
            }
            throw new Error('Failed to get revenue stats: Unknown error');
        }
    }

    async getDailyRevenueByMonth(params: {
        month: number; // 1-12
        year?: number; // default current year
        invoiceType?: 'Subscription Package' | 'Service Completion';
    }): Promise<Array<{ date: string; revenue: number }>> {
        try {
            const { month } = params;
            const year = params.year ?? new Date().getFullYear();

            if (!month || month < 1 || month > 12) {
                throw new Error('Invalid month. Must be 1-12');
            }

            const amountExpr = '$totalAmount' as any;

            // Use Vietnam timezone for correct day bucketing
            const TZ = 'Asia/Ho_Chi_Minh';

            const match: any = { status: 'issued' };
            if (params.invoiceType) {
                match.invoiceType = params.invoiceType;
            }

            const results = await Invoice.aggregate([
                { $match: match },
                {
                    $addFields: {
                        viYear: { $toInt: { $dateToString: { date: '$createdAt', format: '%Y', timezone: TZ } } },
                        viMonth: { $toInt: { $dateToString: { date: '$createdAt', format: '%m', timezone: TZ } } },
                        viDay: { $toInt: { $dateToString: { date: '$createdAt', format: '%d', timezone: TZ } } }
                    }
                },
                { $match: { viYear: year, viMonth: month } },
                {
                    $group: {
                        _id: '$viDay',
                        revenue: { $sum: amountExpr }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Build full array with zeros for missing days
            const daysInMonth = new Date(year, month, 0).getDate();
            const map = new Map<number, number>();
            for (const r of results) {
                map.set(r._id as number, (r.revenue as number) || 0);
            }
            const daily: Array<{ date: string; revenue: number }> = [];
            const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${pad(month)}-${pad(d)}`;
                daily.push({ date: dateStr, revenue: map.get(d) ?? 0 });
            }

            return daily;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get daily revenue: ${error.message}`);
            }
            throw new Error('Failed to get daily revenue: Unknown error');
        }
    }

    async getMonthlyRevenueByYear(params: {
        year: number; // e.g., 2025
        invoiceType?: 'Subscription Package' | 'Service Completion';
    }): Promise<Array<{ month: number; revenue: number }>> {
        try {
            const { year } = params;

            if (!year || year < 1970) {
                throw new Error('Invalid year');
            }

            const amountExpr = '$totalAmount' as any;
            const TZ = 'Asia/Ho_Chi_Minh';

            const match: any = { status: 'issued' };
            if (params.invoiceType) {
                match.invoiceType = params.invoiceType;
            }

            const results = await Invoice.aggregate([
                { $match: match },
                {
                    $addFields: {
                        viYear: { $toInt: { $dateToString: { date: '$createdAt', format: '%Y', timezone: TZ } } },
                        viMonth: { $toInt: { $dateToString: { date: '$createdAt', format: '%m', timezone: TZ } } }
                    }
                },
                { $match: { viYear: year } },
                {
                    $group: {
                        _id: '$viMonth',
                        revenue: { $sum: amountExpr }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const map = new Map<number, number>();
            for (const r of results) {
                map.set(r._id as number, (r.revenue as number) || 0);
            }
            const monthly: Array<{ month: number; revenue: number }> = [];
            for (let m = 1; m <= 12; m++) {
                monthly.push({ month: m, revenue: map.get(m) ?? 0 });
            }

            return monthly;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get monthly revenue: ${error.message}`);
            }
            throw new Error('Failed to get monthly revenue: Unknown error');
        }
    }


    async getSubscriptionRevenueByPackage(params?: { month?: number; year?: number }): Promise<Array<{ packageId: string; packageName: string; revenue: number }>> {
        try {
            const TZ = 'Asia/Ho_Chi_Minh';
            const month = params?.month;
            const year = params?.year;

            const pipeline: any[] = [
                { $match: { status: 'issued', invoiceType: 'Subscription Package' } },
                { $lookup: { from: 'payments', localField: 'payment_id', foreignField: '_id', as: 'pay' } },
                { $unwind: '$pay' },
                { $lookup: { from: 'vehiclesubscriptions', localField: 'pay.subscription_id', foreignField: '_id', as: 'vs' } },
                { $unwind: '$vs' },
                { $lookup: { from: 'servicepackages', localField: 'vs.package_id', foreignField: '_id', as: 'sp' } },
                { $unwind: '$sp' },
            ];

            // Add VN time fields and optional month/year filtering
            pipeline.push({
                $addFields: {
                    viYear: { $toInt: { $dateToString: { date: '$createdAt', format: '%Y', timezone: TZ } } },
                    viMonth: { $toInt: { $dateToString: { date: '$createdAt', format: '%m', timezone: TZ } } }
                }
            });

            const dateMatch: any = {};
            if (typeof month === 'number' && !Number.isNaN(month)) {
                dateMatch.viMonth = month;
            }
            if (typeof year === 'number' && !Number.isNaN(year)) {
                dateMatch.viYear = year;
            }
            if (Object.keys(dateMatch).length > 0) {
                pipeline.push({ $match: dateMatch });
            }

            pipeline.push({
                $group: {
                    _id: { packageId: '$sp._id', name: '$sp.name' },
                    revenue: { $sum: '$totalAmount' }
                }
            });
            pipeline.push({ $project: { _id: 0, packageId: '$_id.packageId', packageName: '$_id.name', revenue: 1 } });
            pipeline.push({ $sort: { revenue: -1, packageName: 1 } });

            const results = await (Invoice as any).aggregate(pipeline);
            return results as Array<{ packageId: string; packageName: string; revenue: number }>;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get subscription revenue by package: ${error.message}`);
            }
            throw new Error('Failed to get subscription revenue by package: Unknown error');
        }
    }

    // Preview invoice với discount calculation trước khi thanh toán
    async previewInvoiceForServiceRecord(serviceRecordId: string, totalAmount: number): Promise<{
        originalAmount: number;
        discountAmount: number;
        finalAmount: number;
        hasSubscription: boolean;
        subscriptionInfo?: {
            subscriptionId: string;
            packageName: string;
            discountPercent: number;
        };
    }> {
        try {
            // Lấy service record và vehicle
            const serviceRecord = await ServiceRecord.findById(serviceRecordId)
                .populate({
                    path: 'appointment_id',
                    populate: { path: 'vehicle_id' }
                });

            if (!serviceRecord) {
                throw new Error('Service record not found');
            }

            const appointment = serviceRecord.appointment_id as any;
            if (!appointment || !appointment.vehicle_id) {
                throw new Error('Vehicle information not found');
            }

            const vehicleId = appointment.vehicle_id._id.toString();

            // Tính discount từ subscription
            const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                vehicleId,
                totalAmount
            );

            return {
                originalAmount: totalAmount,
                discountAmount: discountInfo.discount,
                finalAmount: discountInfo.finalAmount,
                hasSubscription: discountInfo.hasSubscription,
                subscriptionInfo: discountInfo.hasSubscription ? {
                    subscriptionId: discountInfo.subscriptionId!,
                    packageName: discountInfo.packageName!,
                    discountPercent: discountInfo.discountPercent
                } : undefined
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to preview invoice: ${error.message}`);
            }
            throw new Error('Failed to preview invoice: Unknown error');
        }
    }
}

export default new InvoiceService();
