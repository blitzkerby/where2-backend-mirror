const { resolveModel } = require("../utils/resolveModel")
const { Op } = require("sequelize")
const { Job } = require('./../model');
/**
 * Get all list or search results items by category.
 *
 * This function provides a basic response for retrieving all items by category.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllList = async (req, res) => {
    const category = req.category;
    const { location, q: searchQuery, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit;

    try {
        const { success, model, message } = resolveModel(category);

        if (!success){
            return res.status(400).json({ message });
        }

        let whereClause = {};
        
        if (location) whereClause.location = { [Op.like]: `%${location}%` }
        if (searchQuery) whereClause.name = { [Op.like]: `%${ searchQuery }%` }

        if (model.name === 'Job') {
            const { count, rows }  = await model.findAndCountAll({
                include: "company",
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            const totalPages = Math.ceil(count / limit);

            if (rows.length === 0) return res.status(404).json({ message: 'No items found.' });
    
            res.status(200).json({
                message: "list fetched successfully",
                list: rows,
                pagination: {
                    totalItems: count,
                    totalPages,
                    currentPage: parseInt(page)
                }
            })

        } else {
            const { count, rows } = await model.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            const totalPages = Math.ceil(count / limit);

            if (rows.length === 0) return res.status(404).json({ message: 'No items found.' });
    
            res.status(200).json({
                message: "list fetched successfully",
                list: rows,
                pagination: {
                    totalItems: count,
                    totalPages,
                    currentPage: parseInt(page)
                }
            })
        }

    } catch (err) {
        console.error('Error fetching list:', err);
        res.status(500).json({ message: "Error fetching list", error: err.message });
    }
}; 
