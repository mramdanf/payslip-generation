const {
  models: { User }
} = require('../db/models');

function findByUsername(username) {
  return User.findOne({ username });
}

module.exports = {
  findByUsername
};