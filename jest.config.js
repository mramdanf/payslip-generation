module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/migrations/**',
    '!src/db/seeders/**',
    '!src/db/config/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  maxWorkers: 1, // Important for database tests to avoid conflicts
  testTimeout: 30000, // 30 seconds timeout for database operations
  verbose: true
}; 