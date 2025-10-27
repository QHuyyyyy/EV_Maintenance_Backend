export interface AuthLoginDto {
    email: string;
    password: string;
}

export interface AuthRegisterDto {
    email: string;
    password: string;
    role?: "CUSTOMER" | "ADMIN" | "TECHNICIAN" | "STAFF";
    centerId?: string;
}

export interface Payload {
    sub: string;
    email?: string;
    phone?: string;
    centerId?: string;
    originalIssuedAt?: number; // Thời gian đăng nhập ban đầu
}

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface AuthTokenResponse {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
}

export interface LogoutResponse {
    success: boolean;
    message: string;
}

export interface AuthRegisterResponse {
    message: string;
}
