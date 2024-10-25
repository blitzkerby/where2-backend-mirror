const express = require("express");
const { addAccommodation, getOneAccommdocation, deleteAccommodation, updateAccommodation } = require("../controllers/accommodationController");
const { mod } = require("@tensorflow/tfjs");
const router = express.Router();

router.post("/addAccommodation", addAccommodation);
router.get("/:id", getOneAccommdocation);
router.delete("/deleteAccommodaiton/:id", deleteAccommodation);
router.patch("/updateAccommodation?:id", updateAccommodation);

module.exports = router;