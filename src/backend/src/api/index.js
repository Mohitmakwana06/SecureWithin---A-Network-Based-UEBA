const express = require('express');
const sendOtpRoute = require('./sendOtp/sendOtp.route');

const router = express.Router();

router.use(sendOtpRoute);

module.exports = router;
