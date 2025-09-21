export interface IUser {
    email: string;
    password: string;
    role: 'admin' | 'staff' | 'customer' | 'technician';
    isDeleted: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface IUserResponse extends Omit<IUser, 'password'> { }

export interface IUserUpdate extends Partial<Omit<IUser, '_id' | 'created_at' | 'updated_at'>> { }

export interface IUserLogin {
    email: string;
    password: string;
}