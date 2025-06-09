const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

// Import all models from the models directory
const modelsPath = path.join(__dirname, 'models');
if (fs.existsSync(modelsPath)) {
  fs.readdirSync(modelsPath)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== 'index.js' &&
        file.slice(-3) === '.js'
      );
    })
    .forEach(file => {
      const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });
}

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db; 