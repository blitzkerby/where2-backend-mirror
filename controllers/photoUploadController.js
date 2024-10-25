const AppError = require("./../utils/appError");
const aws = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const { User, UserProfile, Accommodation, University, Job, Image } = require("./../model");
const catchAsync = require("../utils/catchAsync");

aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const constructS3Url = (key) => {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const s3 = new aws.S3();

exports.getS3Url = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getS3Url function called");
  }

  try {
    const { folder } = req.body;

    console.log("HJLSDFHJIKLGHJXCGJKHLDSFJKLFDSJKLDFSJKL", folder);

    if (!folder) {
      return next(new AppError("Folder name is required", 400));
    }

    let fileName;
    if (folder === "profile-picture") {
      fileName = `profile-pictures/${uuidv4()}.jpg`;
    } else {
      fileName = `${folder}/${uuidv4()}.jpg`;
    }

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Expires: 60,
      ContentType: "image/jpeg",
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", s3Params);
    
    res.json({
      url: uploadUrl,  // Pre-signed URL for uploading
      key: fileName,
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
    });
  } catch (error) {
    console.error("Error generating S3 pre-signed URL:", error);
    return next(new AppError("Error in generating upload URL", 500));
  }
});

exports.updateUserProfilePicture = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("updateUserProfilePicture function called 🤱🏿");
  }

  const { userId, imageUrl } = req.body;
  
  console.log('AJHJDSLHJKFKSJLFKJLSJKFSDJKLFJKLDSJFKLSDJKFDJKS', imageUrl)

  try {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: "profile" }],
    }); 

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Extract the key from the imageUrl
    const urlParts = imageUrl.split("/");
    const key = urlParts.slice(3).join("/"); // Assuming the URL structure is valid
    const fullS3Url = constructS3Url(key);

    if (!user.profile) {
      throw new AppError("User profile not found", 404);
    } else {
      // Update the profile picture URL in the database
      await user.profile.update({ profilePictureUrl: fullS3Url }); // Save the full imageUrl directly
    }

    res.status(200).json({ profilePictureUrl: fullS3Url }); // Return the full image URL
  } catch (error) {
    console.error("Error updating user profile picture", error);
    return next(new AppError("Error updating profile picture", 500));
  }
});

exports.getUserProfilePicture = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getUserProfilePicture function called");
  }

  const { userId } = req.params;

  console.log('ZSHUHDKGSHJKDFHKSJDFHJKSDHKJLFDSHJKLFHJKLSD', userId)

  if (!userId) {
    return next(new AppError("User ID is required", 400));
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: ["id"],
      include: [
        {
          model: UserProfile,
          as: "profile",
          attributes: ["profilePictureUrl"],
        },
      ],
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Extract the profile picture URL or set to a default URL if none exists
    const profilePictureUrl = user.profile?.profilePictureUrl || null; // Use a default image URL if necessary

    console.log('GUHYDSHJKFHJKLSDHFJKLSDHJFSHJKDFHJKLDS', profilePictureUrl)

    res.set({
      "Cache-Control": "public, max-age=3600",
      ETag: `"${userId}-${profilePictureUrl}"`, // You can customize this for better cache management if needed
    });

    res.status(200).json({
      status: "success",
      data: {
        profilePictureUrl,
        userId,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile picture:", error);
    return next(new AppError("Error fetching user profile picture", 500));
  }
});

exports.getBatchUserProfilePictures = catchAsync(async (req, res, next) => {
  const { userIds } = req.query;

  if (!userIds) {
    return next(new AppError("userIds must be provided", 400));
  }

  const ids = userIds.split(",");

  try {
    const users = await User.findAll({
      where: {
        id: ids,
      },
      attributes: ["id"],
      include: [
        {
          model: UserProfile,
          as: "profile",
          attributes: ["profilePictureUrl"],
        },
      ],
    });

    const profilePictures = users.reduce((acc, user) => {
      acc[user.id] = user.profile?.profilePictureUrl || null;
      return acc;
    }, {});

    res.json({
      status: "success",
      data: profilePictures,
    });
  } catch (error) {
    console.error("Error fetching batch user profile pictures:", error);
    return next(new AppError("Error fetching user profile pictures", 500));
  }
});

exports.uploadUserPublicPhoto = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("uploadUserPublicPhoto function called 🚀");
  }

  const { userId, imageUrl, formType, postId } = req.body;

  console.log('Request body:', { userId, imageUrl, formType, postId });

  // Validate required fields
  if (!userId) return next(new AppError("User ID is required", 400));
  if (!imageUrl) return next(new AppError("Image URL is required", 400));
  if (!formType) return next(new AppError("Form type is required", 400));
  if (!postId) return next(new AppError("Post ID is required", 400));

  try {
    // Find the user
    const user = await User.findByPk(userId);
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Extract the key from the imageUrl
    const urlParts = imageUrl.split("/");
    const key = urlParts.slice(3).join("/");
    const fullS3Url = constructS3Url(key);
    
    console.log('Constructed S3 URL:', fullS3Url);

    // Find existing image
    const existingImage = await Image.findOne({
      where: { 
        userId,
        imgTypeTable: formType,
        postId
      }
    });

    console.log('Existing image found:', existingImage ? 'Yes' : 'No');

    let result;
    const imageData = {
      postId,
      userId,
      imageUrl: fullS3Url,
      imgTypeTable: formType,
      imgAlt: 'Public image'
    };

    if (!existingImage) {
      console.log('Creating new image with data:', imageData);
      result = await Image.create(imageData);
      console.log('Create result:', result ? 'Success' : 'Failed');
    } else {
      console.log('Updating existing image with data:', imageData);
      result = await existingImage.update({ imageUrl: fullS3Url });
      console.log('Update result:', result ? 'Success' : 'Failed');
    }

    // Verify the operation
    const verificationCheck = await Image.findOne({
      where: { 
        userId,
        imgTypeTable: formType,
        postId
      }
    });
    
    console.log('Verification check:', {
      found: verificationCheck ? 'Yes' : 'No',
      url: verificationCheck?.imageUrl,
      id: verificationCheck?.id
    });

    res.status(200).json({ 
      status: 'success',
      data: {
        imageUrl: fullS3Url,
        postId: postId,
        imageId: result.id,
        operation: existingImage ? 'updated' : 'created'
      }
    });

  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sql: error.sql // If it's a Sequelize error
    });
    return next(new AppError(`Error processing image: ${error.message}`, 500));
  }
});


exports.getUserPublicPhotoForPost = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("getUserPublicPhotoForPost function called 🤱🏿");
  }

  const { userId, postId } = req.params;

  if (!userId || !postId) {
    return next(new AppError("User ID or Post ID is missing.", 400));
  }

  try {
    // Fetch the image based on userId and postId
    const image = await Image.findOne({
      where: {
        userId: userId,
        postId: postId
      }
    });

    if (!image) {
      return next(new AppError("Image not found for the given user and post", 404));
    }

    // Respond with the image URL
    res.status(200).json({
      imageUrl: image.imageUrl,
      altText: image.imgAlt
    });

  } catch (error) {
    console.error("Error fetching user photo for post", error);
    return next(new AppError("Error fetching photo", 500));
  }
});