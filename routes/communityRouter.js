const express = require("express");
const {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  commentDiscussion,
  getAllPostComments,
  getAllPostsByUserId,
  deleteCommentById,
} = require("../controllers/discussionController");
const { protect, restrictTo } = require("./../controllers/authController");
const dotenv = require("dotenv");
const { checkDiscussionExists } = require("../middleware/communityMiddleware");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";
dotenv.config({ path: envFile });
const router = express.Router();

// CREATE DISCUSSION
router.post("/discussion", createDiscussion);

// GET ALL DISCUSSION FOR THE COMMUNITY PAGE
router.get("/discussions", getDiscussions);

// GET ALL DISCUSSION BASED ON USERID
router.get("/discussions/:userId", getAllPostsByUserId);

router.get("/discussions/:id", protect, getDiscussionById);
router.patch(
  "/discussions/:id",
  restrictTo("admin", "developer"),
  updateDiscussion
);

// DELETE A DISSCUSION IF THE OWNER OF THE DIDSUCSSION DECIDES TO DELETE IT
router.delete(
  "/discussion/:discussionId",
  checkDiscussionExists,
  protect,
  deleteDiscussion
);

// DELETE REPLY
router.delete("/discussion/comment/:commentId", protect, deleteCommentById);

// GET ALL REPLIES FOR A POST
router.get(
  "/discussions/:discussionId/comments",
  checkDiscussionExists,
  getAllPostComments
);
// POST REPLY TO A POST
router.post(
  "/discussions/:discussionId/comment/:commentId",
  checkDiscussionExists,
  commentDiscussion
);
// router.delete("/discussions/:discussionId/comment/:commentId", protect, checkDiscussionExists, deleteDiscussion);

module.exports = router;
