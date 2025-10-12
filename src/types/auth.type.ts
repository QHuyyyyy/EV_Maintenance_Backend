export interface AuthLoginDto {
    email: string;
    password: string;
}

export interface AuthRegisterDto {
    email: string;
    password: string;
    role?: "CUSTOMER" | "ADMIN" | "TECHNICIAN" | "STAFF";
}

export interface Payload {
    sub: string;
    email: string;
}
