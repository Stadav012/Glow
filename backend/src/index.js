const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Module routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reflection', require('./routes/reflection'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/mentor', require('./routes/mentor'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});