const express = require('express');
const { addFavorite, getAllFavorite, removeFavorite } = require('../controllers/favoriteController');

const router = express.Router();

router.post("/addFavorite", addFavorite);
router.get("/:id/:categories", getAllFavorite);
router.delete("/:cardId/:categories", removeFavorite);
module.exports = router;