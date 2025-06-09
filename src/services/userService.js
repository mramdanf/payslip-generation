const {
  models: { User }
} = require('../db/models');

function findByUsername(username) {
  return User.findOne({ where: { username } });
}

module.exports = {
  findByUsername
};