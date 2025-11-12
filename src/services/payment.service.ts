import Payment from '../models/payment.model';
import payOS from '../config/payos.config';
import { CreatePaymentRequest, IPayment, PaymentWebhookData } from '../types/payment.type';
import { VehicleSubscription } from '../models/vehicleSubcription.model';
import { createWarrantiesForServiceRecord } from './warranty.service';
import Invoice from '../models/invoice.model';

export class PaymentService {

    async getSubscriptionPackagePrice(subscription_id: string): Promise<number> {
        try {
            const subscription = await VehicleSubscription.findById(subscription_id)
                .populate('package_id');

            if (!subscription) {
                throw new Error('Subscription not found');
            }

            // Use final_price from subscription (already includes discount)
            const subscriptionData = subscription as any;
            if (subscriptionData.final_price !== undefined && subscriptionData.final_price >= 0) {
                return subscriptionData.final_price;
            }

            // Fallback to package price (for old subscriptions without pricing fields)
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

    async handlePaymentWebhook(webhookData: any): Promise<IPayment | null> {
        try {
            console.log('🔍 Processing webhook data:', JSON.stringify(webhookData, null, 2));
            
            // Check if webhookData is empty or null
            if (!webhookData || Object.keys(webhookData).length === 0) {
                console.log('⚠️  Empty webhook data - PayOS test webhook');
                return null; // Accept empty test webhook
            }
            
            // PayOS webhook format có thể là:
            // { code: "00", desc: "success", data: { orderCode, amount, ... } }
            // hoặc trực tiếp { order_code, status, ... }
            
            let orderCode: number | undefined;
            let isPaid = false;
            let transactionId: string | undefined;
            let paymentMethod: string | undefined;
            
            // Check format từ PayOS webhook documentation
            if (webhookData.code !== undefined && webhookData.data) {
                // Format mới: { code: "00", data: { orderCode, ... } }
                orderCode = webhookData.data.orderCode;
                isPaid = webhookData.code === "00" && webhookData.desc === "success";
                transactionId = webhookData.data.reference || webhookData.data.transactionDateTime;
                paymentMethod = webhookData.data.counterAccountBankName || 'Bank Transfer';
                
                console.log(`  Format: PayOS webhook v2 (code: ${webhookData.code})`);
            } else if (webhookData.order_code || webhookData.orderCode) {
                // Format cũ: { order_code, status, ... }
                orderCode = webhookData.order_code || webhookData.orderCode;
                isPaid = webhookData.status === 'PAID';
                transactionId = webhookData.transaction_id;
                paymentMethod = webhookData.payment_method;
                
                console.log(`  Format: Direct webhook (status: ${webhookData.status})`);
            } else {
                // PayOS test webhook hoặc invalid format
                console.log('⚠️  Webhook test or unknown format - accepting for webhook verification');
                console.log('  Available keys:', Object.keys(webhookData));
                return null; // Return null but don't throw error (200 OK for PayOS)
            }

            if (!orderCode) {
                console.log('⚠️  No orderCode found - test webhook');
                return null;
            }

            console.log(`  Order Code: ${orderCode}, Paid: ${isPaid}`);

            const payment = await Payment.findOne({ order_code: orderCode });

            if (!payment) {
                // Payment không tồn tại - có thể là test webhook từ PayOS
                console.log(`⚠️  Payment not found for order code: ${orderCode} - might be PayOS test webhook`);
                // Return null nhưng không throw error để PayOS nhận 200 OK
                return null;
            }

            // Update payment status based on webhook
            payment.status = isPaid ? 'paid' : 'cancelled';
            
            if (transactionId) {
                payment.transaction_id = transactionId;
            }
            if (paymentMethod) {
                payment.payment_method = paymentMethod;
            }

            if (isPaid) {
                payment.paid_at = new Date();
                
                console.log(`💰 Payment marked as PAID for order: ${orderCode}`);
            } else {
                console.log(`❌ Payment marked as CANCELLED for order: ${orderCode}`);
            }

            // ⚠️ IMPORTANT: Save payment FIRST before creating related records
            await payment.save();
            console.log(`  ✓ Payment saved to database`);

            // Now handle post-payment actions (only if paid)
            if (isPaid) {
                // If it's a subscription payment and it's paid, activate the subscription
                if (payment.payment_type === 'subscription' && payment.subscription_id) {
                    await VehicleSubscription.findByIdAndUpdate(payment.subscription_id, { status: 'ACTIVE' });
                    console.log(`  ✓ Subscription activated`);
                }

                // If it's a service record payment, create warranties
                if (payment.payment_type === 'service_record' && payment.service_record_id) {
                    try {
                        console.log(`  ✓ Creating warranties for service record...`);
                        await createWarrantiesForServiceRecord(String(payment.service_record_id));
                        console.log(`  ✓ Warranties created successfully`);
                    } catch (warrantyError) {
                        console.error(`  ✗ Error creating warranties:`, warrantyError);
                    }
                }

                // Auto-create invoice after successful payment
                try {
                    console.log(`  ✓ Creating invoice...`);
                    
                    // Check if invoice already exists
                    const existingInvoice = await Invoice.findOne({ payment_id: payment._id });
                    
                    if (!existingInvoice) {
                        const invoiceService = require('./invoice.service').default;
                        const paymentId = (payment._id as any).toString();
                        
                        // Create invoice with auto-calculated minusAmount
                        const invoice = await invoiceService.createInvoice({
                            payment_id: paymentId,
                            invoiceType: payment.payment_type === 'subscription' 
                                ? 'Subscription Package' 
                                : 'Service Completion',
                            totalAmount: payment.amount,
                            status: 'issued'
                        });
                        
                        console.log(`  ✓ Invoice created: ${invoice._id}`);
                    } else {
                        console.log(`  ℹ Invoice already exists`);
                    }
                } catch (invoiceError) {
                    console.error(`  ✗ Error creating invoice:`, invoiceError);
                    // Don't throw error, just log it - payment is still successful
                }
            }

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

    // DEVELOPMENT ONLY: Simulate payment success for testing
    async simulatePaymentSuccess(orderCode: number): Promise<IPayment | null> {
        try {
            // Only allow in development environment
            if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_PAYMENT_BYPASS !== 'true') {
                throw new Error('Payment simulation is only available in development mode');
            }

            const payment = await Payment.findOne({ order_code: orderCode });

            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status === 'paid') {
                throw new Error('Payment is already paid');
            }

            // Simulate webhook data
            const simulatedWebhookData: PaymentWebhookData = {
                order_code: orderCode,
                status: 'PAID',
                transaction_id: `TEST_${Date.now()}`,
                payment_method: 'SIMULATED',
                amount: payment.amount,
                description: payment.description || 'Simulated payment for testing'
            };

            // Use existing webhook handler
            return await this.handlePaymentWebhook(simulatedWebhookData);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to simulate payment: ${error.message}`);
            }
            throw new Error('Failed to simulate payment: Unknown error');
        }
    }
}

export default new PaymentService();
