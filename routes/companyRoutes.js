const express = require('express');
const { getAllCompany, addCompany, updateCompany, deleteCompany, getAssociatedJob } = require('../controllers/companyController');
const router = express.Router();

router.get("/", getAllCompany);
router.get("/associatedJob", getAssociatedJob)
router.post("/addCompany",addCompany);
router.patch("/updateCompany/:id", updateCompany);
router.delete("/deleteCompany/:id", deleteCompany);
module.exports = router;