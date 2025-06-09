'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// eslint-disable-next-line import/no-dynamic-require
const config = require(`${__dirname}/../config/config.js`)[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: config.logging,
    define: config.define,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = () => {
  const m = {};

  fs.readdirSync(__dirname)
    .filter(
      (file) =>
        file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    )
    .forEach((file) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const model = require(path.resolve(__dirname, file))(sequelize, Sequelize.DataTypes);
      m[model.name] = model;
    });

  // Set up associations
  Object.keys(m).forEach((modelName) => {
    if (m[modelName].associate) {
      m[modelName].associate(m);
    }
  });

  return m;
};

const models = db();
const sequelizeInstance = sequelize;

module.exports = sequelizeInstance;
module.exports.default = models; 