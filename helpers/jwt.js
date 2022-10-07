const jwt = require("jsonwebtoken");

function token(value) {
  return jwt.sign(value, process.env.SECRETKEY);
}

function validateJWT(value) {
  return jwt.verify(value, process.env.SECRETKEY);
}

module.exports = { token, validateJWT };
