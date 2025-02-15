const express = require('express');
const { sendOtp } = require('./sendOtp.controller');

const router = express.Router();

router.post('/send-otp', sendOtp);

module.exports = router;
