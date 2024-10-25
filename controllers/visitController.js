const catchAsync = require("../utils/catchAsync");
const { Visit } = require("../model");
const AppError = require("../utils/appError");
const Sequelize = require("sequelize");
const logger = require("./../utils/logger")

exports.visitorTrack = catchAsync(async (req, res, next) => {
    const { path } = req.body;

    if (process.env.NODE_ENV !== 'production') {
        console.log("visitController says: visitorTrack function hits 😃");
        if (path) {
            console.log("visitController says: the path received is: " + path);
        }
    }

    const today = new Date().toISOString().split('T')[0];

    try {
        const [visit, created] = await Visit.findOrCreate({
            where: { path, date: today },
            defaults: { count: 1 }
        });

        if (!created) {
            await visit.increment('count');
        }

        res.json({ success: true, visit });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.visits = catchAsync(async (req, res) => {
    const { path } = req.query;
    const { startDate, endDate } = req.query;

    try {
        const visits = await Visit.findAll({
            where: {
                path,
                date: {
                    [Sequelize.Op.between]: [startDate, endDate]
                }
            },
            order: [['date', 'ASC']]
        });

        res.json({ success: true, visits });
    } catch (error) {
        return next(new AppError(error.message, 500));
    }
});

exports.decodedProfilePath = catchAsync(async (req, res) => {
  const {path} = req.params;
  res.send(`Proffile for: ${decodedProfilePath(path)}`)
})
