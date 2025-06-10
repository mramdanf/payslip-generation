module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db/migrations/**',
    '!src/db/seeders/**',
    '!src/db/config/**',
    '!src/server.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  maxWorkers: 1, // Important for database tests to avoid conflicts and forces sequential execution
  testTimeout: 30000, // 30 seconds timeout for database operations
  verbose: true,
  forceExit: true, // Ensure Jest exits cleanly
  detectOpenHandles: true // Detect handles that prevent Jest from exiting cleanly
}; 