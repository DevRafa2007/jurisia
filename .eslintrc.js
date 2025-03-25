module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'varsIgnorePattern': '^(isDark|_)' 
    }],
  },
}; 