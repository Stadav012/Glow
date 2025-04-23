const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

/* ─────────── middleware ─────────── */
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

 
/* ─────────── routes ─────────── */
// Import routers and middleware
const youtubeRoutes = require('./routes/youtube'); // Exports { router, oauth2Client }
const socialRoutes = require('./routes/social');     // Exports router directly
const authRoutes = require('./routes/auth');         // Exports { router, auth, tokenStore }
const reflectionRoutes = require('./routes/reflection'); // Assuming direct export
const aiRoutes = require('./routes/ai');             // Assuming direct export
const mentorRoutes = require('./routes/mentor');     // Assuming direct export
app.use('/api/social', require('./routes/socialContent'));

// Use the imported routers
// specific routes FIRST  ⬇️
app.use('/api/social/youtube', youtubeRoutes.router);

// then the more generic /api/social  ⬇️
app.use('/api/social',         socialRoutes); // Correct: exports router directly

// any other feature modules
app.use('/api/auth',       authRoutes.router); // Correct: exports { router, ... }
app.use('/api/reflection', reflectionRoutes); // Assuming direct export
app.use('/api/ai',         aiRoutes);         // Assuming direct export
app.use('/api/mentor',     mentorRoutes);     // Assuming direct export

// /* ─────────── server ─────────── */
const PORT = process.env.PORT || 5100;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));



 
