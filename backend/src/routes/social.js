const router = require('express').Router();
const axios = require('axios');
const querystring = require('querystring');

// In-memory token store (replace with database in production)
const tokenStore = new Map();

// Middleware to verify user session
const verifySession = (req, res, next) => {
  const sessionId = req.query.sessionId || req.body.sessionId;
  if (!sessionId) {
    console.log('No session ID provided');
    return res.status(401).json({ error: 'No session ID provided' });
  }
  next();
};

// --- Instagram OAuth ---
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:5000/api/social/instagram/callback';

router.get('/instagram/login', (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authUrl);
});

router.get('/instagram/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', querystring.stringify({
      client_id: INSTAGRAM_CLIENT_ID,
      client_secret: INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code
    }));
    // Store tokenRes.data.access_token securely (e.g., in DB/session)
    res.json({ access_token: tokenRes.data.access_token, user_id: tokenRes.data.user_id });
  } catch (err) {
    res.status(500).json({ error: 'Instagram OAuth failed', details: err.message });
  }
});

// --- YouTube OAuth ---
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/api/social/youtube/callback';

// Ensure OAuth credentials are properly loaded
if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
  console.error('YouTube OAuth credentials are not properly configured in .env file');
}

// Remove duplicate YouTube routes as they are now handled in youtube.js


router.get('/youtube/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });
  if (!state) return res.status(400).json({ error: 'Missing state parameter' });

  try {
    const { sessionId } = JSON.parse(Buffer.from(state, 'base64').toString());
    console.log('YouTube /youtube/callback route hit. Session ID:', sessionId);

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
      code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    // Store tokens securely
    tokenStore.set(sessionId, {
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      platform: 'youtube'
    });

    // Redirect back to frontend with success status
    res.redirect(`http://localhost:5173/auth?platform=youtube&status=success&sessionId=${sessionId}`);
  } catch (err) {
    console.error('YouTube OAuth failed:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'YouTube OAuth failed', details: err.message });
  }
});

// --- Fetch Social Content --- 

// Placeholder function to get stored tokens for a user
// In a real app, this would fetch from a database based on the logged-in user
const getStoredTokens = (userId) => {
  // Replace with actual token retrieval logic
  console.log(`Fetching tokens for user ${userId}...`); 
  // Example: return { youtubeAccessToken: '...', instagramAccessToken: '...' };
  return null; 
};

// GET /api/social/posts
router.get('/posts', async (req, res) => {
  // TODO: Get authenticated user ID (e.g., from req.user if using passport)
  const userId = 'placeholder_user_id'; // Replace with actual user ID retrieval
  const tokens = getStoredTokens(userId);

  if (!tokens) {
    return res.status(401).json({ error: 'User not authenticated or tokens not found' });
  }

  try {
    let allPosts = [];
    // Fetch YouTube posts (e.g., video uploads)
    if (tokens.youtubeAccessToken) {
      // TODO: Implement YouTube API call to fetch user's videos/posts
      // Example using googleapis:
      // const { google } = require('googleapis');
      // const youtube = google.youtube({ version: 'v3', auth: your_oauth2_client });
      // const ytPosts = await youtube.search.list({...});
      console.log('Fetching YouTube posts...');
      // allPosts.push(... map ytPosts.data.items to desired format);
    }

    // Fetch Instagram posts
    if (tokens.instagramAccessToken) {
      // TODO: Implement Instagram Graph API call to fetch user's media
      // Example using axios:
      // const igRes = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${tokens.instagramAccessToken}`);
      console.log('Fetching Instagram posts...');
      // allPosts.push(... map igRes.data.data to desired format);
    }

    res.json({ posts: allPosts });
  } catch (error) {
    console.error('Error fetching social posts:', error);
    res.status(500).json({ error: 'Failed to fetch social posts', details: error.message });
  }
});

// GET /api/social/liked-content
router.get('/liked-content', async (req, res) => {
  // TODO: Get authenticated user ID
  const userId = 'placeholder_user_id'; // Replace with actual user ID retrieval
  const tokens = getStoredTokens(userId);

  if (!tokens) {
    return res.status(401).json({ error: 'User not authenticated or tokens not found' });
  }

  try {
    let likedContent = [];
    // Fetch YouTube liked videos
    if (tokens.youtubeAccessToken) {
      // TODO: Implement YouTube API call to fetch liked videos
      // Requires 'https://www.googleapis.com/auth/youtube.readonly' scope
      // Example using googleapis:
      // const { google } = require('googleapis');
      // const youtube = google.youtube({ version: 'v3', auth: your_oauth2_client });
      // const likedVideos = await youtube.videos.list({ part: 'snippet,contentDetails,statistics', myRating: 'like' });
      console.log('Fetching YouTube liked videos...');
      // likedContent.push(... map likedVideos.data.items to desired format);
    }

    // Fetch Instagram liked posts (Note: Instagram API does not directly expose liked posts of others or easily list all liked posts by the user)
    // This might require alternative approaches or might not be feasible depending on API limitations.
    if (tokens.instagramAccessToken) {
      console.log('Fetching Instagram liked content (Note: API limitations apply)...');
      // Instagram API doesn't provide a direct endpoint for liked posts.
    }

    res.json({ likedContent: likedContent });
  } catch (error) {
    console.error('Error fetching liked social content:', error);
    res.status(500).json({ error: 'Failed to fetch liked social content', details: error.message });
  }
});


// --- Test Route for Backend Reachability ---
router.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Social route is reachable.' });
});

module.exports = router;