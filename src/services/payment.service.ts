import Payment from '../models/payment.model';
import payOS from '../config/payos.config';
import { CreatePaymentRequest, IPayment, PaymentWebhookData } from '../types/payment.type';
import { VehicleSubscription } from '../models/vehicleSubcription.model';
import { createWarrantiesForServiceRecord } from './warranty.service';

export class PaymentService {

    async getSubscriptionPackagePrice(subscription_id: string): Promise<number> {
        try {
            const subscription = await VehicleSubscription.findById(subscription_id)
                .populate('package_id');

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const packageData = subscription.package_id as any;
            if (!packageData || !packageData.price) {
                throw new Error('Package price not found');
            }

            return packageData.price;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get package price: ${error.message}`);
            }
            throw new Error('Failed to get package price: Unknown error');
        }
    }
    async createPayment(paymentData: CreatePaymentRequest): Promise<{ payment: IPayment; paymentUrl: string }> {
        try {
            // Validate payment type and corresponding ID
            if (paymentData.payment_type === 'service_record' && !paymentData.service_record_id) {
                throw new Error('service_record_id is required for service_record payments');
            }
            if (paymentData.payment_type === 'subscription' && !paymentData.subscription_id) {
                throw new Error('subscription_id is required for subscription payments');
            }

            // Determine final amount and description
            let finalAmount: number;
            let finalDescription: string;

            // For service_record payments, amount must be provided by frontend
            if (paymentData.payment_type === 'service_record') {
                if (!paymentData.amount || paymentData.amount <= 0) {
                    throw new Error('Amount is required for service_record payments. Please calculate from service details on the frontend.');
                }
                finalAmount = paymentData.amount;
                finalDescription = paymentData.description || 'Payment for service completion';
            }
            // For subscription payments, auto-calculate from package price if not provided
            else if (paymentData.payment_type === 'subscription') {
                if (paymentData.amount && paymentData.amount > 0) {
                    // Frontend provided amount
                    finalAmount = paymentData.amount;
                    finalDescription = paymentData.description || 'Payment for subscription';
                } else {
                    // Auto-calculate from package price
                    finalAmount = await this.getSubscriptionPackagePrice(paymentData.subscription_id!);
                    finalDescription = paymentData.description || 'Payment for subscription';
                }
            } else {
                throw new Error('Invalid payment type');
            }

            // Generate unique order code
            const orderCode = Number(String(Date.now()).slice(-6));

            // Create payment link with PayOS

            // Ensure finalAmount is set (TypeScript safety check)
            if (finalAmount === undefined) {
                throw new Error('Failed to determine payment amount');
            }

            const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
            const paymentLinkData = {
                orderCode: orderCode,
                amount: finalAmount,
                description: finalDescription || 'Payment',
                returnUrl: paymentData.returnUrl || `${baseUrl}/payment/success`,
                cancelUrl: paymentData.cancelUrl || `${baseUrl}/payment/cancel`
            };

            const paymentLinkResponse = await payOS.paymentRequests.create(paymentLinkData);

            // Save payment to database
            const payment = new Payment({
                service_record_id: paymentData.service_record_id,
                subscription_id: paymentData.subscription_id,
                customer_id: paymentData.customer_id,
                order_code: orderCode,
                amount: finalAmount,
                description: finalDescription,
                payment_type: paymentData.payment_type,
                payment_url: paymentLinkResponse.checkoutUrl,
                status: 'pending'
            });

            await payment.save();

            return {
                payment: await Payment.findById(payment._id)
                    .populate('service_record_id')
                    .populate('subscription_id')
                    .populate('customer_id', 'customerName dateOfBirth address')
                    .lean() as any,
                paymentUrl: paymentLinkResponse.checkoutUrl
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create payment: ${error.message}`);
            }
            throw new Error('Failed to create payment: Unknown error');
        }
    }

    async getPaymentById(paymentId: string): Promise<IPayment | null> {
        try {
            return await Payment.findById(paymentId)
                .populate('service_record_id')
                .populate('subscription_id')
                .populate('customer_id', 'customerName dateOfBirth address')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get payment: ${error.message}`);
            }
            throw new Error('Failed to get payment: Unknown error');
        }
    }

    async getPaymentByOrderCode(orderCode: number): Promise<IPayment | null> {
        try {
            return await Payment.findOne({ order_code: orderCode })
                .populate('service_record_id')
                .populate('subscription_id')
                .populate('customer_id', 'customerName dateOfBirth address')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get payment: ${error.message}`);
            }
            throw new Error('Failed to get payment: Unknown error');
        }
    }

    async getAllPayments(filters?: {
        status?: string;
        customer_id?: string;
        service_record_id?: string;
        subscription_id?: string;
        payment_type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        payments: IPayment[];
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
            if (filters?.customer_id) {
                query.customer_id = filters.customer_id;
            }
            if (filters?.service_record_id) {
                query.service_record_id = filters.service_record_id;
            }
            if (filters?.subscription_id) {
                query.subscription_id = filters.subscription_id;
            }
            if (filters?.payment_type) {
                query.payment_type = filters.payment_type;
            }

            const [payments, total] = await Promise.all([
                Payment.find(query)
                    .populate('service_record_id')
                    .populate('subscription_id')
                    .populate('customer_id', 'customerName dateOfBirth address')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as any,
                Payment.countDocuments(query)
            ]);

            return {
                payments,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get payments: ${error.message}`);
            }
            throw new Error('Failed to get payments: Unknown error');
        }
    }

    async handlePaymentWebhook(webhookData: PaymentWebhookData): Promise<IPayment | null> {
        try {
            const payment = await Payment.findOne({ order_code: webhookData.order_code });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Update payment status based on webhook
            payment.status = webhookData.status === 'PAID' ? 'paid' : 'cancelled';
            payment.transaction_id = webhookData.transaction_id;
            payment.payment_method = webhookData.payment_method;

            if (webhookData.status === 'PAID') {
                payment.paid_at = new Date();

                // If it's a subscription payment and it's paid, activate the subscription
                if (payment.payment_type === 'subscription' && payment.subscription_id) {
                    await VehicleSubscription.findByIdAndUpdate(payment.subscription_id, { status: 'ACTIVE' });
                }

                if (payment.payment_type === 'service_record' && payment.service_record_id) {
                    try {
                        console.log(`\nTạo bảo hành`);
                        await createWarrantiesForServiceRecord(String(payment.service_record_id));
                    } catch (warrantyError) {
                        console.error(`Lỗi tạo bảo hành:`, warrantyError);
                    }
                }
            }

            await payment.save();

            return await Payment.findById(payment._id)
                .populate('service_record_id')
                .populate('subscription_id')
                .populate('customer_id', 'customerName dateOfBirth address')
                .lean() as any;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to handle payment webhook: ${error.message}`);
            }
            throw new Error('Failed to handle payment webhook: Unknown error');
        }
    }

    async cancelPayment(orderCode: number): Promise<IPayment | null> {
        try {
            const cancelResponse = await payOS.paymentRequests.cancel(orderCode);

            const payment = await Payment.findOneAndUpdate(
                { order_code: orderCode },
                { status: 'cancelled' },
                { new: true }
            )
                .populate('service_record_id')
                .populate('subscription_id')
                .populate('customer_id', 'customerName dateOfBirth address')
                .lean() as any;

            return payment;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to cancel payment: ${error.message}`);
            }
            throw new Error('Failed to cancel payment: Unknown error');
        }
    }

    async getPaymentInfo(orderCode: number): Promise<any> {
        try {
            const paymentInfo = await payOS.paymentRequests.get(orderCode);
            return paymentInfo;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get payment info: ${error.message}`);
            }
            throw new Error('Failed to get payment info: Unknown error');
        }
    }
}

export default new PaymentService();
