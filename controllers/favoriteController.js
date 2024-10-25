const { where } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const { Favorite } = require('./../model');

exports.addFavorite = catchAsync(async (req, res, next) => {
    const {
        user_id,
        card,
        categories
    } = req.body;
    const { count } = await Favorite.findAndCountAll({
        where:{user_id,card,categories}
    })
    if (count === 0) {
        const favorites = await Favorite.create({
            user_id,
            card,
            categories
        });
        res.status(200).json({
            status: 'success',
            data: {
                favorites
            }
        })
    };
next()
});

exports.getAllFavorite = catchAsync(async (req, res, next) => {
    const allFavorite = await Favorite.findAll({
        include: `${ req.params.categories }`,
        where: { user_id: req.params.id, categories: req.params.categories },
    });

    allFavorite.map(fav => {
        if (fav[`${ req.params.categories }`] === null) {
            Favorite.destroy({ where: { id: fav.id } });
        }
    });
    
    res.status(200).json({
        status: 'success',
        data: {
            allFavorite
        }
    })
});

exports.removeFavorite = catchAsync(async (req, res, next) => {
    const removedFavorite = await Favorite.destroy({ where: { card: req.params.cardId, categories: req.params.categories } });

    res.status(200).json({
        message: "Deleted Successfully"
    })
});