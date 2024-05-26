import { checkSchema } from 'express-validator';

export default checkSchema({
    name: {
        notEmpty: {
            errorMessage: 'Tenant name is required!',
        },
        isString: true,
        trim: true,
    },
    address: {
        notEmpty: {
            errorMessage: 'Tenant address is required.',
        },
        isString: true,
        trim: true,
    },
});
