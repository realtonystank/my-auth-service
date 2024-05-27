import { checkSchema } from 'express-validator';
import { Roles } from '../constants';

export default checkSchema({
    firstName: {
        notEmpty: {
            errorMessage: 'first name is required',
        },
        isString: true,
        trim: true,
    },
    lastName: {
        notEmpty: {
            errorMessage: 'last name is required',
        },
        isString: true,
        trim: true,
    },
    email: {
        notEmpty: {
            errorMessage: 'Email is required!',
        },
        trim: true,
        isEmail: {
            errorMessage: 'Please enter a valid email address',
        },
    },
    password: {
        notEmpty: {
            errorMessage: 'Password is required.',
        },
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be atleast 8 characters long.',
        },
        trim: true,
    },
    role: {
        notEmpty: {
            errorMessage: 'role is required.',
        },
        isIn: {
            options: [[Roles.ADMIN, Roles.CUSTOMER, Roles.MANAGER]],
            errorMessage: 'Incorrect role',
        },
        trim: true,
    },
});
