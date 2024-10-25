const express = require('express');
const { protect } = require("./../controllers/authController")

const {createPaypalOrder, capturePaypalOrder, createSubscription } = require('./../controllers/paymentController');

const router = express.Router();

router.post('/create-paypal-order', createPaypalOrder);
router.post('/capture-paypal-order', capturePaypalOrder);
router.post('/create-subscription', protect, createSubscription);

module.exports = router;