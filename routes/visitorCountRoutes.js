const express = require("express");
const { visitorTrack, visits, decodedProfilePath } = require("./../controllers/visitController.js");

const router = express.Router();

router.post('/track-visit',  visitorTrack)
router.get('/visits', visits)
router.get('profile/:path', decodedProfilePath)

module.exports = router