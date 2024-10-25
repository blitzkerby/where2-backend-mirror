const express = require('express');
const { getAllJobs, addJob, deleteJob, updateJob, getAssociateCompany, getJobLists , getJob, approveJob , disapproveJob } = require('../controllers/jobController');
const router = express.Router()

// router.get("/", getAllJobs);
router.get("/associatedCompany/:id", getAssociateCompany)
router.post("/addJob", addJob);
router.delete('/deleteJob/:id',deleteJob);
router.patch('/updateJob/:id', updateJob);
router.get('/job-list' , getJobLists);
router.get("/:id", getJob);
router.patch('/approve/:id' , approveJob )
router.patch('/disapprove/:id' , disapproveJob )
module.exports = router;