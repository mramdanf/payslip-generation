#!/usr/bin/env node

/**
 * Test Setup Script
 * This script helps prepare the test environment by:
 * 1. Creating test database if it doesn't exist
 * 2. Running migrations
 * 3. Optionally seeding test data
 */

require('dotenv').config({ path: '.env.test' });
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function setupTestEnvironment() {
  console.log('🚀 Setting up test environment...\n');

  try {
    // Create test database (this might fail if database already exists, which is OK)
    console.log('🔄 Creating test database...');
    try {
      await execAsync('npm run db:create:test');
      console.log('✅ Test database created\n');
    } catch (error) {
      console.log('ℹ️  Test database might already exist (this is OK)\n');
    }

    // Run migrations
    await runCommand('npm run db:migrate:test', 'Running test database migrations');

    console.log('🎉 Test environment setup completed successfully!');
    console.log('\nYou can now run tests with:');
    console.log('  npm test                    # Run all tests');
    console.log('  npm run test:watch          # Run tests in watch mode');
    console.log('  npm run test:coverage       # Run tests with coverage');

  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    process.exit(1);
  }
}

// Check if .env.test exists
const fs = require('fs');
if (!fs.existsSync('.env.test')) {
  console.log('⚠️  Warning: .env.test file not found');
  console.log('Please create .env.test with your test database configuration');
  console.log('Example:');
  console.log(`
NODE_ENV=test
JWT_SECRET=test_jwt_secret_key_for_integration_tests
JWT_EXPIRES_IN=1h
DB_HOST=localhost
DB_PORT=5433
DB_NAME=payslip_db
DB_USERNAME=your_test_user
DB_PASSWORD=your_test_password
  `);
  process.exit(1);
}

setupTestEnvironment(); 