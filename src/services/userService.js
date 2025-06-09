const {
  models: { User }
} = require('../db/models');

function findByUsername(username) {
  return User.findOne({ where: { username } });
}

function findById(id) {
  return User.findOne({ where: { id } });
}

module.exports = {
  findByUsername,
  findById
};