const { Job } = require('./../model');
const catchAsync = require('./../utils/catchAsync');
const { where } = require('sequelize');
const logger = require('./../utils/logger');
const AppError = require('./../utils/appError');



exports.addJob = catchAsync(async (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Welcome to addJob function');
        logger.info("Request: POST /job");
    }

    const {
        company_id,
        job_desc,
        job_require,
        location,
        salary,
        position,
        deadline,
        company_name,
        work_hour,
        userId
    } = req.body;

    console.log("SDFJKLFLDGKJGKLFKFHJLKFGJLDFGKLDFGKL",         company_id,
        job_desc,
        job_require,
        location,
        salary,
        position,
        deadline,
        company_name,
        work_hour,
        userId)

   const newJob = await Job.create({
        company_id,
        job_desc,
        job_require,
        location,
        salary,
        position,
        deadline,
        company_name,
        work_hour,
        userId
    })

    res.status(200).json({
        status: "added success",
        data: {
            newJob
        }
    })
})

exports.updateJob = catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const updated = await Job.update(req.body, { where: { id: id } });

    res.status(200).json({
        status: "updated successfully",
        data: {
            updated
        }
    });
    next()
})

exports.deleteJob = catchAsync(async (req, res, next) => {
    const { id }  = req.params;
    await Job.destroy({
        where: { id:id },
    });
   
    res.status(404).json({
        status: "Deleted Successfully",
        message: "error id",
        data: {
            id
        }
    })
    next()
});
exports.getAssociateCompany = catchAsync(async (req, res) => {
    const associatedCompany = await Job.findAll({
        include: "company", 
        where: {id: req.params.id}
    });
    res.status(200).json({
        status: "success",
        data: {
            associatedCompany
        }
    })
})

exports.getJobLists = catchAsync(async (req, res) => {
    const jobs = await Job.findAll({
        include: "company",
    });
    res.status(200).json({
        status: "success",
        data: {
            jobs
        }
    })
})

exports.getJob = catchAsync(async (req, res) => {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
        return res.status(404).json({
            status: "error",
            message: "job not found"
        });
    }

    res.status(200).json({
        status: "success",
        data: {
            job
        }
    });
})

exports.approveJob = catchAsync(async (req, res, next) => {
    console.log("approveJobById function called");
  
    
    const jobId =req.params.id
  
    
    if (isNaN(jobId)) {
      return next(new AppError(`Invalid Job ID. Please provide a valid ID. ${jobId}`, 400));
    }
  
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Attempting to approve job ID: ${jobId}`);
    }
  
    
    const job = await Job.findByPk(jobId);
  
    
    if (!job) {
      console.log(`No job found for ID: ${jobId}`);
      return next(new AppError("Job not found.", 404));
    }
  
    try {
      
      await job.update({ isApproved: true });
  
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Job ID: ${jobId} has been successfully approved.`);
      }
  
      
      res.status(200).json({
        status: "success",
        message: "Job approved successfully",
        data: {
          job: {
            id: job.id,
            company_name: job.company_name,
            isApproved: job.isApproved, 
          },
        },
      });
    } catch (err) {
      
      console.error(`Error approving job ID: ${jobId}`, err);
      next(new AppError("Failed to approve job", 500));
    }
  });
  
exports.disapproveJob = catchAsync(async (req, res, next) => {
    console.log("disapproveJobById function called");
  
    
    const jobId =req.params.id
  
    
    if (isNaN(jobId)) {
      return next(new AppError(`Invalid Job ID. Please provide a valid ID. ${jobId}`, 400));
    }
  
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Attempting to disapprove job ID: ${jobId}`);
    }
  
    
    const job = await Job.findByPk(jobId);
  
    
    if (!job) {
      console.log(`No job found for ID: ${jobId}`);
      return next(new AppError("Job not found.", 404));
    }
  
    try {
      
      await job.update({ isApproved: false });
  
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Job ID: ${jobId} has been successfully approved.`);
      }
  
      
      res.status(200).json({
        status: "success",
        message: "Job approved successfully",
        data: {
          job: {
            id: job.id,
            company_name: job.company_name,
            isApproved: job.isApproved, 
          },
        },
      });
    } catch (err) {
      
      console.error(`Error approving job ID: ${jobId}`, err);
      next(new AppError("Failed to approve job", 500));
    }
  });
  