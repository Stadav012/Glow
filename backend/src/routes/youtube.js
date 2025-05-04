const router = require('express').Router();
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const User = require('../models/User');
const { auth, tokenStore } = require('./auth');

/* ---------- OAuth client ---------- */
const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
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
        const { data: userInfo } = await oauth2.userinfo.get();
        channelData = { title: userInfo.name, thumbnails: { default: { url: userInfo.picture } } };
      } else {
        throw err;
      }
    }

    const { sessionId } = JSON.parse(Buffer.from(state, 'base64').toString());
    tokenStore.set(sessionId, { tokens, channelData, platform: 'youtube' });

    const frontendUrl = process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth?platform=youtube&status=success&sessionId=${sessionId}`);
  } catch (error) {
    console.error('YouTube OAuth error:', error?.response?.data || error.message);
    const frontendUrl = process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth?platform=youtube&status=error&msg=${encodeURIComponent(error.message)}`);
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
        }
      } catch (channelError) {
        console.error('Error fetching channel ID:', channelError?.response?.data || channelError.message);
      }
    }

    // Initialize socialContent structure if not exists
    if (!req.user.socialContent) {
      req.user.socialContent = { youtube: {} };
    } else if (!req.user.socialContent.youtube) {
      req.user.socialContent.youtube = {};
    }

    const results = { posts: [], likedContent: [] };
    const errors = {};
    const maxResultsPerFetch = 15;

    // 1. Fetch and store liked videos
    try {
      const likedVideosResponse = await youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        myRating: 'like',
        maxResults: maxResultsPerFetch
      });

      const likedVideos = likedVideosResponse.data.items.map(v => ({
        platform: 'youtube',
        id: v.id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        url: `https://youtube.com/watch?v=${v.id}`,
        thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
        likedAt: v.snippet.publishedAt,
        stats: {
          views: v.statistics?.viewCount || '0',
          likes: v.statistics?.likeCount || '0'
        }
      }));

      req.user.socialContent.youtube.liked = likedVideos;
      results.likedContent = likedVideos;
    } catch (error) {
      console.error('Error fetching liked videos:', error?.response?.data || error.message);
      errors.likedContent = 'Could not fetch liked videos.';
    }

    // 2. Fetch and store user's uploaded videos
    if (channelId) {
      try {
        const searchResponse = await youtube.search.list({
          part: 'snippet',
          channelId: channelId,
          order: 'date',
          maxResults: maxResultsPerFetch,
          type: 'video'
        });

        const uploadedVideos = searchResponse.data.items.map(v => ({
          platform: 'youtube',
          id: v.id.videoId,
          title: v.snippet.title,
          description: v.snippet.description,
          url: `https://youtube.com/watch?v=${v.id.videoId}`,
          thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
          publishedAt: v.snippet.publishedAt
        }));

        req.user.socialContent.youtube.posts = uploadedVideos;
        results.posts = uploadedVideos;
      } catch (error) {
        console.error('Error fetching uploaded videos:', error?.response?.data || error.message);
        errors.posts = 'Could not fetch uploaded videos.';
      }
    } else {
      errors.posts = 'Cannot fetch uploads without Channel ID.';
    }

    // Save the updated socialContent
    try {
      await req.user.save();
      console.log('Successfully saved YouTube content to user profile');
    } catch (saveError) {
      console.error('Error saving YouTube content:', saveError);
      errors.save = 'Failed to save YouTube content to profile.';
    }

    // Combine results and errors
    const responseData = { ...results };
    if (Object.keys(errors).length > 0) {
      responseData.errors = errors;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching YouTube content:', error?.response?.data || error.message);
    if (error.response?.status === 401 || error.message.includes('invalid_grant')) {
      return res.status(401).json({ error: 'YouTube authentication failed. Please reconnect your account.' });
    }
    res.status(500).json({ error: 'Failed to fetch YouTube content.' });
  }
});

/* ---------- simple health‑check ---------- */
router.get('/test', (_, res) => res.json({ ok: true }));

module.exports = { router, oauth2Client };