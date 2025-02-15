require('dotenv').config();

const envConfig = {
  port: process.env.PORT || 5000,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
};

module.exports = envConfig;
