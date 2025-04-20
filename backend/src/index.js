const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');
const session = require('express-session');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Module routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reflection', require('./routes/reflection'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/mentor', require('./routes/mentor'));
app.use('/api/social', require('./routes/social'));
app.use('/api/social/youtube', require('./routes/youtube'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});