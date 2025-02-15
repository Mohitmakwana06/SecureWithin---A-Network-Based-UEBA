const cors = require('cors');

const corsOptions = {
  origin: '*', // Allow all origins. Replace '*' with specific origin(s) if needed, e.g., 'http://localhost:3000'
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

module.exports = cors(corsOptions);
