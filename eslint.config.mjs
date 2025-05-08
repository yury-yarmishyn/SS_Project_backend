import path from 'path';
import { fileURLToPath } from 'url';
import prettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import jsRules from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'unused-imports': unusedImports,
      prettier,
    },
    rules: {
      // Enforce single quotes instead of double quotes
      'quotes': ['error', 'single', { avoidEscape: true }],

      // Manually defining TypeScript recommended rules
      '@typescript-eslint/array-type': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Additional rules
      'unused-imports/no-unused-imports': 'error',

      // Prettier rules
      'prettier/prettier': ['warn', { singleQuote: true }],
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      ...jsRules.configs.recommended.rules, // ESLint's built-in JavaScript recommended rules
      'quotes': ['error', 'single', { avoidEscape: true }], // Enforce single quotes in JS
      'prettier/prettier': ['warn', { singleQuote: true }], // Prettier rule for single quotes
    },
  },
];
