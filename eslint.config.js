const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'coverage/**', '.expo/**'] },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-warning-comments': 'error',
      'no-console': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/domain',
              from: './src',
              except: ['./domain'],
              message: 'The domain must stay independent of application, transport, and UI code.',
            },
            {
              target: './src/application',
              from: [
                './src/infrastructure',
                './src/presentation',
                './src/bootstrap',
                './src/platform',
              ],
              message: 'Application logic consumes domain ports; composition belongs in bootstrap.',
            },
            {
              target: './src/infrastructure',
              from: [
                './src/application',
                './src/presentation',
                './src/bootstrap',
                './src/platform',
              ],
              message: 'Adapters must not depend on application orchestration or presentation.',
            },
            {
              target: './src/presentation',
              from: ['./src/infrastructure', './src/bootstrap', './src/platform'],
              message:
                'Presentation receives data and actions through props, not concrete services.',
            },
            {
              target: './src/shared',
              from: [
                './src/application',
                './src/infrastructure',
                './src/presentation',
                './src/bootstrap',
                './src/platform',
              ],
              message: 'Shared building blocks must not depend on higher-level feature modules.',
            },
          ],
        },
      ],
    },
  },
]);
