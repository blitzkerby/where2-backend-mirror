const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const { User ,   UserProfile, AuthDetails , Job , University , Accommodation } = require('../model')
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const path = require("path");
const model = require("../model");
const { userInfo } = require("os");
const { literal } = require('sequelize');


const multerStorage = multer.memoryStorage();
const mulfilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type, only images are allowed", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: mulfilter,
});

exports.uploadPhoto = upload.single("photo");

// Filter objects
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// User Controller

// Update user (bio)
exports.updateUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { bio } = req.body;

    const user = await User.findOne({ where: { userName: username } });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    if (bio) {
      user.bio = bio;
    }

    // Handle photo upload
    if (req.file) {
      if (user.photo) {
        fs.unlinkSync(path.join("uploads/", user.photo));
      }

      user.photo = req.file.filename;
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Get the file extension from the original file
  const ext = path.extname(req.file.originalname).split(".")[1];

  // Generate the filename for the resized image
  req.file.filename = `user-${req.user.id}-${Date.now()}.${ext}`;
// Resize and save the image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`)
    .then(() => next()) // Proceed to the next middleware after the image is processed
    .catch((err) => next(err)); // Handle any errors
});

// Delete a user
exports.deleteUser = catchAsync(async (req, res, next) => {
  console.log("Delete User request received");
  console.log("User ID:", req.user.id);

  // Deactivate the user (soft delete)
  await User.update(
    { active: false },
    {
      where: { id: req.user.id },
    }
  );

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Upload a new file
exports.photoUpload = catchAsync(async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const photoPath = req.file.filename;
    user.photo = photoPath;
    await user.save();

    res.status(200).json({
      message: "Photo uploaded successfully",
      photo: photoPath,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


exports.getAllUsersInfo = catchAsync(async (req, res, next) => {
  console.log("getAllUsersInfo function called");

  if (process.env.NODE_ENV !== "production") {
    console.log("authController says: getAllUsersInfo function hits");
  }

  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'isActive', 'isVerified'],
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['entity', 'firstname', 'lastname', 'location']
        },
        {
          model: AuthDetails,
          as: 'authDetails',
          attributes: ['role']
        }
      ]
    });

    console.log(`Retrieved ${users.length} users`);

    // Modify the response to include the profile details
    res.status(200).json({
      status: "success",
      results: users.length,
      data: users.map(user => ({
        email: user.email, // Access the email from the User model
        entity: user.profile?.entity || "", // Safely access entity from the profile, if available
        firstname: user.profile?.firstname || "", // Access firstname
        lastname: user.profile?.lastname || "", // Access lastname
        location: user.profile?.location || "", // Access location
        role: user.authDetails?.role || "" ,// Access role from AuthDetails 
        id: user.id, // Access the id from the User model
        isActive: user.isActive, // Access isActive from User model
        isVerified: user.isVerified // Access isVerified from User model
      }))
    });
  } catch (error) {
    console.error("Error in getAllUsersInfo:", error);
    next(new AppError("Failed to retrieve users", 500));
  }
});


exports.deleteUserById = catchAsync(async (req, res, next) => {
  console.log("deleteUserById function called");

  // Extract the userId from the URL parameters
  const userId = parseInt(req.params.userId, 10);

  // Check if userId is a valid number
  if (isNaN(userId)) {
    return next(new AppError("Invalid User ID. Please provide a valid ID.", 400));
  }

  // Log information if not in production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Attempting to delete user ID: ${userId}`);
  }          

  // Attempt to find the user by userId
  const user = await User.findByPk(userId);

  // If the user is not found, return a 404 error
  if (!user) {
    console.log(`No user found for ID: ${userId}`);
    return next(new AppError("User not found.", 404));
  }

  try {
    // Option 1: If you want to soft delete (deactivate the user)
    await user.update({ isActive: false });

    // Option 2: If you want to permanently delete the user, uncomment the line below
    // await user.destroy();

    // Log success information in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      console.log(`User ID: ${userId} has been successfully deactivated.`);
    }

    // Send back a success response
    res.status(200).json({
      status: "success",
      message: "User deactivated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive, // This will be false if soft-deleted
        },
      },
    });
  } catch (err) {
    // Log the error and send a 500 response for any issues during the deletion
    console.error(`Error deleting user ID: ${userId}`, err);
    next(new AppError("Failed to deactivate user", 500));
  }
});


exports.reactivateUserById = catchAsync(async (req, res, next) => {
  console.log("activateUserById function called");

  if (process.env.NODE_ENV !== 'production') {
    console.log("authController says activateUserById hit 🤱🏿");
  }

  try {
    const user = await User.findByPk(req.body.id);
    console.log(user)
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }


    await user.update({ isActive: true });

    res.status(200).json({
      status: "success",
      message: "User activated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive, 
        },
      },
    });
  } catch (err) {
    console.error("Error in reactivateUserById:", err);
    next(new AppError("Failed to reactivate user", 500));
  }
});

