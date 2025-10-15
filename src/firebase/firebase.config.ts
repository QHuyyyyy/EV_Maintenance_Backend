import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getMessaging } from 'firebase-admin/messaging';
import * as dotenv from 'dotenv';

dotenv.config();

// Firebase Admin configuration
const firebaseConfig = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};

// Initialize Firebase Admin only if not already initialized
let app;
if (getApps().length === 0) {
    app = initializeApp({
        credential: cert(firebaseConfig as any),
        storageBucket: firebaseConfig.storageBucket
    });
} else {
    app = getApps()[0];
}

// Export services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export const firebaseApp = app;

export default app;