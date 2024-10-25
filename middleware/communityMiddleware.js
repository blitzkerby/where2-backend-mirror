const { Discussion } = require("./../model");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const logger = require("./../utils/logger");

// Middleware to check if discussion exists before performing operations on it
exports.checkDiscussionExists = catchAsync(async (req, res, next) => {
  try {
    console.log("Checking if discussion exists...");
    const { discussionId } = req.params;

    if (!discussionId) {
      logger.error("Discussion not found");
      return next(new AppError("Discussion ID is required.", 404));
    }

    const discussion = await Discussion.findOne({
      where: { id: discussionId },
    });

    if (!discussion) {
      return next(new AppError("Discussion not found", 404));
    }

    req.discussion = discussion;

    if (process.env.NODE_ENV !== "production") {
      console.log("PASSED MIDDLEWARE FUNCTION", req.discussion);
    }
    logger.log({ level: "info", message: "Passed communityMiddleware" });

    next();
  } catch (error) {
    console.error("Error in checkDiscussionExists:", error);
    return next(new AppError("Internal server error", 500));
  }
});
