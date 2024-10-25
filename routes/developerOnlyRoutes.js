const express = require('express');
const { getAllComments } = require("./../controllers/developerOnlyController")
const router = express.Router();

router.get("/comments", getAllComments)

module.exports = router;