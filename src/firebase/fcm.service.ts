import { messaging } from './firebase.config';

/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for EV maintenance alerts
 * 
 * Express.js version (not NestJS)
 */

export interface NotificationPayload {
    tokens: string[];
    notification: {
        title: string;
        body: string;
        imageUrl?: string;
    };
    data?: {
        [key: string]: string;
    };
}

export interface SendResult {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
    errors: Array<{ token: string; error: string }>;
}

class FirebaseNotificationService {
    /**
     * Send push notification to multiple devices
     * 
     * @param payload - Notification payload
     * @returns Result with success/failure counts
     */
    async sendMulticast(payload: NotificationPayload): Promise<SendResult> {
        try {
            if (!payload.tokens || payload.tokens.length === 0) {
                console.warn('❌ No device tokens provided');
                return {
                    successCount: 0,
                    failureCount: 0,
                    invalidTokens: [],
                    errors: []
                };
            }

            console.log(`📤 Sending notification to ${payload.tokens.length} devices`);

            const message = {
                notification: {
                    title: payload.notification.title,
                    body: payload.notification.body,
                },
                data: payload.data || {},
                android: {
                    priority: 'high' as const,
                    notification: {
                        sound: 'default',
                        channelId: 'maintenance_alerts',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                },
                apns: {
                    headers: {
                        'apns-priority': '10'
                    },
                    payload: {
                        aps: {
                            alert: {
                                title: payload.notification.title,
                                body: payload.notification.body
                            },
                            sound: 'default',
                            badge: 1,
                            'content-available': 1
                        }
                    }
                },
                webpush: {
                    notification: {
                        title: payload.notification.title,
                        body: payload.notification.body,
                        icon: payload.notification.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/blood-donation-18260.firebasestorage.app/o/FCMImages%2FAiLert_small_logo_color_alpha-300x300.png'
                    }
                }
            };

            // Send to all tokens
            const response = await messaging.sendEachForMulticast({
                ...message,
                tokens: payload.tokens
            } as any);

            // Process results
            const invalidTokens: string[] = [];
            const errors: Array<{ token: string; error: string }> = [];
            let successCount = 0;
            let failureCount = 0;

            payload.tokens.forEach((token, index) => {
                if (response.responses[index].success) {
                    successCount++;
                    console.log(`✅ Sent to token: ${token.substring(0, 20)}...`);
                } else {
                    failureCount++;
                    const error = response.responses[index].error;
                    const errorMsg = error?.message || 'Unknown error';

                    console.error(`❌ Failed to send to token: ${token.substring(0, 20)}..., Error: ${errorMsg}`);

                    // Check if token is invalid
                    if (
                        errorMsg.includes('unregistered') ||
                        errorMsg.includes('invalid') ||
                        errorMsg.includes('not-registered')
                    ) {
                        invalidTokens.push(token);
                    }

                    errors.push({
                        token,
                        error: errorMsg
                    });
                }
            });

            console.log(`📊 Results: ${successCount} success, ${failureCount} failed`);
            if (invalidTokens.length > 0) {
                console.log(`⚠️ Invalid tokens to remove: ${invalidTokens.length}`);
            }

            return {
                successCount,
                failureCount,
                invalidTokens,
                errors
            };
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            return {
                successCount: 0,
                failureCount: payload.tokens.length,
                invalidTokens: [],
                errors: [{
                    token: payload.tokens[0] || 'unknown',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }]
            };
        }
    }

    /**
     * Send notification to single device
     */
    async sendSingle(token: string, payload: Omit<NotificationPayload, 'tokens'>): Promise<SendResult> {
        return this.sendMulticast({
            ...payload,
            tokens: [token]
        });
    }

    /**
     * Remove invalid tokens from customer
     */
    async removeInvalidTokens(invalidTokens: string[], customerId: string): Promise<boolean> {
        try {
            if (invalidTokens.length === 0) return true;

            // Import here to avoid circular dependency
            const Customer = require('../models/customer.model').default;

            const result = await Customer.updateOne(
                { _id: customerId },
                { $pull: { deviceTokens: { $in: invalidTokens } } }
            );

            if (result.modifiedCount > 0) {
                console.log(`🗑️ Removed ${invalidTokens.length} invalid tokens from customer`);
            }

            return true;
        } catch (error) {
            console.error('Error removing invalid tokens:', error);
            return false;
        }
    }
}

export const firebaseNotificationService = new FirebaseNotificationService();
