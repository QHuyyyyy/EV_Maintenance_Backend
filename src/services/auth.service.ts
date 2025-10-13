import { User } from "../models/user.model";
import { AuthLoginDto, AuthRegisterDto, Payload, AuthTokenResponse, RefreshTokenDto } from "../types/auth.type";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createUser, getUserByEmailForAuth } from "./user.service";

const SECRET_KEY = process.env.JWT_SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY;

export async function login(authLoginDto: AuthLoginDto): Promise<AuthTokenResponse> {
    const user = await getUserByEmailForAuth(authLoginDto.email);
    if (user.isDeleted) {
        throw new Error("The account does not exist");
    }
    const isMatched = await comparePassword(authLoginDto.password, user.password);

    if (!isMatched) {
        throw new Error("Password not match!");
    }

    const payload: Payload = {
        sub: user._id.toString(),
        email: user.email,
        originalIssuedAt: Date.now()
    };

    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save refresh token to user
    await User.findByIdAndUpdate(user._id, { refreshToken });

    return {
        accessToken,
        refreshToken,
        expiresIn: 3600
    };
}

export async function register(authRegisterDto: AuthRegisterDto): Promise<AuthTokenResponse> {
    const existed = await User.findOne({ email: authRegisterDto.email });

    if (existed) throw new Error("Email existed");

    //   Hash password with bcrypt first
    const hashedPassword = await hashPassword(authRegisterDto.password);

    const user = await createUser({
        email: authRegisterDto.email,
        password: hashedPassword,
        role: authRegisterDto.role || "CUSTOMER",
        isDeleted: false
    });

    const payload: Payload = {
        sub: user._id.toString(),
        email: user.email,
        originalIssuedAt: Date.now()
    };

    const accessToken = signToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save refresh token to user
    await User.findByIdAndUpdate(user._id, { refreshToken });

    return {
        accessToken,
        refreshToken,
        expiresIn: 3600
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
            email: user.email,
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
