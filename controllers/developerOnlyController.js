const { Op } = require("sequelize");
const catchAsync = require("./../utils/catchAsync")
const AppError = require("./../utils/appError")
const logger = require("./../utils/logger")
const { Comment, User, Discussion, UserProfile } = require("./../model")

// FETCH ALL COMMENTS
exports.getAllComments = catchAsync(async (req, res, next) => {
    try {
      const comments = await Comment.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['entity', 'firstname', 'lastname', 'location', 'profilePictureUrl']
              }
            ]
          },
          {
            model: Discussion,
            as: 'discussion',
            attributes: ['id', 'title']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
  
      res.status(200).json({
        status: 'success',
        data: {
          comments
        }
      });
    } catch (error) {
      logger.error("Error fetching comment", error);
      return next(new AppError('Error fetching comments', 500));
    }
  });
  