const express = require("express");
const router = express.Router();
const { register, login, fetchUser } = require("../controllers/userController");
const { authGoogle } = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register);
router.post("/auth_google", authGoogle);
router.get("/", fetchUser);

module.exports = router;
