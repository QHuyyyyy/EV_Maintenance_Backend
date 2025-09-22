export interface IUser {
    email: string;
    password: string;
    role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'TECHNICIAN';
    isDeleted: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface IUserResponse extends Omit<IUser, 'password'> { }

export interface IUserUpdate extends Partial<Omit<IUser, '_id' | 'created_at' | 'updated_at'>> { }

