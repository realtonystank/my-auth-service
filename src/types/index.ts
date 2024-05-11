import { Request } from 'express';
export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface LoginData
    extends Partial<Omit<UserData, 'email' | 'password'>> {
    email: string;
    password: string;
}
export interface RegisterUserRequest extends Request {
    body: UserData;
}
