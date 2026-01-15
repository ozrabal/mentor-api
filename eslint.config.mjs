// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist'

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'build.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  perfectionist.configs['recommended-natural'],
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        // Use explicit TS project configs for type-aware linting
        project: ['./tsconfig.json', './tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Perfectionist rules
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-modules': 'off',
      
      // TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
      files: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}', 'test/**/*.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'perfectionist/sort-imports': 'off',
        'perfectionist/sort-objects': 'off',
        'perfectionist/sort-interfaces': 'off',
        'perfectionist/sort-object-types': 'off',
        'perfectionist/sort-union-types': 'off',
        'perfectionist/sort-exports': 'off',
      },
    },
);
