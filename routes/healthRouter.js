const express = require("express");
const { getHealthArticles, getHealthArticleById } = require("./../controllers/healthController")
const router = express.Router();


router.get("/health-articles", getHealthArticles)
router.get("/health-articles/:id", getHealthArticleById)

module.exports = router;
