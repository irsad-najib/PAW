const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');

router.post('/create-transaction', paymentController.createTransaction);
router.post('/notification', paymentController.notificationHandler);

module.exports = router;