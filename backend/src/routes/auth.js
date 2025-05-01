const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Temporary store for OAuth tokens during signup flow
const tokenStore = new Map(); 

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findOne({ _id: decoded.id });
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

/* ---------- REGISTER / LINK ---------- */
router.post('/register', async (req, res) => {
    try {
      const { email, password, fullName, bio, sessionId, platform } = req.body;
      if (!email || !password || !fullName)
        return res.status(400).json({ error: 'Missing required fields' });
  
      /* ── 1. look up user by email (case-insensitive) ───────────────────────────── */
      let user = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
      
      /* ── 2A. if user exists, just link social creds & return JWT ── */
      if (user) {
        if (sessionId && tokenStore.has(sessionId)) {
          try {
            const { tokens, channelData } = tokenStore.get(sessionId);
            
            if (!tokens) {
              return res.status(400).json({ error: 'Invalid social account data' });
            }
            
            if (platform === 'youtube') {
              if (!tokens.access_token || !tokens.refresh_token) {
                return res.status(400).json({ error: 'Invalid YouTube tokens' });
              }
              user.socialAccounts.youtube = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                channelId: channelData?.channelId || channelData?.id || null
              };
            } else if (platform === 'instagram') {
              if (!tokens.access_token || !tokens.user_id) {
                return res.status(400).json({ error: 'Invalid Instagram tokens' });
              }
              user.socialAccounts.instagram = {
                accessToken: tokens.access_token,
                userId: tokens.user_id
              };
            }
            
            await user.save();
            tokenStore.delete(sessionId);
          } catch (socialError) {
            console.error('Social account linking error:', socialError);
            return res.status(400).json({ error: 'Failed to link social account' });
          }
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        return res.status(200).json({ token });
      }
  
      /* ── 2B. no user yet → create one ───────────────────────── */
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ email, password: hashedPassword, fullName, bio });
  
      if (sessionId && tokenStore.has(sessionId)) {
        try {
          const { tokens, channelData } = tokenStore.get(sessionId);
          
          if (!tokens) {
            throw new Error('Invalid social account data');
          }
          
          if (platform === 'youtube') {
            if (!tokens.access_token || !tokens.refresh_token) {
              throw new Error('Invalid YouTube tokens');
            }
            user.socialAccounts.youtube = {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              channelId: channelData?.channelId || channelData?.id || null
            };
          } else if (platform === 'instagram') {
            if (!tokens.access_token || !tokens.user_id) {
              throw new Error('Invalid Instagram tokens');
            }
            user.socialAccounts.instagram = {
              accessToken: tokens.access_token,
              userId: tokens.user_id
            };
          }
          
          tokenStore.delete(sessionId);
        } catch (socialError) {
          console.error('Social account linking error:', socialError);
          throw new Error('Failed to link social account');
        }
      }
  
      await user.save();
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.status(201).json({ token });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message === 'Failed to link social account') {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Error creating user account' });
      }
    }
  });

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Generate token and send response
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        bio: req.user.bio,
        socialAccounts: req.user.socialAccounts
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Update user profile
router.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['fullName', 'bio'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        bio: req.user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Export the router, auth middleware, and tokenStore
module.exports = { router, auth, tokenStore };