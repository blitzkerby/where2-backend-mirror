const express = require("express");

const { summarize } = require("./../controllers/openAiController");
const router = express.Router();

router.post("/summary", summarize);

module.exports = router;
