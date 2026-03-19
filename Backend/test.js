require('dotenv').config();
const { env } = require('./dist/config/env.js');
console.log("URL IS:", env.FRONTEND_URL);
