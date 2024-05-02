import { checkSchema } from 'express-validator';

export default checkSchema({
    email: {
        notEmpty: {
            errorMessage: 'Email is required!',
        },
        trim: true,
        isEmail: {
            errorMessage: 'Please enter a valid email address',
        },
    },
    firstName: {
        errorMessage: 'first name is required!',
        notEmpty: true,
    },
    lastName: {
        errorMessage: 'last name is required!',
        notEmpty: true,
    },
    password: {
        notEmpty: {
            errorMessage: 'Password is required.',
        },
        isLength: {
            options: { min: 8 },
            errorMessage: 'Password must be atleast 8 characters long.',
        },
    },
});
