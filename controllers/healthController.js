const AppError = require("./../utils/appError")
const catchAsync = require("./../utils/catchAsync")
const { HealthArticle } = require("./../model")

exports.getHealthArticles = catchAsync(async (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
        console.log("healthController says: getHealthArticles function hits 😃");
    }

    try {
        const healthArticles = await HealthArticle.findAll({
            where: { isPublished: true }
        });
    
        res.status(200).json({
            status: 'success',
            data: {
                healthArticles
            }
        });
    } catch (err) {
        return next(new AppError('Error fetching articles', 500));
    }
});

// THIS FUNCTION IS USED TO FETCH HEALTH ARTICLE BASEON GIVEN ID
exports.getHealthArticleById = catchAsync(async (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
        console.log("healthController says: getHealthArticleById function hits 😃");
    }

    const { id } = req.params;

    if (!id) {
        return next(new AppError('Article ID is required', 400));
    }

    try {
        // Fetch the article by primary key and ensure it's published
        const healthArticle = await HealthArticle.findOne({
            where: {
                id,
                isPublished: true
            }
        });

        if (!healthArticle) {
            return next(new AppError('Article not found or not published', 404));
        }
    
        res.status(200).json({
            status: 'success',
            data: {
                healthArticle
            }
        });
    } catch (err) {
        console.error("Database error:", err); // Log the error for more details
        return next(new AppError('Error fetching article', 500));
    }
});


