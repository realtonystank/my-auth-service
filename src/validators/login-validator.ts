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
});
