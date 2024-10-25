const jwt = require("jsonwebtoken");
const { User, AuthDetails, UserProfile } = require("../model");
const logger = require("./../utils/logger");
const AppError = require("../utils/appError");

exports.middlewareDebugger = function (req, res, next) {
  logger.debug("middleware debug");
  console.log(`Request: ${req.method} ${req.url}`);
  next();
};

exports.verifyToken = async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("authMiddleware says you have hit the verifyToken function 😃");
  }

  logger.info("verifyToken called");

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  const token = authHeader.split(" ")[1];

  if (token) {
    if (process.env.NODE_ENV !== "production") {
      console.log("authMiddleware says you have found the token 😃", token);
    }
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;

    const user = await User.findOne({
      where: {
        id: req.userId,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return next(
        new AppError("This account is inactive or not verified yet!", 403)
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("authMiddleware says you have found the user 😃", user);
    }

    const authRecordRole = await AuthDetails.findOne({
      where: { userId: req.userId },
      attributes: ["role"],
    });

    if (!authRecordRole) {
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    req.userRole = authRecordRole.role;

    if (process.env.NODE_ENV !== "production") {
      console.log(req.userRole);
      console.log(
        "authMiddleware says you have passed everything in the function. 😃"
      );
    }

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new Error("Invalid token. Please login.", 401));
    }
    return next(new AppError("Something went wrong! Please try again.", 500));
  }
};
