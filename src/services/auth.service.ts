import { User } from "../models/user.model";
import { AuthLoginDto, AuthRegisterDto, Payload, AuthTokenResponse, RefreshTokenDto, AuthRegisterResponse } from "../types/auth.type";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createUser, getUserByEmailForAuth, getUserByPhone } from "./user.service";
import { CustomerService } from "./customer.service";
import { SystemUserService } from "./systemUser.service";
import { auth } from "../firebase/firebase.config";

const SECRET_KEY = process.env.JWT_SECRET_KEY;
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

export async function logout(token: string, refreshToken?: string): Promise<boolean> {
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
        // Verify Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        const firebasePhone = decodedToken.phone_number;

        // Ensure phone numbers match
        if (firebasePhone !== phone) {
            throw new Error("Phone number mismatch");
        }

        // Check if user exists
        let user = await getUserByPhone(phone);

        if (!user) {
            // Create new user account for customer
            user = await createUser({
                phone: phone,
                role: "CUSTOMER",
                isDeleted: false
            });

            // Create customer profile
            await customerService.createEmptyCustomer(user._id.toString());
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

        return {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            role: user.role
        };
    } catch (error) {
        console.error("Firebase OTP login error:", error);
        throw new Error("Invalid OTP or authentication failed");
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
