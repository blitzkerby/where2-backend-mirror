const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const {
  Discussion,
  User,
  Comment,
  AuthDetails,
  UserProfile,
} = require("./../model");
const Sequelize = require("sequelize");
const sanitizeHtml = require("sanitize-html");
const logger = require("./../utils/logger");
// const cache = require("./../utils/cache");

// POST /discussion
exports.createDiscussion = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Creating discussion", req.body);
    logger.info("Creating discussion", req.body);
  }
  try {
    const { title, content, userId, id, location, pathname } = req.body;

    // Validate title and content length before creating
    if (!title || title.trim().length < 10) {
      throw new AppError("Title must be at least 10 letters long.", 400);
    }
    if (!content || content.trim().length < 10) {
      throw new AppError("Content must be at least 10 letters long.", 400);
    }

    // Validate user existence
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      throw new AppError("User not found.", 404);
    }

    // Sanitize data
    const sanitizedTitle = title.trim();
    const sanitizedContent = content.trim();

    // Create discussion
    const discussion = await Discussion.create({
      id,
      title: sanitizedTitle,
      content: sanitizedContent,
      userId,
      location,
      pathname,
      createdAt: new Date().toISOString(), // Ensure createdAt is set correctly
    });

    console.log("Discussion created:", discussion);

    // Fetch and include user details
    const newDiscussion = await Discussion.findByPk(discussion.id, {
      include: [{ model: User, as: "user", attributes: ["id", "email"] }],
    });

    // Validate newDiscussion
    if (!newDiscussion) {
      throw new AppError("Failed to retrieve newly created discussion.", 500);
    }

    // Cache the newly created discussion
    // const cacheKey = `discussion_${discussion.id}`;
    // await cache.set(cacheKey, JSON.stringify(newDiscussion), "EX", 60 * 5);

    res.status(201).json({
      status: "success",
      data: newDiscussion,
    });
  } catch (error) {
    console.error(`Error creating discussion: ${error.message}`, {
      requestBody: req.body,
      userId,
    });
    return next(new AppError(error.message, 500));
  }
});

// GET /discussions
exports.getDiscussions = async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    logger.info("Request: GET /discussions");
  }

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const sortBy = ["createdAt", "updatedAt"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";
    const pathname = req.query.pathname || null; // Ensure pathname is defined
    const isAllDiscussions = !pathname || pathname === "/discussions";


    // const cacheKey = `discussions_${
    //   pathname || "all"
    // }_${page}_${limit}_${sortBy}_${sortOrder}`;
    // const cachedResult = await cache.get(cacheKey);

    // if (cachedResult) {
    //   return res.status(200).json(cachedResult);
    // }

    let queryOptions = {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["entity", "userName"],
            },
          ],
        },
        {
          model: Comment,
          as: "comments",
          separate: true,
          limit: 5,
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "email"],
              include: [
                {
                  model: UserProfile,
                  as: "profile",
                  attributes: ["entity"],
                },
              ],
            },
          ],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    };

    if (!isAllDiscussions) {
      queryOptions.where = { pathname: pathname };
    }

    try {
      const { count, rows } = await Discussion.findAndCountAll(queryOptions);
      const result = {
        status: "success",
        data: {
          discussions: rows,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit,
          },
        },
      };
    
      // Send response back to the client
      res.status(200).json(result);
    } catch (err) {
      // Log the error for debugging
      logger.error("Error fetching discussions", {
        message: err.message || "Unknown error",
        stack: err.stack, // Include the stack trace for more context
        queryOptions, // Optionally log the queryOptions for debugging
      });
    
      // Send an error response back to the client
      res.status(500).json({
        status: "error",
        message: "Failed to fetch discussions",
        details: process.env.NODE_ENV === "production" ? null : err.message, // Avoid exposing details in production
      });
    }

    // // await cache.set(cacheKey, JSON.parse(JSON.stringify(result)), 60 * 5);
    // res.status(200).json(result);
  } catch (err) {
    logger.error("Request query:", {
      query: req.query, // Log request query params
      params: req.params, // Log request route params
      body: req.body, // Log request body, if applicable
    });
    
    return next(new AppError("Failed to fetch discussions", 500));
  }
};

// GET /discussions/:id
exports.getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "userName"],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "userName"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!discussion) {
      return res.status(404).json({
        status: "error",
        message: "Discussion not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: discussion,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch discussion",
    });
  }
};

// PATCH /discussions/:id
exports.updateDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findByPk(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        status: "error",
        message: "Discussion not found",
      });
    }

    if (discussion.userId !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this discussion",
      });
    }

    const { title, content } = req.body;
    await discussion.update({
      title: title || discussion.title,
      content: content || discussion.content,
    });

    const updatedDiscussion = await Discussion.findByPk(discussion.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: updatedDiscussion,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to update discussion",
    });
  }
};

