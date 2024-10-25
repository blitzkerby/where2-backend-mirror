const express = require("express");
const {
  getS3Url,
  getUserProfilePicture,
  updateUserProfilePicture,
  getBatchUserProfilePictures,
  uploadUserPublicPhoto,
  getUserPublicPhotoForPost,
} = require("../controllers/photoUploadController");
const router = express.Router();

router.post("/s3Url", getS3Url);

router.post("/profile-picture", updateUserProfilePicture);
router.get("/:userId/profile-picture", getUserProfilePicture);

router.post("/public", uploadUserPublicPhoto);
router.get("/:userId/public/:postId", getUserPublicPhotoForPost);


router.get("/users/batch-profile-pictures", getBatchUserProfilePictures);

module.exports = router;
