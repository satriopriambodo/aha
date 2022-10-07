const bcrypt = require("bcrypt");

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 8);
};

const comparePassword = (password, hashPasswords) => {
  return bcrypt.compareSync(password, hashPasswords);
};

module.exports = { hashPassword, comparePassword };
