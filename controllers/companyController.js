const { where, Model } = require("sequelize");
const catchAsync = require("../utils/catchAsync");
const {Company, Job} = require("./../model")
exports.getAllCompany = catchAsync(async (req, res, next) => {
    const companies = await Company.findAll();

    res.status(200).json({
        status: "data fetched success",
        amount: companies.length,
        data: {
            companies
        }
    })
});

exports.addCompany = catchAsync(async (req, res, next) => {
    const {
        company_bg,
        email,
        website_url,
        tel,
        location,
        img_url,
        img_desc
    } = req.body;
    console.log( company_bg,
        email,
        website_url,
        tel,
        location,
        img_url,
        img_desc)
 
    const addedCompnay = await Company.create({
        company_bg,
        email,
        website_url,
        tel,
        location,
        img_url,
        img_desc
    });
    res.status(200).json({
        status: "company added successfully",
        data: {
            addedCompnay
        }
    });
    next()
});

exports.updateCompany = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updatedCompany = await Company.update(req.body, { where: { company_id: id } });

    res.status(200).json({
        status: "company updated successfully",
        data: {
            updatedCompany
        }
    })
});

exports.deleteCompany = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const deletedCompany = await Company.destroy({ where: { company_id: id } });

    res.status(200).json({
        status: "company deleted successfully",
        data: {
            deletedCompany
        }
    })
});

exports.getAssociatedJob = catchAsync(async (req, res) => {
    const associatedJob = await Company.findAll({
        include: "jobs"
    });
    res.status(200).json({
        status: "success",
        data: {
            associatedJob
        }
    })
})


