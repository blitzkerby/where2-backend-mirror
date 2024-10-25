const express = require("express");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  resendVerificationCode,
  verifyAccount,
  sendWelcomeEmail,
  sendRole,
  updatePassword,
  protect
} = require("../controllers/authController");

const {
  parseUserDevice,
} = require("./../controllers/deviceController");

const { verifyToken } = require("../middleware/authMiddleware");


const router = express.Router();

router.get("/login/getRole", verifyToken, sendRole)

// Authentication routes

router.post("/signup", signup);
router.post("/signup/verifyAccount", verifyAccount)
router.post("/signup/resendVerificationCode", resendVerificationCode);
router.post("/signup/sendWelcomeEmail", sendWelcomeEmail)
router.post("/login", parseUserDevice, login);
router.post("/forgotPassword", forgotPassword);
router.patch("/updatePassword/:userId", verifyToken, protect, updatePassword);
router.patch(
  "/resetPassword/:token",
  resetPassword
);
router.patch("/updatePassword/:id", updatePassword);

module.exports = router;