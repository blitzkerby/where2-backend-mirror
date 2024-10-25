const { Scholarship } = require('../model')

/**
 * Get a scholarship by ID.
 * 
 * This function retrieves a scholarship from the Scholarships table based on the
 * provided ID parameter. It returns all fields of the matching scholarship.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @returns {Object} - JSON response with the scholarship details or error message
 */
exports.getScholarship = async (req, res) => {
	try {
		const list = await Scholarship.findByPk(req.params.id);

		if (!list) {
			return res.status(404).json({ message: "Scholarship not found" })
		}

		res.status(200).json({ message: "Scholarship fetched successfully", list })
	} catch (error) {
		res.status(500).json({
			message: "Error fetching scholarship",
			error: error.message
		})
	}
}