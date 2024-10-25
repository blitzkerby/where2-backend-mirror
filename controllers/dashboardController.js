const { Op } = require("sequelize");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { UserDevice, User, Visit, UserProfile, Comment } = require("./../model");
const { sequelize, Discussion } = require("./../model");

const cambodiaCities = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Sihanoukville",
  "Kampong Cham",
  "Kampong Speu",
  "Kandal",
  "Prey Veng",
  "Takeo",
  "Tboung Khmum",
  "Stung Treng",
  "Koh Kong",
  "Pursat",
  "Banteay Meanchey",
  "Oddar Meanchey",
  "Preah Vihear",
  "Ratanakiri",
  "Mondulkiri",
  "Kep",
  "Pailin",
  "Svay Rieng",
  "Kampot",
  "Svay Rieng",
  "Kratie",
];

// FUNCTION TO OBTAIN INFORMATION REGARDING POSTS CREATED WITHIN THE COMMUNITY EACH DAY
exports.getDiscussionsPerDay = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getDiscussionsPerDay function called");
  }
  try {
    const discussionsPerDay = await Discussion.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["date"],
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
      raw: true,
    });

    console.log("Discussions per day:", discussionsPerDay);
    res.status(200).json(discussionsPerDay);
  } catch (err) {
    console.error("Error details:", err);
    return next(new AppError("Error fetching discussions per day", 500));
  }
});

/// FUNCTION TO OBTAIN INFORMATION REGARDING DEVICE TYPES DATA
exports.getDeviceDistribution = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getDeviceDistribution function called");
  }

  try {
    const deviceDistribution = await UserDevice.findAll({
      attributes: [
        "deviceType",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["deviceType"],
      raw: true,
    });

    res.status(200).json(deviceDistribution);
  } catch (err) {
    return next(new AppError("Error fetching device distribution", 500));
  }
});

// FUNCTION TO OBTAIN ACTIVE USERS AND VIEWS WITHIN THE LAST OUR DATA
exports.getActiveAndViews = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getActiveAndViews function called");
  }

  try {
    // Fetch active users
    const activeUsersCount = await User.count({
      where: {
        isActive: true,
        isVerified: true,
      },
    });

    // Fetch views today
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const viewsTodayCount = await Visit.sum("count", {
      where: {
        date: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    // Respond with the counts
    res.status(200).json({
      activeUsers: activeUsersCount,
      viewsToday: viewsTodayCount || 0, // Default to 0 if no views found
    });
  } catch (error) {
    console.error("Error fetching active users and views", error);
    return next(new AppError("Error fetching data", 500));
  }
});

// THIS FUNCTION OBTAINS ALL COUNTS OF USERS FROM EACH CITY
exports.getUserCountsByCity = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getUserCountsByCity function called");
  }

  try {
    const userCounts = await User.findAll({
      include: [
        {
          model: UserProfile,
          as: "profile",
          attributes: ["location"],
        },
      ],
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("profile.location")), "count"], // Use 'profile' for correct alias
      ],
      where: {
        "$profile.location$": cambodiaCities, // Correct alias reference
      },
      group: ["profile.location"], // Group by the profile location
      raw: true, // Get raw results instead of instances
    });

    // Create a result object for each city initialized to 0
    const cityCounts = cambodiaCities.reduce((acc, city) => {
      acc[city] = 0; // Initialize city count to 0
      return acc;
    }, {});

    // Populate the city counts with actual data
    userCounts.forEach((item) => {
      const city = item["profile.location"]; // Access the city from the result
      if (cityCounts.hasOwnProperty(city)) {
        cityCounts[city] = item.count; // Assign the count to the respective city
      }
    });

    return res.status(200).json({
      status: "success",
      data: cityCounts,
    });
  } catch (error) {
    console.error("Error fetching user counts by city:", error);
    return next(new AppError("Error fetching data", 500));
  }
});

// THIS CONTROLLER FUNCTION IS USED TO OBTAIN COUNTS OF COMMENTS (REPLIES) EACH DAY
exports.getCommentsByDay = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getCommentsCountByDay function called");
  }

  try {
    const commentsByDay = await Comment.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"], // Group by date
        [sequelize.fn("COUNT", sequelize.col("id")), "count"], // Count comments
      ],
      group: ["date"], // Group by date
      order: [["date", "ASC"]], // Order by date
      raw: true, // Return raw results
    });

    return res.status(200).json({
      status: "success",
      data: commentsByDay,
    });
  } catch (error) {
    console.error("Error fetching comments count by day:", error);
    return next(new AppError("Error fetching data", 500));
  }
});

// THIS CONTROLLER FUNCTION GETS ALL MULTI-DEVICE USERS
exports.getMultiDeviceUsers = async (req, res) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getMultiDeviceUsers function called");
  }

  try {
    const users = await User.findAll({
      attributes: [
        "id",
        [sequelize.fn("COUNT", sequelize.col("devices.id")), "deviceCount"],
      ],
      include: [
        {
          model: UserDevice,
          as: "devices", // Ensure this matches the alias defined in the User model
          attributes: [],
        },
      ],
      group: ["User.id"], // Group by the User's ID
      having: sequelize.literal("COUNT(devices.id) > 1"), // Change to match the alias
      order: [[sequelize.literal("deviceCount"), "DESC"]],
      limit: 10,
    });

    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching multi-device users", error });
  }
};

// THIS CONTROLLER GETS VERFIED AND UNVERIFIED USER
exports.getVerificationData = async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getVerificationData function called");
  }

  try {
    const verifiedCount = await User.count({ where: { isVerified: true } });
    const unverifiedCount = await User.count({ where: { isVerified: false } });

    const verificationData = [
      { deviceType: "Verified", count: verifiedCount },
      { deviceType: "Unverified", count: unverifiedCount },
    ];

    res.status(200).json({
      success: true,
      message: "Email verification status retrieved successfully",
      data: verificationData,
    });
  } catch (error) {
    logger.error(error);
    return next(new AppError("Error while fetching verification data", 500));
  }
};
