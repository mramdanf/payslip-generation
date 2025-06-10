# Payslip Generation System

A Node.js RESTful API for managing employee attendance, overtime, reimbursements, and automated payslip generation using Express.js, Sequelize ORM, and PostgreSQL.

## 🚀 Features

- **Employee Management**: Role-based access control (Admin/Employee) with JWT authentication
- **Attendance Tracking**: Daily check-in/check-out with automated status calculation
- **Overtime Management**: Employee overtime submission with validation rules
- **Reimbursement Claims**: Expense tracking with category-based organization
- **Payroll Processing**: Automated payslip generation and salary calculations
- **Audit Trail**: Complete tracking of record changes with user attribution
- **Security**: Rate limiting, CORS, Helmet security headers
- **Testing**: Comprehensive integration test suite with 90%+ coverage

## 🏗️ Software Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (Future)      │◄──►│   Express.js    │◄──►│   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Business      │
                       │   Logic Layer   │
                       └─────────────────┘
```

### 📁 Project Structure

```
src/
├── app.js                      # Express app configuration & middleware
├── server.js                   # Server startup & environment setup
├── controllers/                # Request handlers & response logic
│   ├── attendanceController.js
│   ├── attendancePeriodController.js
│   ├── overtimeController.js
│   ├── payrollController.js
│   ├── reimbursementController.js
│   └── userController.js
├── services/                   # Business logic & data processing
├── routes/                     # API endpoint definitions
│   ├── attendanceRoutes.js
│   ├── attendancePeriodRoutes.js
│   ├── overtimeRoutes.js
│   ├── payrollRoutes.js
│   ├── reimbursementRoutes.js
│   └── userRoutes.js
├── middlewares/                # Custom middleware (auth, validation)
├── utils/                      # Helper functions & utilities
├── db/                         # Database layer
│   ├── config/                 # Database configuration
│   ├── models/                 # Sequelize models & associations
│   ├── migrations/             # Database schema changes
│   └── seeders/                # Initial data setup
└── tests/                      # Integration & unit test suites
```

### 🗄️ Database Schema

#### Core Entities

1. **users** - Employee and admin management with audit trail
2. **attendance_periods** - Payroll period definitions
3. **attendance** - Daily attendance records with status calculation
4. **overtime** - Employee overtime submissions
5. **reimbursement** - Expense claims and reimbursements
6. **payslip** - Generated payroll records

#### Entity Relationships

```
User (1) ──────────────── (M) Attendance
  │                           │
  │                           │
  └─── (M) Overtime           └─── (M) AttendancePeriod
  │                                     │
  └─── (M) Reimbursement                │
  │                                     │
  └─── (M) Payslip ─────────────────────┘
```

## 🛠️ Tech Stack

- **Backend**: Node.js 14+, Express.js
- **Database**: PostgreSQL 15 with Sequelize ORM
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, Express Rate Limit
- **Testing**: Jest, Supertest, PostgreSQL test database
- **DevOps**: Docker, Docker Compose, GitHub Actions ready
- **Development**: Nodemon, ESLint, Faker.js for test data

## 📋 Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- PostgreSQL (if running without Docker)
- Git

## 🚀 Quick Start Guide

### 1. Clone and Setup

```bash
git clone <repository-url>
cd payslip-generation
npm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payslip_db
DB_USERNAME=payslip_user
DB_PASSWORD=payslip_password

# pgAdmin Configuration
PGADMIN_EMAIL=admin@payslip.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=8080

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

### 3. Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Wait for database to be ready, then run migrations
npm run db:migrate

# Seed initial data (creates admin user and 100 fake employees)
npm run db:seed
```

### 4. Start the Application

```bash
# Development mode with auto-reload
npm run start:dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

All endpoints except `/users/login` and health checks require authentication via JWT tokens.

#### Login
```http
POST /users/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Default Credentials:**
- **Admin**: username: `admin`, password: `admin123`
- **Employees**: 100 employees with randomly generated usernames (using faker.js), all with password: `employee123`
  - Username format: Random usernames like `john.doe`, `alice_smith`, or fallback to `emp_<random8chars>` if needed
  - To find specific usernames, check the database after seeding: `SELECT username FROM "user" WHERE role = 'employee' LIMIT 10;`

### Headers for Authenticated Requests

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### 📊 Attendance Management

#### Submit Daily Attendance
```http
POST /attendances
Authorization: Bearer <token>
Content-Type: application/json

{
  "attendancePeriodId": "uuid-here",
  "checkIn": "2024-01-15T09:00:00Z",
  "checkOut": "2024-01-15T17:30:00Z",
  "status": "present"
}
```

**Business Rules:**
- Only employees can submit their own attendance
- One submission per day per period
- No weekend submissions allowed
- Status auto-calculated based on hours worked

### ⏰ Overtime Management

#### Submit Overtime Request
```http
POST /overtimes
Authorization: Bearer <token>
Content-Type: application/json

{
  "attendancePeriodId": "uuid-here",
  "overtimeDate": "2024-01-15",
  "hours": 2.5,
  "description": "Project deadline work"
}
```

**Validation Rules:**
- Maximum 3 hours per day
- Must be submitted after work completion
- Available any day (including weekends)
- Hours must be positive decimal

### 💰 Reimbursement Claims

#### Submit Reimbursement
```http
POST /reimbursements
Authorization: Bearer <token>
Content-Type: application/json

