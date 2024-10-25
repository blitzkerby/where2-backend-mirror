/**
 * Routes for handling university-related operations.
 * 
 * @module routes/universityRoutes
 */

const express = require('express');
const UniversityController = require("../controllers/universityController");

const router = express.Router();

/**
 * Fetch a specific university by ID.
 * @route GET /universities/:id
 * @access Public
 */
router.get('/university-list' , UniversityController.getUniversityList)
router.get('/:id', UniversityController.getUniversity);
router.post('/addUniversity'  ,UniversityController.createUniversity)
router.patch('/approve/:id' , UniversityController.approveUniversity)
router.patch('/disapprove/:id' , UniversityController.disapproveUniversity)

module.exports = router;
