const { User } = require("../models");
const bcrypt = require("bcrypt");
const { token } = require("../helpers/jwt");
const nodemailer = require("nodemailer");
// const { hashPassword } = require("../helpers/bcrypt");
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

    const isValid = bcrypt.compareSync(password, response.password);
    if (!isValid) {
      throw { name: "Unauthorized" };
    }

    const payload = {
      id: response.id,
      email: response.email,
    };

    const userEmail = response.email;
    res.status(200).json({
      user_name: response.name,
      user_email: userEmail,
      access_token: token(payload),
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
    }
  }
};

const fetchUser = async (req, res, next) => {
  try {
    const result = await User.findAll({
      order: [["id", "desc"]],
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
    if (findUser && password === reEnterNewPassword) {
      const result = await User.update(
        { password: hashPassword(newPassword) },
        { where: { id }, returning: true }
      );

      // const data = await User.findByPk(id);

      res.status(200).json({
        code: 200,
        status: "success",
        message: `Password has been updated`,
        // data,
      });
    } else {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: `User ID not found`,
        // data: [],
      });
    }
  } catch (error) {
    // console.log(error)
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
        // data: [],
      });
    } else if (error.name === "password do not match") {
      res.status(400).json({
        code: 400,
        status: "failed",
        message: "password do not match",
        // data: [],
      });
    }
  }
};

module.exports = { register, login, resetPassword, fetchUser };
