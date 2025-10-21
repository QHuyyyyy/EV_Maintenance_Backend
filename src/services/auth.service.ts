import { User } from "../models/user.model";
import { AuthLoginDto, AuthRegisterDto, Payload, AuthTokenResponse, RefreshTokenDto, AuthRegisterResponse } from "../types/auth.type";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createUser, getUserByEmailForAuth, getUserByPhone } from "./user.service";
import { CustomerService } from "./customer.service";
import { SystemUserService } from "./systemUser.service";
import { auth } from "../firebase/firebase.config";

const SECRET_KEY = process.env.JWT_SECRET_KEY;

/**
 * Normalize phone number to international format (+84xxx)
 */
function normalizePhoneNumber(phone: string): string {
    if (!phone) return phone;

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with +84
    if (cleaned.startsWith('0')) {
        return '+84' + cleaned.substring(1);
    }

    // If starts with 84, add +
    if (cleaned.startsWith('84')) {
        return '+' + cleaned;
    }

    // Default: add +84
    return '+84' + cleaned;
}
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY;

const customerService = new CustomerService();
const systemUserService = new SystemUserService();

export async function login(authLoginDto: AuthLoginDto) {
    const user = await getUserByEmailForAuth(authLoginDto.email);
    if (user.isDeleted) {
        throw new Error("The account does not exist");
    }
    if (!user.password) {
        throw new Error("Invalid account type");
    }
    const isMatched = await comparePassword(authLoginDto.password, user.password);

    if (!isMatched) {
        throw new Error("Password not match!");
    }

    const payload: Payload = {
        sub: user._id.toString(),
        email: user.email || undefined,
        originalIssuedAt: Date.now()
    };

    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save refresh token to user
    await User.findByIdAndUpdate(user._id, { refreshToken });

    return {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        role: user.role
    };
}

export async function register(authRegisterDto: AuthRegisterDto): Promise<AuthRegisterResponse> {
    const existed = await User.findOne({ email: authRegisterDto.email });

    if (existed) throw new Error("Email existed");

    //   Hash password with bcrypt first
    const hashedPassword = await hashPassword(authRegisterDto.password);

    const user = await createUser({
        email: authRegisterDto.email,
        password: hashedPassword,
        role: authRegisterDto.role || "STAFF",
        isDeleted: false
    });

    // If role is CUSTOMER, automatically create an empty customer profile
    if (user.role === "CUSTOMER") {
        try {
            await customerService.createEmptyCustomer(user._id.toString());
        } catch (error) {
            console.error("Failed to create customer profile:", error);
            // Continue with registration even if customer profile creation fails
        }
    }

    // If role is TECHNICIAN or STAFF, automatically create an empty system user profile
    if (user.role === "TECHNICIAN" || user.role === "STAFF" || user.role === "ADMIN") {
        try {
            await systemUserService.createEmptySystemUser(user._id.toString());
        } catch (error) {
            console.error("Failed to create system user profile:", error);
            // Continue with registration even if system user profile creation fails
        }
    }

    return {
        message: "User registered successfully",
    };
}

export function signToken(payload: Payload) {
    return jwt.sign(payload, SECRET_KEY as string, { expiresIn: "1h" });
}

export function signRefreshToken(payload: Payload) {
    return jwt.sign(payload, REFRESH_SECRET_KEY as string, { expiresIn: "7d" });
}

export function validateToken(token: string) {
    return jwt.verify(token, SECRET_KEY as string) as Payload;
}

export function validateRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_SECRET_KEY as string) as Payload;
}

export async function refreshAccessToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokenResponse> {
    try {
        const payload = validateRefreshToken(refreshTokenDto.refreshToken);

        const user = await User.findById(payload.sub);
        if (!user || user.isDeleted) {
            throw new Error("User not found");
        }

        // Validate refresh token against stored value
        if (user.refreshToken !== refreshTokenDto.refreshToken) {
            throw new Error("Invalid refresh token");
        }

        const newPayload: Payload = {
            sub: user._id.toString(),
            email: user.email || undefined,
            originalIssuedAt: payload.originalIssuedAt || Date.now()
        };

        const accessToken = signToken(newPayload);

        return {
            accessToken,
            expiresIn: 3600
        };
    } catch (error) {
        if (error instanceof Error && error.message === "Maximum refresh time exceeded. Please login again.") {
            throw error;
        }
        throw new Error("Invalid refresh token");
    }
}

export async function logout(token: string): Promise<boolean> {
    try {
        // Validate token to get user ID
        const payload = validateToken(token);

        // Clear refresh token from user
        await User.findByIdAndUpdate(payload.sub, { refreshToken: null });

        return true;
    } catch (error) {
        return false;
    }
}

async function hashPassword(password: string, saltRounds: number = 10) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

async function comparePassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
}

