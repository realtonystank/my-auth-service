// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['**/dist/**', '**/node_modules/**', '**/scripts/**'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            'dot-notation': 'error',
        },
    },
);
