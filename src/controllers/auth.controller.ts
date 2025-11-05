import { Request, Response } from "express";
import { login, register, refreshAccessToken, logout, loginWithFirebaseOTP, registerDeviceToken, unregisterDeviceToken, registerCustomer, loginCustomerByPassword, verifyRegisterCustomer } from "../services/auth.service";
import { AuthLoginDto, AuthRegisterDto, RefreshTokenDto } from "../types/auth.type";
import { CustomerService } from "../services/customer.service";
import { SystemUserService } from "../services/systemUser.service";
import { CenterService } from "../services/center.service";


const customerService = new CustomerService();
const systemUserService = new SystemUserService();
const centerService = new CenterService();
export async function loginController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Login with email and password for staff'
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
            error.message === "Password not match!" ||
            error.message.includes("Failed to get user by email")) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export async function registerController(req: Request, res: Response) {
    try {
        // #swagger.tags = ['Auth']
        // #swagger.summary = 'Register a new staff'
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
                message: 'User registered successfully',
              
            }
        } */
        /* #swagger.responses[400] = {
            description: 'Invalid email or password',
            schema: { $ref: '#/definitions/ErrorResponse' }
        } */
        const { email, password, role, centerId } = req.body;
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
        const validRoles = ["ADMIN", "TECHNICIAN", "STAFF"];
        // If role provided must be one of staff roles. Default role is STAFF.
        const roleToUse = role || "STAFF";
        if (!validRoles.includes(roleToUse)) {
            return res.status(400).json({
                success: false,
                message: "Registration only allowed for staff roles (ADMIN, TECHNICIAN, STAFF)"
            });
        }

        // For STAFF and TECHNICIAN, centerId is required
        if ((roleToUse === 'STAFF' || roleToUse === 'TECHNICIAN') && !centerId) {
            return res.status(400).json({
                success: false,
                message: 'centerId is required when registering STAFF or TECHNICIAN'
            });

        }
        if (centerId) {
            const center = await centerService.getCenterById(centerId);
            if (!center) {
                return res.status(404).json({
                    success: false,
                    message: 'Center not found'
                });
            }
        }
        const authRegisterDto: AuthRegisterDto = { email, password, role: roleToUse, centerId };
        const registerResponse = await register(authRegisterDto);
        return res.status(201).json({
            success: true,
            message: registerResponse.message,
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
        const success = await logout(token);

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

export async function firebaseOtpLoginController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Login with Firebase OTP for customers'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        idToken: {
                            type: "string",
                            description: "Firebase ID token from OTP verification"
                        },
                        phoneNumber: {
                            type: "string",
                            description: "Phone number used for OTP"
                        }
                    },
                    required: ["idToken", "phoneNumber"]
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'OTP login successful',
        schema: {
            success: true,
            message: 'Login successfully',
            data: {
                accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                expiresIn: 3600,
                role: "CUSTOMER"
            }
        }
    } */
    /* #swagger.responses[400] = {
        description: 'Invalid request data',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    /* #swagger.responses[401] = {
        description: 'Invalid Firebase token or authentication failed',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const { idToken, phoneNumber } = req.body;

        // Input validation
        if (!idToken || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Firebase ID token and phone number are required"
            });
        }

        // Validate phone format (should be in +84xxxxxxxxx, 0xxxxxxxxx, or 84xxxxxxxxx format)
        const phoneRegex = /^(\+84|0|84)[1-9][0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format. Expected format: +84xxxxxxxxx, 0xxxxxxxxx, or 84xxxxxxxxx"
            });
        }

        const tokenResponse = await loginWithFirebaseOTP(idToken, phoneNumber);

        return res.status(200).json({
            success: true,
            message: "Login successfully",
            data: tokenResponse,
        });
    } catch (error: any) {
        console.error("Firebase OTP Login error:", error);

        if (error.message === "Phone number mismatch") {
            return res.status(400).json({
                success: false,
                message: "Phone number does not match Firebase token"
            });
        }

        return res.status(401).json({
            success: false,
            message: error.message || "Invalid OTP or authentication failed"
        });
    }
}

export async function registerCustomerController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Register a new customer (email + phone + password)'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        email: { type: "string", example: "customer@example.com" },
                        phone: { type: "string", example: "+84901234567" },
                        password: { type: "string", example: "secret123" }
                    },
                    required: ["email", "phone", "password"]
                }
            }
        }
    } */
    /* #swagger.responses[201] = {
        description: 'Customer created or updated successfully',
        schema: { success: true, message: 'User registered successfully' }
    } */
    /* #swagger.responses[400] = {
        description: 'Validation error (missing or invalid fields)',
        schema: { success: false, message: 'Email, phone and password are required' }
    } */
    /* #swagger.responses[409] = {
        description: 'Conflict (email already used or account exists for phone)',
        schema: { success: false, message: 'Account already exists' }
    } */
    try {
        const { email, phone, password } = req.body;

        if (!email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Email, phone and password are required' });
        }

        // Basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const result = await registerCustomer(email, phone, password);

        // OTP sent -> return 202 Accepted
        return res.status(202).json({ success: true, message: result.message });
    } catch (error: any) {
        if (error.message === 'Account exists') {
            return res.status(409).json({ success: false, message: 'Account already exists' });
        }
        if (error.message === 'Email already in use') {
            return res.status(409).json({ success: false, message: 'Email already in use' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export async function registerCustomerVerifyController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Verify OTP for customer registration'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        email: { type: "string", example: "customer@example.com" },
                        otp: { type: "string", example: "123456" }
                    },
                    required: ["email", "otp"]
                }
            }
        }
    } */
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and otp are required' });
        }

        const result = await verifyRegisterCustomer(email, otp);

        return res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
        if (error.message === 'No pending registration found or OTP expired') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === 'Invalid OTP') {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        if (error.message === 'Email already in use' || error.message === 'Account exists') {
            return res.status(409).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export async function loginByPasswordController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Customer login using email or phone and password'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        identifier: { type: "string", description: "email or phone (preferred)", example: "customer@example.com/+84123456789" },
                        password: { type: "string", example: "secret123" }
                    },
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'Login successful',
        schema: {
            success: true,
            message: 'Login successfully',
            data: {
                accessToken: 'string',
                refreshToken: 'string',
                expiresIn: 3600,
                role: 'CUSTOMER'
            }
        }
    } */
    /* #swagger.responses[400] = { description: 'Missing identifier or password', schema: { success:false, message: 'Identifier (email or phone) and password are required' } } */
    /* #swagger.responses[401] = { description: 'Invalid credentials', schema: { success:false, message: 'Invalid email or password' } } */
    try {
        const { identifier, password } = req.body;

        const id = identifier;
        if (!id || !password) {
            return res.status(400).json({ success: false, message: 'Identifier (email or phone) and password are required' });
        }

        const tokenResponse = await loginCustomerByPassword(id, password);

        return res.status(200).json({ success: true, message: 'Login successfully', data: tokenResponse });
    } catch (error: any) {
        if (error.message === 'The account does not exist' || error.message === 'Password not match!' || error.message.includes('Failed to get user by email')) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (error.message === 'This login method is only for customers') {
            return res.status(401).json({ success: false, message: 'Invalid login method' });
        }
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export async function getProfileController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Get Profile'
    /* #swagger.security = [{
                  "bearerAuth": []
          }] */

    /* #swagger.responses[200] = {
        description: 'Get profile successfully',
        schema: {
            success: true,
            message: 'Get profile successfully'
        }
    } */
    /* #swagger.responses[401] = {
        description: 'No token provided',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const userRole = req.user.role;

        const userId = req.user._id;
        let profile = null;
        console.log(userRole);
        console.log(userId);
        if (userRole === "CUSTOMER") {
            profile = await customerService.getCustomerByUserId(userId);
        } else if (userRole !== "CUSTOMER") {
            profile = await systemUserService.getSystemUserByUserId(userId);
        }

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json({
            success: true,
            message: 'Get profile successfully',
            data: profile
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

/**
 * Register Firebase device token for push notifications
 * POST /auth/deviceToken
 */
export async function registerDeviceTokenController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Register Firebase device token for push notifications'
    /* #swagger.security = [{
               "bearerAuth": []
       }] */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'Firebase device token' }
                    },
                    required: ['token']
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'Device token registered successfully',
        schema: {
            success: true,
            message: 'Device token registered successfully',
            data: {
                customerId: 'string',
                tokenCount: 'number'
            }
        }
    } */
    /* #swagger.responses[400] = {
        description: 'Device token is required',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    /* #swagger.responses[404] = {
        description: 'Customer not found',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const { token } = req.body;
        const userId = (req as any).user._id;

        const data = await registerDeviceToken(userId, token);

        res.status(200).json({
            success: true,
            message: 'Device token registered successfully',
            data
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Device token is required') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Customer not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
        }
        console.error('Error registering device token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register device token',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Unregister Firebase device token
 * DELETE /auth/deviceToken
 */
export async function unregisterDeviceTokenController(req: Request, res: Response) {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Unregister Firebase device token'
    /* #swagger.security = [{
               "bearerAuth": []
       }] */
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'Firebase device token' }
                    },
                    required: ['token']
                }
            }
        }
    } */
    /* #swagger.responses[200] = {
        description: 'Device token unregistered successfully',
        schema: {
            success: true,
            message: 'Device token unregistered successfully',
            data: {
                customerId: 'string',
                tokenCount: 'number'
            }
        }
    } */
    /* #swagger.responses[400] = {
        description: 'Device token is required',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    /* #swagger.responses[404] = {
        description: 'Customer not found',
        schema: { $ref: '#/definitions/ErrorResponse' }
    } */
    try {
        const { token } = req.body;
        const userId = (req as any).user._id;

        const data = await unregisterDeviceToken(userId, token as string);

        res.status(200).json({
            success: true,
            message: 'Device token unregistered successfully',
            data
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Device token is required') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Customer not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
        }
        console.error('Error unregistering device token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unregister device token',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}




