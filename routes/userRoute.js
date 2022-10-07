const express = require("express");
const router = express.Router();
const {
  register,
  login,
  fetchUser,
  verifyEmail,
} = require("../controllers/userController");
const { authGoogle } = require("../controllers/authController");
const { authentication } = require("../middlewares/middleware");

router.post("/login", login);
router.post("/register", register);
router.get("/verification/:token_verification", verifyEmail);
router.post("/auth_google", authGoogle);

router.use(authentication);

router.get("/", fetchUser);

module.exports = router;
