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

            if (!payment.transaction_id) {
                throw new Error('Payment does not have a transaction ID yet');
            }

            // Tự động tính minusAmount nếu là service_record payment
            let minusAmount = invoiceData.minusAmount || 0;
            
            if (payment.payment_type === 'service_record' && payment.service_record_id) {
                const serviceRecord = payment.service_record_id as any;
                
                if (serviceRecord?.appointment_id?.vehicle_id) {
                    const vehicleId = serviceRecord.appointment_id.vehicle_id._id.toString();
                    const paymentAmount = payment.amount;
                    
                    // Tính discount dựa vào subscription
                    const discountInfo = await vehicleSubscriptionService.calculateSubscriptionDiscount(
                        vehicleId,
                        paymentAmount
                    );
                    
                    if (discountInfo.hasSubscription) {
                        minusAmount = discountInfo.discount;
                    }
                }
            }

            const invoice = new Invoice({
                ...invoiceData,
                minusAmount: minusAmount
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
            return await Invoice.findById(invoiceId)
                .populate('payment_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get invoice: ${error.message}`);
            }
            throw new Error('Failed to get invoice: Unknown error');
        }
    }

    async getInvoiceByPaymentId(paymentId: string): Promise<IInvoice | null> {
        try {
            return await Invoice.findOne({ payment_id: paymentId })
                .populate('payment_id')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get invoice: ${error.message}`);
            }
            throw new Error('Failed to get invoice: Unknown error');
        }
    }

    async getAllInvoices(filters?: {
        status?: string;
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
            if (filters?.status) {
                query.status = filters.status;
            }
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

            return {
                invoices,
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

    // Preview invoice với minusAmount trước khi thanh toán
    async previewInvoiceForServiceRecord(serviceRecordId: string, totalAmount: number): Promise<{
        originalAmount: number;
        minusAmount: number;
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
                minusAmount: discountInfo.discount,
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
