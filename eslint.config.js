import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import stylisticJs from '@stylistic/eslint-plugin-js'

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
      '@stylistic/js': stylisticJs,
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
      ...react.configs.recommended.rules, // React 권장 규칙 사용
      ...reactHooks.configs.recommended.rules, // React Hooks 권장 규칙 사용
      'react/react-in-jsx-scope': 'off', // JSX에서 React import 불필요
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }], // 컴포넌트만 export 경고, 상수 export 허용

      // Error rules
      semi: ['error', 'never'], // 세미콜론 사용 금지
      quotes: ['error', 'single'], // 작은 따옴표 사용
      'no-eval': 'error', // eval() 사용 금지
      'rest-spread-spacing': ['error', 'never'], // 스프레드 연산자와 객체 사이 공백 금지
      'space-infix-ops': 'error', // 연산자 주위 공백 요구
      'no-whitespace-before-property': 'error', // 속성 앞 공백 금지
      'arrow-body-style': ['error', 'as-needed'], // 필요할 때만 중괄호 사용
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }], // 화살표 함수 선호
      'consistent-return': 'error', // 일관된 return 요구
      'no-param-reassign': ['error', { props: false }], // 매개변수 재할당 금지 (속성 제외)
      'object-shorthand': ['error', 'always'], // 객체 축약 문법 사용
      'prefer-template': 'error', // 템플릿 리터럴 선호
      'no-shadow': 'error', // 동일한 변수명 선언 금지
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }], // 정의 전에 사용 금지 (함수 제외)
      'import/no-extraneous-dependencies': ['error', { devDependencies: false }], // 불필요한 의존성 import 금지
      eqeqeq: ['error', 'always'], // 항상 일치 연산자 사용
      'object-curly-spacing': ['error', 'always'],
      '@stylistic/js/function-call-spacing': ['error', 'never'],
      '@stylistic/js/jsx-quotes': ['error', 'prefer-double'],

      // Warn rules
      '@typescript-eslint/no-unused-vars': [
        // 사용하지 않는 변수 경고
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      indent: ['warn', 2], // 들여쓰기 2칸
      'func-style': ['warn', 'expression'], // 함수 표현식 사용
      'keyword-spacing': ['warn', { before: true, after: true }], // 키워드 주위 공백 요구
      'eol-last': ['warn', 'always'], // 파일 끝 줄바꿈 요구
      'no-multiple-empty-lines': ['warn', { max: 1 }], // 여러 개의 빈 줄 금지
      'import/order': [
        // import 순서 정렬
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // console.log만 경고
    },
  },
)
