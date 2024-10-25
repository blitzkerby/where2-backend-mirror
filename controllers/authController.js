const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { User, UserProfile, AuthDetails, UserDevice } = require("./../model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { Op } = require("sequelize");
const Email = require("./../utils/email");
const { sequelize } = require("../model");
const logger = require("./../utils/logger");
const { log } = require("console");

const baseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.NODE_ENV_PROD_HOST
    : process.env.NODE_ENV_LOCAL_HOST;

// THIS FUNCTION IS USED TO SIGN A TOKEN WHEN LOGS IN OR SIGNUP
const signToken = (id) => {
  logger.debug("signToken function called", { userId: id });
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

async function logoutAllDevices(userId) {
  logger.info("Invalidating all devices for user", { userId });

  try {
    const userDevices = await UserDevice.findAll({ where: { userId } });

    for (const device of userDevices) {
      logger.info(`Invalidating session for device: ${device.deviceName} on ${device.deviceType}`);

      await UserDevice.destroy({ where: { id: device.id } });
    }

    console.log('All devices logged out for user:', userId);
  } catch (err) {
    logger.error("Error invalidating all devices", {
      error: err.message,
      stack: err.stack,
      userId,
    });
    console.error('Error invalidating all devices:', err); // Changed to log err
  }
}


const createSendToken = (user, statusCode, res, userName, entity) => {
  logger.info("Creating and sending token", { userId: user.id, statusCode });

  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_EXPIRES) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  logger.debug("Token created and cookie set", { entity });

  res.status(statusCode).json({
    status: "success",
    token,
    id: user.id,
    userName: userName,
    entity: entity,
    data: {
      user: {
        ...user.toJSON(),
        profile: undefined,
      },
    },
  });
};

// FIELDVALIDATION FUNCTION USED TO VALIDATE DATA SENT FROM FRONTEND WHETHER ITS A PERSONAL OR BUSINESS INPUT TYPES
const validateFields = (requiredFields, formData) => {
  logger.debug("Validating fields", { requiredFields });

  const missingFields = requiredFields.filter((field) => !formData[field]);
  if (missingFields.length > 0) {
    logger.warn("Missing required fields", { missingFields });
    throw new AppError(
      `Missing required fields: ${missingFields.join(", ")}`,
      400
    );
  }
};

// /api/user/singup POST: THIS FUNCTION IS USED WHEN USER IS SIGNING UP
exports.signup = catchAsync(async (req, res, next) => {
  const {
    firstName,
    entity,
    lastName,
    userName,
    email,
    password,
    location,
    passwordConfirm,
    dateOfBirth,
    phoneNumber,
    formType,
  } = req.body;

  // LOG INFORMATION IN LOGGER FOR DEBUGGING AND APPLICATION MANAGEMENT
  logger.info("Signup attempt", { email, formType });

  // SPLIT INTO TWO FIELD ONE IS FOR PERSONAL FIELD AND ONE IS FOR BUSINESS FIELD
  const personalFields = [
    "firstName",
    "lastName",
    "email",
    "password",
    "passwordConfirm",
    "location",
  ];
  const businessFields = [
    "entity",
    "firstName",
    "lastName",
    "location",
    "phoneNumber",
    "email",
    "password",
    "passwordConfirm",
    "dateOfBirth",
  ];

  // VALIDATION BASED ON DATA RECIEVED
  try {
    if (formType === "personal") {
      validateFields(personalFields, req.body);
    } else if (formType === "business") {
      validateFields(businessFields, req.body);
    } else {
      logger.error("Invalid form type", { formType });
      throw new AppError("Invalid form type", 400);
    }

    if (password !== passwordConfirm) {
      logger.warn("Password mismatch during signup", { email });
      throw new AppError("Passwords do not match.", 400);
    }

    const role = formType === "business" ? "admin" : "user";
    logger.debug("Role assigned", { role, formType });

    const existingUser = await User.findOne({
      where: { email },
      include: [
        { model: UserProfile, as: "profile" },
        { model: AuthDetails, as: "authDetails" },
      ],
    });

    if (existingUser && (!existingUser.isVerified || !existingUser.isActive)) {
      logger.info("Removing unverified or inactive existing user", { email });
      await sequelize.transaction(async (t) => {
        await existingUser.profile.destroy({ transaction: t });
        await existingUser.authDetails.destroy({ transaction: t });
        await existingUser.destroy({ transaction: t });
      });
    } else if (existingUser) {
      throw new AppError(
        "Email already exists. Please use a different email.",
        400
      );
    }

    let existingUserName = null;
    if (userName) {
      existingUserName = await UserProfile.findOne({
        where: { userName },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["isVerified", "isActive"],
          },
        ],
      });

      if (
        existingUserName &&
        existingUserName.user &&
        existingUserName.user.isVerified &&
        existingUserName.user.isActive
      ) {
        throw new AppError(
          "Username must be unique. Please use a different username.",
          400
        );
      }
    }

    const result = await sequelize.transaction(async (t) => {
      const user = await User.create(
        { email, password, isActive: false },
        { transaction: t }
      );

      const userProfileData = {
        userId: user.id,
        firstName,
        lastName,
        location,
        phoneNumber,
        ...(formType === "business" && { entity, dateOfBirth }),
      };

      if (userName) {
        userProfileData.userName = userName;
      }

      const userProfile = await UserProfile.create(userProfileData, {
        transaction: t,
      });
      const authDetails = await AuthDetails.create(
        { userId: user.id },
        { transaction: t }
      );

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await authDetails.update(
        {
          role,
          verificationCode,
          verificationCodeExpires: Date.now() + 10 * 60 * 1000,
          isVerified: false,
        },
        { transaction: t }
      );

      const completeUser = {
        ...user.toJSON(),
        firstName: userProfile.firstName,
        name: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
      };

      return { user: completeUser, userProfile, authDetails };
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "authController says verification email is being sent to the user:"
      );
    }

    const { authDetails } = result;
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${authDetails.verificationCode}`;

    await new Email(result.user, verificationUrl).sendVerificationCode(
      result.authDetails.verificationCode
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(
        "authController says if you see this message it means there is nothing wrong with the Email class. 🔥"
      );
    }

    res.status(201).json({
      status: "success",
      message:
        "User created successfully. Please check your email for verification.",
    });
  } catch (error) {
    logger.error("Signup error", {
      error: error.message,
      stack: error.stack,
      email,
    });
    return next(
      new AppError(
        "An unexpected error occurred during signup. Please try again.",
        500
      )
    );
  }
});

// VERIFICATION FUNCTION: USED TO COMPARE USER INPUT VERIFICATION CODE AND CODE STORED WITHIN THE DATABASE
exports.verifyAccount = catchAsync(async (req, res, next) => {
  const { verificationCode } = req.body;

  logger.info("Verifying account", { verificationCode });

  try {
    const authDetails = await AuthDetails.findOne({
      where: {
        verificationCode,
        verificationCodeExpires: { [Op.gt]: Date.now() },
      },
      include: [{ model: User, as: "user" }],
    });

    if (!authDetails) {
      return next(new AppError("Invalid or expired verification code", 400));
    }

    const user = authDetails.user;

    user.isVerified = true;
    user.isActive = true;


    await user.save({ validateBeforeSave: false });

    authDetails.verificationCode = null;
    authDetails.verificationCodeExpires = null;
    await authDetails.save();

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error("Error during account verification", { error });
    return next(
      new AppError(
        "An error occurred during account verification. Please try again later.",
        500
      )
    );
  }
});

// THIS FUNCTION IS USED TO SEND VARIFICATOPN CODE TO USER AFTER 10 MINUITES
exports.resendVerificationCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  logger.info("Resending verification code", { email });
  logger.info("authController says: email is", email);

  const user = await User.findOne({
    where: { email },
    include: [{ model: AuthDetails, as: "authDetails" }],
  });

  if (!user) {
    logger.error("Error in resendVerificationCode", { email });
    return next(
      new AppError(
        "There is no user with this email address. Please consider signing up.",
        404
      )
    );
  }

  if (user.isVerified) {
    logger.error("Error in resendVerificationCode", { email });
    return next(
      new AppError("This account is already verified. Please login.", 400)
    );
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  try {
    await sequelize.transaction(async (t) => {
      if (user.authDetails) {
        user.authDetails.verificationCode = verificationCode;
        user.authDetails.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
        await user.authDetails.save({
          transaction: t,
          validateBeforeSave: false,
        });
      } else {
        await AuthDetails.create(
          {
            userId: user.id,
            verificationCode,
            verificationCodeExpires: Date.now() + 10 * 60 * 1000,
          },
          { transaction: t }
        );
      }

      await new Email(user, req.get("host")).sendVerificationCode(
        verificationCode
      );
    });

    logger.info("Verification code resent successfully", { email });

    res.status(200).json({
      status: "success",
      message: "Verification code resent successfully.",
    });
  } catch (err) {
    logger.error("Error in resendVerificationCode", { error: err });

    try {
      if (user.authInfo) {
        user.authInfo.verificationCode = null;
        user.authInfo.verificationCodeExpires = null;
        await user.authInfo.save({ validateBeforeSave: false });

        logger.info("Verification code deleted successfully", { email });
      }
    } catch (resetErr) {
      logger.error("Error in resendVerificationCode", { error: resetErr });
    }

    return next(
      new AppError(
        "There was an error sending the verification email. Please try again.",
        500
      )
    );
  }
});

// THIS FUNCTION IS USED TO SEND THE USER WELCOME EMAIL
exports.sendWelcomeEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  logger.info("Sending welcome email", { email });

  if (!email) {
    logger.error("Error in sendWelcomeEmail", { email });
    return next(new AppError("Email address is required.", 400));
  }

  try {
    // Find user with profile information
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: UserProfile,
          as: "profile",
        },
      ],
    });

    if (!user) {
      logger.error("Error in sendWelcomeEmail", { email });
      return next(
        new AppError("There is no user with this email address.", 404)
      );
    }

    if (!user.profile) {
      logger.error("No user profile found for user", { email });
      return next(new AppError("User profile not found for this user.", 404));
    }

    // Prepare user data for email
    const combinedUserData = {
      email: user.email,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      name: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
    };

    // Create and send email
    const emailObj = new Email(combinedUserData, process.env.FRONTEND_URL);

    // Use sendWelcome instead of sendWelcomeEmail
    await emailObj.sendWelcome();

    logger.info("Welcome email sent successfully", { email });
    res.status(200).json({
      status: "success",
      message: "Welcome email sent successfully.",
    });
  } catch (err) {
    logger.error("Error in sendWelcomeEmail", { error: err });

    if (
      err instanceof TypeError &&
      err.message.includes("Cannot read properties of undefined")
    ) {
      return next(
        new AppError(
          "Error in email processing. Please check the user and profile data.",
          500
        )
      );
    }

    if (err.message.includes("email") || err.code === "ECONNREFUSED") {
      return next(
        new AppError(
          "Failed to send welcome email. Please try again later.",
          500
        )
      );
    }

    if (err.message.includes("unauthorized") || err.code === "unauthorized") {
      console.error(
        "API Key issue detected. Current environment:",
        process.env.NODE_ENV
      );
      return next(
        new AppError(
          "Email service configuration error. Please contact support.",
          500
        )
      );
    }

    return next(
      new AppError("An unexpected error occurred. Please try again.", 500)
    );
  }
});

// THIS FUNCTION IS USED TO LOG IN USER
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  logger.info("Login attempt", { email });

  if (!email || !password) {
    logger.error("Error in login", { email });
    return next(new AppError("Please provide email and password!", 400));
  }

  try {
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: UserProfile,
          as: "profile",
          attributes: ["userName", "entity"],
        },
      ],
      attributes: ["id", "password", "isVerified", "isActive"],
    });

    if (!user) {
      logger.warn("Login attempt with non-existent user", { email });
      logger.error("Error in login", { email });
      return next(
        new AppError(
          "User not found. Please check your email or password. Or create a new account.",
          404
        )
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      logger.error("Login attempt with incorrect password", { email });
      return next(new AppError("Incorrect email or password", 401));
    }

    if (!user.isActive || !user.isVerified) {
      if (process.env.NODE_ENV !== "production") {
        console.log(user.isActive);
        console.log(user.isVerified);
      }

      return next(
        new AppError(
          "This account is not active or has not been verified yet",
          403
        )
      );
    }

    logger.info("Successful login", { userId: user.id });

    // SAVE USER DEVICE DATA
    try {
      await UserDevice.create({
        userId: user.id,
        deviceType: req.userDevice.deviceType,
        deviceName: req.userDevice.deviceName,
        browserName: req.userDevice.browserName,
        browserVersion: req.userDevice.browserVersion,
        osName: req.userDevice.osName,
        osVersion: req.userDevice.osVersion,
      });
    } catch (err) {
      logger.error("Error saving user device data", {
        error: err.message,
        stack: err.stack,
        userId: user.id,
      });
    }

    createSendToken(user, 200, res, user.profile.userName, user.profile.entity);
  } catch (error) {
    logger.error("Login error", {
      error: error.message,
      stack: error.stack,
      email,
    });
    return next(
      new AppError(
        "An error occurred during login. Please try again later.",
        500
      )
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "authController says: you passed everything here in the function. Login is done. 😃"
    );
  }
});

// PROTECT FUNCTION USED AS A MIDDLEWARE SO THAT WHEN LOGGIN IN, IT CHECKS FOR TOKEN AND DECRYPT IT TO VERIFY IDENITITY
exports.protect = catchAsync(async (req, res, next) => {
  logger.info("authController says: protect middleware function hits");

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    logger.error('No token found in request headers', { token });
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findByPk(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  req.user = currentUser;
  next();
});

// THIS FUNCTION IS USED TO RESTRICT ROUTE TO CERTAIN USERS ROLE
exports.restrictTo = (...roles) => {
  logger.info("authController says: restrictTo function hits");

  return (req, res, next) => {
    if (!roles.includes(req.user.data.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

// THIS FUNCTION IS USED TO SEND FORGOT PASSWORD EMAIL SO THAT IT CAN ACESS THE RESET TOKEN
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  logger.info("Forgot password request", { email });

  if (!email) {
    logger.error("Forgot password request", { email });
    return next(new AppError("Email address is required.", 400));
  }

  try {
    // Find user with profile information
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: UserProfile,
          as: "profile",
        },
      ],
    });

    if (!user) {
      logger.error("User not found", { email });
      return next(
        new AppError("There is no user with this email address.", 404)
      );
    }

    // Create reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    logger.info("Reset token created", { resetToken });
    // Prepare user data for email
    const userData = {
      email: user.email,
      firstName: user.profile?.firstName || "",
      lastName: user.profile?.lastName || "",
      name: user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
        : "Valued Customer",
    };

    // Create reset URL and send email
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailObj = new Email(userData, resetURL);


    await emailObj.sendResetPassword();


    logger.info("Reset password email sent successfully", { email });

    res.status(200).json({
      status: "success",
      message: "Reset password email sent successfully. Check your inbox.",
    });
  } catch (err) {
    logger.error("Error in forgot password", {
      error: err.message,
      stack: err.stack,
      email,
    })

    // Clean up reset token if email fails
    if (user) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
    }

    if (
      err instanceof TypeError &&
      err.message.includes("Cannot read properties of undefined")
    ) {
      return next(
        new AppError(
          "Error in email processing. Please check the user data.",
          500
        )
      );
    }

    if (err.message.includes("email") || err.code === "ECONNREFUSED") {
      return next(
        new AppError(
          "Failed to send reset password email. Please try again later.",
          500
        )
      );
    }

    if (err.message.includes("unauthorized") || err.code === "unauthorized") {
      console.error(
        "API Key issue detected. Current environment:",
        process.env.NODE_ENV
      );
      return next(
        new AppError(
          "Email service configuration error. Please contact support.",
          500
        )
      );
    }

    return next(new AppError("Error sending password reset email.", 500));
  }
});

// IN ORDER TO RESET PASSWORD, THIS FUNCTION IS USED
exports.resetPassword = catchAsync(async (req, res, next) => {
  logger.info("Reset password request", { token: req.params.token });
  logger.info("Reset password request", { body: req.body });

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Update the user's password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  
  await user.save();

  logger.info("Password reset successfully", { user });

  // Call the function to logout all devices
  await logoutAllDevices(user.id);
  createSendToken(user, 200, res);
});


exports.updatePassword = catchAsync(async (req, res, next) => {
  logger.info('Password update request initiated');

  // 1) User ID Validation
  const { userId } = req.params;

  logger.info('Password update request initiated', { userId });

  if (!userId) {
    logger.error('User ID is required');
    return next(new AppError('User ID is required', 400));
  }

  // 2) Input Validation
  const { passwordCurrent, password, passwordConfirm } = req.body;
  if (!passwordCurrent || !password || !passwordConfirm) {
    return next(
      new AppError(
        'Missing required fields. Please provide current password, new password, and password confirmation',
        400
      )
    );
  }

  // 3) Find User
  const user = await User.findByPk(req.user.id, {
    attributes: {
      include: [
        'password',
        'passwordChangedAt',
        'passwordAttempts',
        'passwordLockUntil'
      ]
    }
  });

  if (!user) {
    return next(new AppError('User no longer exists', 404));
  }

  // 4) Check Account Lock Status
  const now = new Date();
  if (user.passwordLockUntil && user.passwordLockUntil > now) {
    const timeLeft = Math.ceil((user.passwordLockUntil - now) / 1000 / 60);
    return next(
      new AppError(
        `Account is temporarily locked. Please try again in ${timeLeft} minutes or use the 'Forgot Password' option`,
        423
      )
    );
  }

  // 5) Verify Current Password
  try {
    const isPasswordCorrect = await bcrypt.compare(passwordCurrent, user.password);
    
    if (!isPasswordCorrect) {
      // Update attempts counter
      user.passwordAttempts = (user.passwordAttempts || 0) + 1;
      
      const MAX_ATTEMPTS = 100;
      const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
      
      // Check for account lockout
      if (user.passwordAttempts >= MAX_ATTEMPTS) {
        user.passwordLockUntil = new Date(Date.now() + LOCKOUT_TIME);
        user.passwordAttempts = 0;
        await user.save();
        return next(
          new AppError(
            'Account locked for 15 minutes due to too many failed attempts. Please try again later or use the "Forgot Password" option',
            423
          )
        );
      }
      
      await user.save();
      
      // Calculate remaining attempts
      const remainingAttempts = MAX_ATTEMPTS - user.passwordAttempts;
      return next(
        new AppError(
          `Invalid current password. ${remainingAttempts} attempts remaining before account lockout`,
          401
        )
      );
    }
  } catch (err) {
    logger.error('Password verification error:', err);
    return next(new AppError('Unable to verify current password. Please try again', 500));
  }

  // 6) Validate New Password
  try {
    // Check password length
    if (password.length < 6) {
      return next(
        new AppError(
          'Password must be at least 6 characters long',
          400
        )
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return next(
        new AppError(
          'New password must be different from your current password',
          400
        )
      );
    }

    // Check password confirmation
    if (password !== passwordConfirm) {
      return next(
        new AppError(
          'New password and confirmation do not match',
          400
        )
      );
    }

    // Additional password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return next(
        new AppError(
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          400
        )
      );
    }
  } catch (err) {
    logger.error('Password validation error:', err);
    return next(new AppError('Error validating new password requirements', 500));
  }

  // 7) Update Password
try {
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordChangedAt = new Date();
  user.passwordAttempts = 0;
  user.passwordLockUntil = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
    // Generate token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save the hashed token
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save({ validateBeforeSave: false });

  // 8) Send Email Notification
  try {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const email = new Email(user, resetURL);
    await email.sendPasswordChanged();
    logger.info(`Password change notification sent to user ${user.id}`);
  } catch (err) {
    logger.error('Failed to send password change notification:', err);
  }

  logger.info(`Password updated successfully for user ${user.id}`);

  // Call the function to logout all devices
  await logoutAllDevices(user.id);

  // 9) Send Success Response without session token
  return res.status(200).json({
    status: 'success',
    message: 'Password updated successfully.',
  });
} catch (err) {
  logger.error('Password update error:', err);
  return next(
    new AppError(
      'Failed to update password. Please try again or contact support if the problem persists',
      500
    )
  );
}
});

// Additional helper for checking recent password history
exports.checkPasswordHistory = async (userId, newPassword) => {
  const recentPasswords = await PasswordHistory.findAll({
    where: {
      userId,
      createdAt: {
        [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    },
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  for (const historicPassword of recentPasswords) {
    const isMatch = await bcrypt.compare(newPassword, historicPassword.password);
    if (isMatch) {
      return false; // Password was used recently
    }
  }
  return true;
};

// THIS FUNCTION SENDROLE TO USER
exports.sendRole = (req, res) => {
  logger.info(`Sending user role to client: ${req.userRole}`);

  if (!req.userRole) {
    return res.status(400).json({ error: "User role not found" });
  }

  res.json({ role: req.userRole });
};

