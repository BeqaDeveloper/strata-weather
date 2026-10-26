module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.test-support.ts',
    '!src/domain/weather.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 90, statements: 90 },
    './src/domain/': { branches: 90, functions: 100, lines: 95, statements: 95 },
    './src/infrastructure/': { branches: 70, functions: 90, lines: 90, statements: 90 },
    './src/application/useWeatherController.ts': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/shared/observability/': { branches: 100, functions: 100, lines: 100, statements: 100 },
    './src/bootstrap/providerCatalog.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  clearMocks: true,
  restoreMocks: true,
};
