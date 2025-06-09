require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'payslip_db',
  DB_USERNAME = 'payslip_user',
  DB_PASSWORD = 'payslip_password',
  NODE_ENV = 'development'
} = process.env;

module.exports = {
  development: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      bigNumberStrings: true
    },
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  test: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: `${DB_NAME}_test`,
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      bigNumberStrings: true
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  production: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      bigNumberStrings: true,
      ssl: NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
}; 