const express = require('express');
const ScholarshipController = require("../controllers/scholarshipsController")

const router = express.Router();

// Route to fetch a specific scholarship by ID
router.get("/:id", ScholarshipController.getScholarship)

module.exports = router