const bcrypt = require('bcrypt');

function bcryptHas(plainText) {
  return bcrypt.hash(plainText, 10);
}

function bcryptCompare(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  bcryptHas,
  bcryptCompare
};
