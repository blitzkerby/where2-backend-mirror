const { University } = require("../model");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");

/**
 * Get a university by ID.
 * 
 * This function retrieves a university from the Universities table based on the
 * provided ID parameter. It returns all fields of the matching university.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {Object} - JSON response with the university details or error message
 */
exports.getUniversity = async (req, res) => {
    try {
        const list = await University.findByPk(req.params.id);

        if (!list) {
            return res.status(404).json({ message: "University not found" });
        }

        res.status(200).json({ message: "University fetched successfully", list });
    } catch (error) { 
        res.status(500).json({ 
            message: "Error fetching university", 
            error: error.message 
        });
    }
};

exports.createUniversity = async (req,res) =>  {
    console.log("createUniversity hit")
    try {
        const newUniversity = await University.create(req.body);
        console.log(newUniversity)
        res.status(201).json({ message: "University created successfully", newUniversity });
    } catch (error) {
        res.status(400).json({ message: "Invalid data", error: error.message });
    }
}

exports.getUniversityList = async (req, res) => {
    try {
        
        const universities = await University.findAll();

        
        if (universities.length === 0) {
            return res.status(404).json({ message: "No universities found" });
        }

        
        res.status(200).json({ message: "Universities fetched successfully", universities });
    } catch (error) {
        res.status(500).json({ 
            message: "Error fetching universities", 
            error: error.message 
        });
    }
};

exports.approveUniversity = catchAsync(async(req,res) =>{
    console.log("approveUniversity hit")
    try {
        const universityId = req.params.id;

        if (isNaN(universityId)) {
            return res.status(400).json({ message: "Invalid University ID. Please provide a valid ID." });
        }

        if (process.env.NODE_ENV!== 'production') {
            console.log(`Attempting to approve University ID: ${universityId}`);
        }

        const university = await University.findByPk(universityId);
        console.log(university)

        if (!university) {
            return res.status(404).json({ message: "University not found" });
        }

        await university.update({ isApproved: true });

        res.status(200).json({ message: "University approved successfully", university });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ 
            message: "Error approving University", 
            error: error.message});

}
})


exports.disapproveUniversity = catchAsync(async(req,res) =>{
    console.log("approveUniversity hit")
    try {
        const universityId = req.params.id;

        if (isNaN(universityId)) {
            return res.status(400).json({ message: "Invalid University ID. Please provide a valid ID." });
        }

        if (process.env.NODE_ENV!== 'production') {
            console.log(`Attempting to disapprove University ID: ${universityId}`);
        }

        const university = await University.findByPk(universityId);
        console.log(university)

        if (!university) {
            return res.status(404).json({ message: "University not found" });
        }

        await university.update({ isApproved: false });

        res.status(200).json({ message: "University disapproved successfully", university });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ 
            message: "Error approving University", 
            error: error.message});

}
})