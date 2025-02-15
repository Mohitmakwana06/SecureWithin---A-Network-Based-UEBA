const nodemailer = require('nodemailer');
const crypto = require('crypto');
const emailConfig = require('../../config/email.config');

const transporter = nodemailer.createTransport(emailConfig);

const sendOtpEmail = async (email) => {
  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP

  const mailOptions = {
    from: emailConfig.auth.user,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP sent to ${email}: ${otp}`);
};

module.exports = { sendOtpEmail };
