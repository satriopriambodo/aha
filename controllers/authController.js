const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");
const { token } = require("../helpers/jwt");

const authGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const client = new OAuth2Client(process.env.CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let [user, created] = await User.findOrCreate({
      where: {
        email: payload.email,
      },
      defaults: {
        name: payload.name,
        email: payload.email,
        password: "PasswordGoogle",
        token_verification: "TokenVerification",
      },
    });

    const payloadUser = {
      id: user.id,
      email: user.email,
    };
    const role = user.role;
    const email = user.email;
    res.status(200).json({
      access_token: token(payloadUser),
      userRole: role,
      userEmail: email,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { authGoogle };