// DELETE /discussions/:id
exports.deleteDiscussion = async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Request: DELETE /discussions/:id");
    logger.info("Welcome to deleteDiscussion function");
    logger.info("Request: DELETE /discussions/:id");
  }

  try {
    const discussion = await Discussion.findByPk(req.params.discussionId);

    if (!discussion) {
      return next(new AppError("Discussion not found", 404));
    }

    // Fetch the user's role
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: AuthDetails,
          as: "authDetails",
          attributes: ["role"],
        },
      ],
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if the user is the author of the discussion or has a 'developer' role
    if (
      discussion.userId !== req.user.id &&
      user.authDetails.role !== "developer"
    ) {
      return next(
        new AppError("Not authorized to delete this discussion", 403)
      );
    }

    await discussion.destroy();

    res.status(200).json({
      status: "success",
      message: "Discussion deleted successfully",
    });
  } catch (err) {
    logger.error("Error deleting discussion:", {
      message: err.message || "Failed to delete discussion",
      stack: err.stack, // Log the stack trace
      discussionId: req.params.discussionId, // Include discussion ID
      userId: req.user.id, // Include user ID for context
    });

    // Provide a more detailed response to the client
    res.status(500).json({
      status: "error",
      message: "Failed to delete discussion",
      details: process.env.NODE_ENV === "production" ? null : err.message, // Avoid exposing details in production
    });
  }
};


// POST /discussions/:discussionId/comment/:commentId
exports.commentDiscussion = async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Welcome to commentDiscussion function");
    logger.info("Request: POST /discussions/:id/comment");
  }

  try {
    const { discussionId } = req.params;
    const { content, userId } = req.body;

    if (!userId) {
      return next(new AppError("User ID is required", 400));
    }

    if (!content || content.trim().length === 0) {
      return next(new AppError("Comment content is required", 400));
    }

    if (content.length > 200) {
      return next(
        new AppError("Comment is too long. Maximum is 200 letters", 400)
      );
    }

    // Create new comment
    const comment = await Comment.create({
      content,
      userId,
      discussionId,
    });

    // Return comment with user information
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
        },
      ],
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error("Error in comment route:", error);
    return next(new AppError("Error in comment route", 500));
  }
};

exports.getAllPostComments = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Welcome to getAllPostComments function");
    logger.info("Request: GET /discussions/:id/comments");
  }

  try {
    const { discussionId } = req.params;

    // Validate discussionId
    if (!discussionId) {
      return next(new AppError("Discussion ID is required!", 400));
    }

    // // Check cache first
    // const cacheKey = `comments_${discussionId}`; // Create a cache key based on discussionId
    // const cachedComments = await cache.get(cacheKey);
    // if (cachedComments) {
    //   return res.status(200).json({ data: JSON.parse(cachedComments) }); // Parse cached data
    // }

    // Fetch comments with associated user and user profile information
    const comments = await Comment.findAll({
      where: { discussionId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
          include: [
            {
              model: UserProfile,
              as: "profile",
              attributes: ["entity", "userName"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Cache the fetched comments as a string
    // await cache.set(cacheKey, JSON.stringify(comments), "EX", 60 * 5); // Cache for 5 minutes

    // Respond with comments wrapped in a data object
    res.status(200).json({ data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    logger.error("Error fetching comments:", error); // Log the error for debugging
    return next(new AppError("Failed to fetch comments.", 500));
  }
});

// GET ALL POSTS BY USERID
exports.getAllPostsByUserId = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Welcome to getAllPostsByUserId function");
    logger.info("Request: GET /users/:id/posts");
  }

  const { userId } = req.params;

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  const posts = await Discussion.findAll({
    where: { userId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    data: {
      posts,
    },
  });
});

// THIS FUNCTION IS  USED TO DELETE COMMENT BASED ON ID
exports.deleteCommentById = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Welcome to deleteCommentById function");
    logger.info("Request: DELETE /comments/:id");
  }

  const { commentId } = req.params;

  if (!commentId) {
    return next(new AppError("Comment ID is required.", 400));
  }

  try {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return next(new AppError("Comment not found.", 404));
    }

    // Extract role from custom header
    const userRole = req.headers["x-user-role"];

    if (comment.userId !== req.user.id && userRole !== "developer") {
      return next(new AppError("Not authorized to delete this comment.", 403));
    }

    const discussionId = comment.discussionId;
    await comment.destroy();

    // Invalidate the cache for the discussion comments
    // const cacheKey = `comments_discussion_${discussionId}`;
    // await cache.del(cacheKey);

    // Fetch updated comments for the discussion
    const updatedComments = await Comment.findAll({
      where: { discussionId: discussionId },
      order: [["createdAt", "DESC"]], // Adjust ordering as needed
    });

    // Update the cache with the new comments
    // await cache.set(cacheKey, updatedComments);

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (err) {
    logger.error(err);
    return next(new AppError("Failed to delete comment.", 500));
  }
});
