const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB before starting server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5100;
    app.listen(PORT, () => console.log(`API listening on ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

/* ─────────── middleware ─────────── */
// Configure CORS for production and development environments
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://glow-frontend-lime.vercel.app', 'https://glow-git-main-stanleywebs911.vercel.app']
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
const MongoStore = require('connect-mongo');

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60 // Session TTL (1 day)
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // Cookie max age (1 day)
    }
  })
);

 
/* ─────────── routes ─────────── */
// Import routers and middleware
const youtubeRoutes = require('./routes/youtube'); // Exports { router, oauth2Client }
const socialRoutes = require('./routes/social');     // Exports router directly
const authRoutes = require('./routes/auth');         // Exports { router, auth, tokenStore }
const reflectionRoutes = require('./routes/reflections'); // Exports router directly
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
app.use('/api/reflections', reflectionRoutes); // Route for handling reflection endpoints
app.use('/api/ai',         aiRoutes);         // Assuming direct export
app.use('/api/mentor',     mentorRoutes);     // Assuming direct export
app.use('/api/waitlist', require('./routes/waitlist')); // Handle waitlist submissions

// Start the server
startServer();