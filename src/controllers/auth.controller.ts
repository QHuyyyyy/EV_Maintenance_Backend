import { Request, Response } from "express";
import { login, register, refreshAccessToken, logout } from "../services/auth.service";
import { AuthLoginDto, AuthRegisterDto, RefreshTokenDto } from "../types/auth.type";

export async function loginController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Login with email and password'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: '#/definitions/Login'
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'User logged in successfully',
        schema: {
            success: true,
            message: 'Login successfully',
            token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    } */
    /* #swagger.responses[401] = {
        description: 'Invalid email or password',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const authLoginDto: AuthLoginDto = { email, password };
        const tokenResponse = await login(authLoginDto);

        return res.status(200).json({
            success: true,
            message: "Login successfully",
            data: tokenResponse,
        });
    } catch (error: any) {
        if (error.message === "The account does not exist" ||
            error.message === "Password not match!") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function registerController(req: Request, res: Response) {
    try {
        // #swagger.tags = ['Auth']
        // #swagger.summary = 'Register a new user'
        /* #swagger.requestBody = {
       required: true,
       content: {
           "application/json": {
               schema: {
                   $ref: '#/definitions/Register'
               }
           }
       }
   } */
        /* #swagger.responses[201] = {
            description: 'User registered successfully',
            schema: {
                success: true,
                message: 'Register successfully',
                token:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        } */
        /* #swagger.responses[400] = {
            description: 'Invalid email or password',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }
        const validRoles = ["CUSTOMER", "ADMIN", "TECHNICIAN", "STAFF"];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }
        const authRegisterDto: AuthRegisterDto = { email, password, role };
        const tokenResponse = await register(authRegisterDto);
        return res.status(201).json({
            success: true,
            message: "Register successfully",
            data: tokenResponse,

        });
    } catch (error: any) {
        if (error.message === "Email existed") {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function refreshTokenController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Refresh access token using refresh token'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        refreshToken: {
                            type: "string",
                            description: "Valid refresh token"
                        }
                    },
                    required: ["refreshToken"]
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'Token refreshed successfully',
        schema: {
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                expiresIn: 3600
            }
        }
    } */
    /* #swagger.responses[400] = {
        description: 'Refresh token is required',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    /* #swagger.responses[401] = {
        description: 'Invalid refresh token',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const refreshTokenDto: RefreshTokenDto = { refreshToken };
        const tokenResponse = await refreshAccessToken(refreshTokenDto);

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: tokenResponse,
        });
    } catch (error: any) {
        if (error.message === "Invalid refresh token" ||
            error.message === "Refresh token has been invalidated" ||
            error.message === "User not found or has been deleted") {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }
        if (error.message === "Maximum refresh time exceeded. Please login again.") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function logoutController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Logout user and invalidate tokens'
    /* #swagger.security = [{
        "BearerAuth": []
    }] */
    /* #swagger.requestBody = {
        required: false,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        refreshToken: {
                            type: "string",
                            description: "Refresh token to invalidate (optional)"
                        }
                    }
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'Logout successful',
        schema: {
            success: true,
            message: 'Logout successful'
        }
    } */
    /* #swagger.responses[401] = {
        description: 'No token provided',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const { refreshToken } = req.body;
        const success = logout(token, refreshToken);

        if (success) {
            return res.status(200).json({
                success: true,
                message: "Logout successful"
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Logout failed"
            });
        }
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}