import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      prettier: prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // error
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      'no-eval': 'error',
      'rest-spread-spacing': ['error', 'never'],
      'space-infix-ops': 'error',
      'no-whitespace-before-property': 'error',

      // warning
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      eqeqeq: ['warn', 'always'],
      indent: ['warn', 2],
      'func-style': ['warn', 'expression'],
      'no-lone-blocks': 'warn',
      'no-unneeded-ternary': 'warn',
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
      ],
      'space-before-function-paren': ['warn', 'always'],
      'keyword-spacing': ['warn', { before: true, after: true }],
      'eol-last': ['warn', 'always'],
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // 내장 모듈 (fs, path 등)
            'external', // 외부 패키지 (react, lodash 등)
            'internal', // 내부 모듈 (alias import 등)
            ['parent', 'sibling', 'index'], // 상대 경로 모듈
            'object',
            'type',
          ],
          'newlines-between': 'always', // 그룹 사이에 개행 추가
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
)