exports.getMyProfile = catchAsync(async (req, res, next) => {
  console.log("getMyProfile function called");

  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return next(new AppError("Invalid User ID. Please provide a valid ID.", 400));
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Fetching profile for user ID: ${userId}`);
  }

  const userProfile = await UserProfile.findOne({
    where: { userId: userId },
    include: [{ 
      model: User, as: 'user',
      attributes: ['email', 'isActive']
    }],
    attributes: ['userName', 'firstName', 'lastName', 'profilePictureUrl', 'phoneNumber', 'entity', 'location', 'createdAt']})

  if (!userProfile) {
    console.log(`No user found for ID: ${userId}`);
    return next(new AppError("User not found. Please login.", 404));
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`User profile found for ID: ${userId}`);
  }


  const responseData = {
    userName: userProfile.userName,
    email: userProfile.user.email,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    phoneNumber: userProfile.phoneNumber,
    entity: userProfile.entity,
    location: userProfile.location,
    createdAt: userProfile.createdAt,
    isActive: userProfile.user.isActive,
    photo: userProfile.photo,
  };

  res.status(200).json({
    status: "success",
    data: responseData
  });
});

exports.getPublicProfile = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log("getPublicProfile function called");
  }

  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return next(new AppError("Invalid User ID. Please provide a valid ID.", 400));
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Fetching profile for user ID: ${userId}`);
  }

  try {
    const userProfile = await UserProfile.findOne({
      where: { userId: userId },
      include: [{ 
        model: User, as: 'user',
        attributes: ['email', 'isActive']
      }],
      attributes: ['userName', 'firstName', 'lastName', 'profilePictureUrl', 'phoneNumber', 'entity', 'location', 'createdAt']})
  
    if (!userProfile) {
      console.log(`No user found for ID: ${userId}`);
      return next(new AppError("User not found. Please login.", 404));
    }
  
    if (process.env.NODE_ENV !== 'production') {
      console.log(`User profile found for ID: ${userId}`);
    }
  
  
    const responseData = {
      userName: userProfile.userName,
      email: userProfile.user.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phoneNumber: userProfile.phoneNumber,
      entity: userProfile.entity,
      location: userProfile.location,
      createdAt: userProfile.createdAt,
      isActive: userProfile.user.isActive,
      photo: userProfile.photo,
    };
  
    res.status(200).json({
      status: "success",
      data: responseData
    })
  } catch (err) {
    return next(new AppError('Error fetching data!', 500))
  }
});



exports.getAdminContentList = catchAsync(async (req, res, next) => {
  console.log('getAdminContentList function called');

  const adminId = parseInt(req.params.adminId, 10);

  if (isNaN(adminId)) {
    return next(new AppError("Invalid User ID. Please provide a valid ID.", 400));
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Fetching admin content for admin ID: ${adminId}`);
  }

  try {
    // First, verify if the admin exists
    const admin = await User.findByPk(adminId);

    if (!admin) {
      console.log(`No admin found for ID: ${adminId}`);
      return next(new AppError("Admin not found. Please login.", 404));
    }

    // Fetch posts from all three tables
    const [universities, jobs, accommodations] = await Promise.all([
      University.findAll({
        where: { userId: adminId },
        attributes: [
          'id',
          'title',
          'description',
          'createdAt',
          [literal('"university"'), 'postType'] // Add a type identifier
        ]
      }),
      Job.findAll({
        where: { userId: adminId },
        attributes: [
          'id',
          'title',
          'description',
          'createdAt',
          [literal('"job"'), 'postType'] // Add a type identifier
        ]
      }),
      Accommodation.findAll({
        where: { userId: adminId },
        attributes: [
          'id',
          'title',
          'description',
          'createdAt',
          [literal('"accommodation"'), 'postType'] // Add a type identifier
        ]
      })
    ]);

    // Combine all posts
    const allPosts = [...universities, ...jobs, ...accommodations];

    // Sort posts by creation date (most recent first)
    const sortedPosts = allPosts.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (sortedPosts.length === 0) {
      console.log('No content found for admin ID:', adminId);
      return res.status(200).json({
        status: 'success',
        message: 'No content found',
        data: []
      });
    }

    res.status(200).json({
      status: 'success',
      results: sortedPosts.length,
      data: {
        posts: sortedPosts.map(post => ({
          id: post.id,
          title: post.title,
          description: post.description,
          createdAt: post.createdAt,
          postType: post.postType
        }))
      }
    });

  } catch (err) {
    console.error('Error fetching admin content list:', err);
    next(new AppError('Failed to fetch admin content list', 500));
  }
});