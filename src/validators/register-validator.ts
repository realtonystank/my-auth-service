import { checkSchema } from 'express-validator';

export default checkSchema({
    email: {
        errorMessage: 'Emai is required!',
        notEmpty: true,
    },
});
