const router = require('express').Router();
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const User = require('../models/User'); // Import User model
// Import auth middleware and tokenStore from auth.js
const { auth, tokenStore } = require('./auth');

/* ---------- OAuth client ---------- */
const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5000/api/social/youtube/callback'
);

const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

/* ---------- utils ---------- */
const verifySession = (req, res, next) => {
  if (!req.query.sessionId) return res.status(401).json({ error: 'No sessionId' });
  next();
};

/* ---------- /login ---------- */
router.get('/login', verifySession, (req, res) => {
  const { sessionId } = req.query;
  const state = Buffer.from(JSON.stringify({ sessionId })).toString('base64');
  const scopes = ['https://www.googleapis.com/auth/youtube.readonly', 'profile', 'email'];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent'
  });
  res.redirect(url);
});

/* ---------- /callback ---------- */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let channelData = null;
    try {
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      const { data } = await youtube.channels.list({ part: 'snippet', mine: true });
      channelData = data.items?.[0]?.snippet || null;
    } catch (err) {
      if (err.response?.status === 403 && err.response.data?.error === 'youtubeSignupRequired') {
        // user has no channel; fallback to basic Google profile
        const { data: userInfo } = await oauth2.userinfo.get();
        channelData = { title: userInfo.name, thumbnails: { default: { url: userInfo.picture } } };
      } else {
        throw err;
      }
    }

    const { sessionId } = JSON.parse(Buffer.from(state, 'base64').toString());
    tokenStore.set(sessionId, { tokens, channelData, platform: 'youtube' });

    res.redirect(`http://localhost:5173/auth?platform=youtube&status=success&sessionId=${sessionId}`);
  } catch (error) {
    console.error('YouTube OAuth error:', error?.response?.data || error.message);
    res.redirect(`http://localhost:5173/auth?platform=youtube&status=error&msg=${encodeURIComponent(error.message)}`);
  }
});

/* ---------- Fetch YouTube Content ---------- */
router.get('/content', auth, async (req, res) => {
  try {
    const youtubeAccount = req.user.socialAccounts?.youtube;
    if (!youtubeAccount || !youtubeAccount.accessToken) {
      return res.status(400).json({ error: 'YouTube account not linked or missing credentials.' });
    }

    const client = new OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    client.setCredentials({
      access_token: youtubeAccount.accessToken,
      refresh_token: youtubeAccount.refreshToken,
    });

    client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        console.log('New refresh token received:', tokens.refresh_token);
        req.user.socialAccounts.youtube.refreshToken = tokens.refresh_token;
      }
      console.log('New access token received:', tokens.access_token);
      req.user.socialAccounts.youtube.accessToken = tokens.access_token;
      try {
        await req.user.save();
      } catch (saveError) {
        console.error('Error saving updated tokens:', saveError);
      }
    });

    const youtube = google.youtube({ version: 'v3', auth: client });

    let channelId = youtubeAccount.channelId;
    if (!channelId) {
      try {
        const channelResponse = await youtube.channels.list({ part: 'id', mine: true });
        channelId = channelResponse.data.items?.[0]?.id;
        if (channelId) {
          req.user.socialAccounts.youtube.channelId = channelId;
          await req.user.save();
        } else {
          console.warn('Could not determine YouTube Channel ID for user:', req.user._id);
          // Proceed without channel-specific fetches if ID is unavailable
        }
      } catch (channelError) {
        console.error('Error fetching channel ID:', channelError?.response?.data || channelError.message);
        // Decide how to handle this - maybe return partial data or an error
        // For now, let's try to continue fetching non-channel specific data
      }
    }

    const results = {};
    const maxResultsPerFetch = 15; // Limit results per category

    // 1. Fetch Liked Videos
    try {
      const likedVideosResponse = await youtube.videos.list({
        part: 'snippet,contentDetails,statistics',
        myRating: 'like',
        maxResults: maxResultsPerFetch
      });
      results.likedVideos = likedVideosResponse.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        duration: item.contentDetails?.duration, // Need to parse ISO 8601 duration
        viewCount: item.statistics?.viewCount
      }));
    } catch (error) {
      console.error('Error fetching liked videos:', error?.response?.data || error.message);
      results.likedVideosError = 'Could not fetch liked videos.';
      // Don't fail the whole request, just note the error
    }

    // 2. Fetch User's Playlists
    try {
      const playlistsResponse = await youtube.playlists.list({
        part: 'snippet,contentDetails',
        mine: true,
        maxResults: maxResultsPerFetch
      });
      results.playlists = playlistsResponse.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.default?.url,
        itemCount: item.contentDetails?.itemCount
      }));
    } catch (error) {
      console.error('Error fetching playlists:', error?.response?.data || error.message);
      results.playlistsError = 'Could not fetch playlists.';
    }

    // 3. Fetch User's Uploaded Videos (using search as before, requires channelId)
    if (channelId) {
        try {
            const searchResponse = await youtube.search.list({
                part: 'snippet',
                channelId: channelId,
                order: 'date',
                maxResults: maxResultsPerFetch,
                type: 'video'
            });
            results.uploadedVideos = searchResponse.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                publishedAt: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails?.default?.url,
            }));
        } catch (error) {
            console.error('Error fetching uploaded videos:', error?.response?.data || error.message);
            results.uploadedVideosError = 'Could not fetch uploaded videos.';
        }
    } else {
        results.uploadedVideosError = 'Cannot fetch uploads without Channel ID.';
    }


    res.json(results);

  } catch (error) {
    console.error('Error fetching YouTube content:', error?.response?.data || error.message);
    if (error.response?.status === 401 || error.message.includes('invalid_grant')) {
      // Consider clearing tokens if persistently failing
      // req.user.socialAccounts.youtube = undefined;
      // await req.user.save();
      return res.status(401).json({ error: 'YouTube authentication failed. Please reconnect your account.' });
    }
    res.status(500).json({ error: 'Failed to fetch YouTube content.' });
  }
});

/* ---------- simple health‑check ---------- */
router.get('/test', (_, res) => res.json({ ok: true }));

// Export only the router, as tokenStore is now managed in auth.js
module.exports = { router, oauth2Client };