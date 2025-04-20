const router = require('express').Router();

// Test endpoint for YouTube route - no auth required
router.get('/test', (req, res) => {
  res.json({ message: 'YouTube route is working!' });
});

const { google } = require('googleapis');
const { OAuth2 } = google.auth;

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/api/social/youtube/callback'
);

// Store tokens temporarily (use a database in production)
const tokenStore = new Map();

// Verify session middleware
const verifySession = (req, res, next) => {
  const sessionId = req.query.sessionId || req.body.sessionId;
  if (!sessionId) {
    console.log('No session ID provided');
    return res.status(401).json({ error: 'No session ID provided' });
  }
  next();
};

// YouTube OAuth login route
router.get('/login', verifySession, (req, res) => {
  try {
    const { sessionId } = req.query;

    // Generate state parameter with session ID
    const state = Buffer.from(JSON.stringify({ sessionId })).toString('base64');

    // Generate OAuth URL with proper scopes
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'profile',
      'email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent'
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('YouTube OAuth initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize YouTube OAuth' });
  }
});

// Handle YouTube OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error: authError } = req.query;
  
  if (authError) {
    console.error('Auth error from Google:', authError);
    return res.redirect(`http://localhost:5173/auth?platform=youtube&status=error&message=${encodeURIComponent(authError)}`);
  }

  if (!code || !state) {
    console.error('Missing code or state in callback');
    return res.redirect(`http://localhost:5173/auth?platform=youtube&status=error&message=Invalid callback parameters`);
  }

  try {
    // Get tokens from YouTube
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Initialize YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    try {
      // Get channel info
      const response = await youtube.channels.list({
        part: 'snippet',
        mine: true
      });

      const channelData = response.data.items[0].snippet;
      
      // Store tokens and channel data
      const { sessionId } = JSON.parse(Buffer.from(state, 'base64').toString());
      tokenStore.set(sessionId, {
        tokens,
        channelData,
        platform: 'youtube'
      });

      // Redirect back to frontend
      res.redirect(`http://localhost:5173/auth?platform=youtube&status=success&sessionId=${sessionId}`);
    } catch (apiError) {
      console.error('YouTube API error:', apiError);
      
      // Check for specific error types
      if (apiError.code === 403) {
        if (apiError.message.includes('accessNotConfigured')) {
          return res.redirect(`http://localhost:5173/auth?platform=youtube&status=error&message=YouTube API not enabled`);
        } else if (apiError.message.includes('youtubeSignupRequired')) {
          // Fall back to using Google User Info API
          const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
          const userInfo = await oauth2.userinfo.get();
          
          const { sessionId } = JSON.parse(Buffer.from(state, 'base64').toString());
          tokenStore.set(sessionId, {
            tokens,
            userData: userInfo.data,
            platform: 'youtube'
          });
          
          return res.redirect(`http://localhost:5173/auth?platform=youtube&status=success&sessionId=${sessionId}`);
        }
      }
      
      throw apiError; // Re-throw if not handled
    }
  } catch (error) {
    console.error('YouTube OAuth error:', error);
    res.redirect(`http://localhost:5173/auth?platform=youtube&status=error&message=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;