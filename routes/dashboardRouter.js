const express = require("express");
const {
  getVerificationData,
  getDiscussionsPerDay,
  getDeviceDistribution,
  getActiveAndViews,
  getUserCountsByCity,
  getCommentsByDay,
  getMultiDeviceUsers,
} = require("./../controllers/dashboardController");
const { protect } = require("./../controllers/authController");
const router = express.Router();

// GET DISTRIBUTION BETWEEN VERFIED USERS AND NOT
router.get("/get-verification-data", getVerificationData);

// GET DISTRIBUTION OF DEVICES USED BY USER
router.get("/device-distribution", getDeviceDistribution);

// GET NUMBER OF POSTS CREATE IN THE COMMUNITY EACH DAY
router.get("/discussions-per-day", getDiscussionsPerDay);

// GET ALL ACTIVE USERS AND VIEWS WITHIN THE LAST HOUR
router.get("/active-and-views", getActiveAndViews);

// GET ALL COUNTS OF USERS FROM EACH CITY
router.get("/user-counts-by-city", getUserCountsByCity);

// GET ALL COMMENT COUNTS PER DAY
router.get("/comments-by-day", getCommentsByDay);

// GET ALL MULTI DEVICE USERS
router.get("/multi-device-users", getMultiDeviceUsers);

module.exports = router;