{
  "attendancePeriodId": "uuid-here",
  "amount": 50.75,
  "category": "transport",
  "description": "Client meeting travel"
}
```

**Categories Available:**
- `transport` - Travel and transportation
- `meal` - Food and dining
- `accommodation` - Lodging expenses  
- `other` - Miscellaneous expenses

### 💼 Payroll Operations

#### Run Payroll (Admin Only)
```http
POST /payrolls/run
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "attendancePeriodId": "uuid-here"
}
```

**Features:**
- Generates payslips for all employees
- Calculates prorated salary based on attendance
- Includes overtime at 2x base rate
- Adds all approved reimbursements
- Prevents duplicate payroll runs

#### Get Employee Payslip
```http
GET /payrolls/payslip/{periodId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payslipNumber": "PAY-2024-001-EMP001",
    "employee": {
      "name": "John Doe",
      "monthlySalary": 5000.00
    },
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "attendance": {
      "workingDays": 22,
      "attendedDays": 20,
      "attendancePercentage": 90.91
    },
    "salary": {
      "baseAmount": 4545.45,
      "overtimeAmount": 454.55,
      "reimbursementAmount": 150.00,
      "totalTakeHome": 5150.00
    },
    "breakdown": {
      "overtimeHours": 5.0,
      "reimbursements": [
        {
          "category": "transport",
          "amount": 150.00,
          "description": "Client meetings"
        }
      ]
    }
  }
}
```

#### Get Payroll Summary (Admin Only)
```http
GET /payrolls/summary/{periodId}
Authorization: Bearer <admin-token>
```

### 🏢 Admin Operations

#### Create Attendance Period
```http
POST /attendance-periods
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "January 2024 Payroll",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 🔍 Health & Monitoring

#### Health Check
```http
GET /health
```

#### Database Test
```http
GET /db-test
```

## 🧪 Testing Guide

### Test Setup

1. **Create test environment file** (`.env.test`):
```env
NODE_ENV=test
JWT_SECRET=test_jwt_secret_key_for_integration_tests
JWT_EXPIRES_IN=1h
DB_HOST=localhost
DB_PORT=5433
DB_NAME=payslip_db
DB_USERNAME=payslip_user
DB_PASSWORD=payslip_password
```

2. **Setup test database:**
```bash
npm run test:setup
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite includes:
- ✅ **Authentication flows** - Login, token validation, role checks
- ✅ **Attendance management** - Submission, validation, status calculation
- ✅ **Overtime tracking** - Hour limits, authorization, business rules
- ✅ **Reimbursement claims** - Amount validation, category checks
- ✅ **Payroll processing** - Generation, calculations, duplicate prevention
- ✅ **Error handling** - Invalid inputs, missing data, unauthorized access
- ✅ **Database operations** - CRUD operations, constraint validation

## 📖 How-To Guides

### For Developers

#### Adding a New API Endpoint

1. **Create route** in `src/routes/`:
```javascript
// src/routes/newFeatureRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/newFeatureController');
const verifyToken = require('../middlewares/verifyToken');

router.post('/', verifyToken, controller.create);
module.exports = router;
```

2. **Implement controller** in `src/controllers/`:
```javascript
// src/controllers/newFeatureController.js
const service = require('../services/newFeatureService');
const { endpointSuccessResponse, endpointErrorResponse } = require('../utils/apiResponse');

async function create(req, res) {
  try {
    const result = await service.create(req.body, req.user.id);
    res.status(201).json(endpointSuccessResponse(result));
  } catch (error) {
    res.status(500).json(endpointErrorResponse(error.message));
  }
}

module.exports = { create };
```

3. **Add business logic** in `src/services/`:
```javascript
// src/services/newFeatureService.js
const { NewFeature } = require('../db/models');

async function create(data, userId) {
  return await NewFeature.create({
    ...data,
    createdBy: userId
  });
}

module.exports = { create };
```

4. **Register route** in `src/app.js`:
```javascript
const newFeatureRouter = require('./routes/newFeatureRoutes');
app.use('/new-feature', newFeatureRouter);
```

#### Adding Database Model

1. **Generate migration**:
```bash
npx sequelize-cli migration:generate --name create-new-table
```

2. **Define model** in `src/db/models/`:
```javascript
module.exports = (sequelize, DataTypes) => {
  const NewModel = sequelize.define('NewModel', {
    // field definitions
  }, {
    tableName: 'new_table',
    timestamps: true,
    underscored: true
  });
  
  return NewModel;
};
```


## 🔧 Database Commands

```bash
# Migration management
npm run db:migrate              # Run pending migrations
npm run db:migrate:undo         # Undo last migration
npm run db:migrate:undo:all     # Undo all migrations

# Seeder management  
npm run db:seed                 # Run all seeders
npm run db:seed:undo            # Undo all seeders

# Test database
npm run db:migrate:test         # Run test migrations
npm run db:create:test          # Create test database
```

## 🐳 Docker Operations

```bash
# Start all services
docker-compose up -d

# View running containers
docker-compose ps

# Stop services
docker-compose down
```

## 🔒 Security Features

- **JWT Authentication** with configurable expiration
- **Password Hashing** using bcrypt with salt rounds
- **Rate Limiting** (100 requests per 15 minutes per IP)
- **CORS Protection** with configurable origins
- **Helmet Security Headers** for XSS protection
- **SQL Injection Prevention** via Sequelize ORM