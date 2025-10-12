import { Request, Response } from "express";
import { login, register } from "../services/auth.service";
import { AuthLoginDto, AuthRegisterDto } from "../types/auth.type";

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
        const token = await login(authLoginDto);

        return res.status(200).json({
            success: true,
            message: "Login successfully",
            token: token,
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
        const token = await register(authRegisterDto);
        return res.status(201).json({
            success: true,
            message: "Register successfully",
            token: token,

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