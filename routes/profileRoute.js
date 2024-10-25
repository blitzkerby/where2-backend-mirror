const express = require("express");
const {
  getAllUsersInfo,
  deleteUserById,
  reactivateUserById,
  getMyProfile,
  getPublicProfile,
} = require("./../controllers/userController.js");
const { protect } = require("./../controllers/authController.js");
const router = express.Router();

// User routes
router.get("/profile/:userId", protect, getMyProfile);
router.get("/user-list", getAllUsersInfo);
router.patch("/delete-user/:userId", deleteUserById);
router.patch("/reactivate-user", reactivateUserById);

router.get("/public/:userId", getPublicProfile);

module.exports = router;
