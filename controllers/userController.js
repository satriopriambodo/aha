const { User } = require("../models");
const bcrypt = require("bcrypt");
const { token } = require("../helpers/jwt");
const nodemailer = require("nodemailer");
const { hashPassword } = require("../helpers/bcrypt");
// var regularExpression =
//   /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

const register = async (req, res, next) => {
  try {
    const { name, email, password, confirm_password } = req.body;

    if (password !== confirm_password) {
      throw { name: "password do not match" };
    }

    const generateModal = {
      email,
      password,
    };

    const response = await User.create({
      name,
      email,
      password,
      token_verification: token(generateModal),
      numberOfTimesLoggedIn: 0,
    });

    //send email
    const transporter = await nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      secure: false,

      // pool: true,
      // host: process.env.EMAIL_HOST,
      // port: process.env.EMAIL_PORT,
      // secure: true,

      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_TEST_APP_PASSWORD,
      },
    });

    const options = {
      from: "pancasanjaya69@gmail.com",
      to: response.email,
      subject: "Email Confirmation",
      html: `Press  <a href=https://aha-satrio.herokuapp.com/users/verification/${response.token_verification}> here <a/> to verify your email. Thanks!`,
    };

    transporter.sendMail(options, (err) => {
      console.log(err);
      if (err) {
        res.status(500).json({ message: "Wrong email or password" });
      } else {
        res.status(200).json({ message: "Email sent!" });
      }
    });

    res.status(201).json({
      id: response.id,
      name: response.name,
      email: response.email,
    });
  } catch (error) {
    console.log(error);
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      error.errors.forEach((el) => {
        errMsgs = el.message;
      });
      res.status(400).json({
        code: 400,
        status: "failed",
        message: errMsgs,
      });
    } else if (error.name === "password do not match") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "password do not match",
      });
    }
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { active_at, email, token_verification } = req.body;
    const currentUser = await User.findOne({
      where: { token_verification: req.params.token_verification },
    });

    if (!currentUser) {
      throw { name: "User not found" };
    } else {
      const response = await User.update(
        { active_at: new Date() },
        { where: { token_verification: req.params.token_verification } }
      );
    }

    // res.redirect(`${process.env.URL_EMAIL}verified_success`);
    res.redirect("https://google.com/");
    res.status(200).json({ message: "ok" });
  } catch (error) {
    console.log(error);
    if (error.name === "User not found") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "expired verification",
      });
      // res.redirect(`${process.env.URL_EMAIL}expired_verify`);
    }
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw { name: "Bad Request" };
    }

    const response = await User.findOne({ where: { email } });
    if (!response) {
      throw { name: "Unauthorized" };
    }

    if (response.active_at === null) {
      throw { name: "Unverified" };
    }

    const isValid = bcrypt.compareSync(password, response.password);
    if (!isValid) {
      throw { name: "Unauthorized" };
    }

    const addNumbersLogin = await User.update(
      { numberOfTimesLoggedIn: response.numberOfTimesLoggedIn + 1 },
      {
        where: { email },
        returning: true,
      }
    );

    const finalResponse = await User.findOne({ where: { email } });

    const payload = {
      id: response.id,
      email: response.email,
    };

    const userEmail = response.email;
    res.status(200).json({
      user_name: response.name,
      user_email: userEmail,
      access_token: token(payload),
      active_at: finalResponse.active_at,
      numberOfTimesLoggedIn: finalResponse.numberOfTimesLoggedIn,
    });
  } catch (error) {
    console.log(error);
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      error.errors.forEach((el) => {
        errMsgs = el.message;
      });
      res.status(400).json({
        code: 400,
        status: "failed",
        message: errMsgs,
      });
    } else if (error.name === "Bad Request") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "Email and Password cannot be blank",
      });
    } else if (error.name === "Unauthorized") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "Wrong email or password!",
      });
    } else if (error.name === "Unverified") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "Verify your email first",
      });
    }
  }
};

const fetchUser = async (req, res, next) => {
  try {
    const result = await User.findAll({
      order: [["id", "desc"]],
      attributes: { exclude: ["password", "token_verification"] },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      error.errors.forEach((el) => {
        errMsgs = el.message;
      });
      res.status(400).json({
        code: 400,
        status: "failed",
        message: errMsgs,
      });
    }
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, newPassword, reEnterNewPassword } = req.body;
    const { id } = req.params;
    const findUser = await User.findOne({ where: { id } });

    if (!findUser) {
      throw { name: "not found" };
    }

    if (newPassword !== reEnterNewPassword) {
      throw { name: "password do not match" };
    }

    const isValid = bcrypt.compareSync(password, findUser.password);
    if (!isValid) {
      throw { name: "Unauthorized" };
    }

    const result = await User.update(
      { password: hashPassword(newPassword) },
      { where: { id }, returning: true }
    );

    res.status(200).json({
      code: 200,
      status: "success",
      message: `Password has been updated`,
    });
  } catch (error) {
    console.log(error);
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      (errorCode = 400), (msg = error.errors.map((el) => el.message));
    } else if (error.name === "not found") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "User not found",
      });
    } else if (error.name === "password do not match") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "password do not match",
      });
    } else if (error.name === "Unauthorized") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "Wrong Password!",
      });
    }
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const findUser = await User.findOne({ where: { id } });

    if (!findUser) {
      throw { name: "not found" };
    } else {
      const result = await User.update(
        { name },
        { where: { id }, returning: true }
      );
    }
    const afterUpdate = await User.findOne({
      attributes: { exclude: ["password", "token_verification"] },
      where: { id },
    });
    res.status(200).json({
      code: 200,
      status: "success",
      message: `Profile has been updated`,
      data: afterUpdate,
    });
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      (errorCode = 400), (msg = error.errors.map((el) => el.message));
    } else if (error.name === "not found") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "User not found",
      });
    }
  }
};

module.exports = {
  register,
  login,
  resetPassword,
  fetchUser,
  verifyEmail,
  updateProfile,
};
