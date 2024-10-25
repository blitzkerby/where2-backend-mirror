const { json } = require("body-parser");
const { Accommodation } = require("../model");
const catchAsync = require('../utils/catchAsync');
const { where } = require('sequelize');

exports.addAccommodation = catchAsync(async (req, res, next) => {
    const {
        name,
        type,
        price,
        availability,
        size,
        location,
        description,
        google_map,
        image_url,

    } = req.body;

    const accommodation = await Accommodation.create({
        name,
        type,
        price,
        availability,
        size,
        location,
        description,
        google_map,
        image_url,
    })
    res.status(200).json({
        status: "added success",
        accommodation,
    })
    next()
   
});

exports.getOneAccommdocation = catchAsync(async (req, res, next) => {
    const oneAccommodation = await Accommodation.findOne({ where: { id: req.params.id } });

    res.status(200).json({
        message: "fetch one accommodation successfully",
        oneAccommodation,
    })
});

exports.updateAccommodation = catchAsync(async (req, res, next) => {
    const updatedAccommodation = await Accommodation.update(req.body, { where: { id: req.params.id } });

    res.status(200).json({
        message: "Update Successfully",
        updatedAccommodation
    });
    next()
});

exports.deleteAccommodation = catchAsync(async (req, res, next) => {
    const deletedAccommodation = await Accommodation.destroy({ where: { id: req.params.id } });

    res.status(200).json({
        message: "Deleted Sucessfully"
    })
});