// Firebase OTP Login for customers
export async function loginWithFirebaseOTP(idToken: string, phone: string) {
    try {
        console.log('[OTP Login] Starting Firebase OTP authentication...');
        console.log('[OTP Login] Received phone:', phone);

        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const firebasePhone = decodedToken.phone_number;

        console.log('[OTP Login] Firebase phone from token:', firebasePhone);

        // Check if Firebase token contains phone number
        if (!firebasePhone) {
            throw new Error("Firebase token does not contain phone number");
        }

        // Normalize both phone numbers to ensure they match
        const normalizedPhone = normalizePhoneNumber(phone);
        const normalizedFirebasePhone = normalizePhoneNumber(firebasePhone);

        console.log('[OTP Login] Normalized user phone:', normalizedPhone);
        console.log('[OTP Login] Normalized Firebase phone:', normalizedFirebasePhone);

        // Ensure phone numbers match (after normalization)
        if (normalizedFirebasePhone !== normalizedPhone) {
            console.error(`[OTP Login] Phone mismatch - Firebase: ${normalizedFirebasePhone}, User: ${normalizedPhone}`);
            throw new Error("Phone number mismatch");
        }

        console.log('[OTP Login] Phone numbers matched successfully');

        // Check if user exists
        let user = await getUserByPhone(normalizedPhone);

        if (!user) {
            console.log('[OTP Login] User not found, creating new customer...');
            // Create new user account for customer
            user = await createUser({
                phone: normalizedPhone,
                role: "CUSTOMER",
                isDeleted: false
            });

            // Create customer profile
            await customerService.createEmptyCustomer(user._id.toString());
            console.log('[OTP Login] New customer created:', user._id);
        } else {
            console.log('[OTP Login] Existing user found:', user._id);
        }

        if (user.isDeleted) {
            throw new Error("The account does not exist");
        }

        if (user.role !== "CUSTOMER") {
            throw new Error("This login method is only for customers");
        }

        const payload: Payload = {
            sub: user._id.toString(),
            phone: user.phone || undefined,
            originalIssuedAt: Date.now()
        };

        const accessToken = signToken(payload);
        const refreshToken = signRefreshToken(payload);

        // Save refresh token to user
        await User.findByIdAndUpdate(user._id, { refreshToken });

        console.log('[OTP Login] Authentication successful for user:', user._id);

        return {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            role: user.role
        };
    } catch (error: any) {
        console.error("[OTP Login] Authentication error:", error.message);
        console.error("[OTP Login] Full error:", error);

        // Re-throw specific errors so controller can handle them
        if (error.message === "Phone number mismatch") {
            console.error("[OTP Login] Phone number mismatch detected");
            throw error;
        }

        if (error.message === "The account does not exist" ||
            error.message === "This login method is only for customers") {
            console.error("[OTP Login] Account validation failed:", error.message);
            throw error;
        }

        if (error.message === "Firebase token does not contain phone number") {
            console.error("[OTP Login] Firebase token missing phone number");
            throw error;
        }

        // For Firebase verification errors
        if (error.code === 'auth/invalid-id-token' || error.code === 'auth/id-token-expired') {
            console.error("[OTP Login] Invalid or expired Firebase ID token");
            throw new Error("Invalid or expired Firebase ID token");
        }

        console.error("[OTP Login] Unhandled error type");
        throw new Error(error.message || "Invalid OTP or authentication failed");
    }
}

// Assign vehicle to customer by phone
export async function assignVehicleToCustomer(vehicleId: string, phone: string) {
    try {
        // Check if user exists with this phone
        let user = await getUserByPhone(phone);
        let customer;

        if (!user) {
            // Create new user account
            user = await createUser({
                phone: phone,
                role: "CUSTOMER",
                isDeleted: false
            });

            // Create customer profile
            customer = await customerService.createEmptyCustomer(user._id.toString());
        } else {
            // Get existing customer profile
            customer = await customerService.getCustomerByUserId(user._id.toString());
        }

        if (!customer) {
            throw new Error("Failed to create or find customer profile");
        }

        // Update vehicle with customer ID
        const { Vehicle } = await import("../models/vehicle.model");
        await Vehicle.findByIdAndUpdate(vehicleId, { customerId: customer._id });

        return {
            message: "Vehicle assigned to customer successfully",
            customerId: customer._id,
            userId: user._id
        };
    } catch (error) {
        console.error("Assign vehicle error:", error);
        throw new Error("Failed to assign vehicle to customer");
    }
}

/**
 * Register Firebase device token for push notifications
 */
export async function registerDeviceToken(userId: string, token: string) {
    try {
        if (!token) {
            throw new Error('Device token is required');
        }

        // Find customer by user
        const { default: Customer } = await import("../models/customer.model");
        const customer = await Customer.findOne({ userId });

        if (!customer) {
            throw new Error('Customer not found');
        }

        // Add token if not already exists
        if (!customer.deviceTokens.includes(token)) {
            customer.deviceTokens.push(token);
            await customer.save();
            console.log(`✅ Device token registered for customer: ${customer._id}`);
        }

        return {
            customerId: customer._id,
            tokenCount: customer.deviceTokens.length
        };
    } catch (error) {
        console.error('Error registering device token:', error);
        throw error;
    }
}

/**
 * Unregister Firebase device token
 */
export async function unregisterDeviceToken(userId: string, token: string) {
    try {
        if (!token) {
            throw new Error('Device token is required');
        }

        const { default: Customer } = await import("../models/customer.model");
        const customer = await Customer.findOne({ userId });

        if (!customer) {
            throw new Error('Customer not found');
        }

        // Remove token
        const index = customer.deviceTokens.indexOf(token);
        if (index > -1) {
            customer.deviceTokens.splice(index, 1);
            await customer.save();
            console.log(`✅ Device token unregistered for customer: ${customer._id}`);
        }

        return {
            customerId: customer._id,
            tokenCount: customer.deviceTokens.length
        };
    } catch (error) {
        console.error('Error unregistering device token:', error);
        throw error;
    }
}

