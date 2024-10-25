const express = require('express');
const { getAllList, getBySearch, getById } = require('../controllers/listController');
const router = express.Router();

// Middleware to attach category to req
router.param('category', (req, res, next, category) => {
    req.category = category;
    next();
})

/**
 * Establish endpoint for all list pages by category.
 * @route GET /api/list/:category
 * @param {Object} req.query - The query parameters.
 * @param {number} req.query.page - The current page number.
 * @param {number} req.query.limit - The number of items per page.
 * @access Public
 */
router.get('/:category', getAllList);

/**
 * Establish endpoint for searching lists.
 * @route GET /api/list/:category/search?query=___
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.query - The search query.
 * @access Public
 */
router.get('/:category/search', getAllList);


module.exports = router;
