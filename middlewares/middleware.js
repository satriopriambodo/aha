const { validateJWT } = require("../helpers/jwt");
const { User } = require("../models");

function authentication(req, res, next) {
  const access_token = req.headers.access_token;
  if (access_token) {
    try {
      const payload = validateJWT(access_token);

      User.findByPk(payload.id)
        .then((user) => {
          if (user) {
            req.user = { id: user.id, email: user.email, name: user.name };
            next();
          } else {
            res.status(401).json({
              code: 401,
              status: "failed",
              message: "Invalid or wrong JWT",
              data: [],
            });
          }
        })
        .catch((error) => {
          res.status(401).json({ messsage: error.message });
        });
    } catch (error) {
      res.status(401).json({
        code: 401,
        status: "failed",
        message: "Invalid or wrong JWT",
        data: [],
      });
    }
  } else {
    res.status(401).json({
      code: 401,
      status: "failed",
      message: "Please login first.",
      data: [],
    });
  }
}

module.exports = { authentication };
