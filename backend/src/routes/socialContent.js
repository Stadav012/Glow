const router = require('express').Router();
const { google } = require('googleapis');
const User = require('../models/User');
const jwt  = require('jsonwebtoken');

/* ───────── helper: JWT auth ───────── */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

/* ───────── helper: return an authorised google api client ───────── */
const getYTClient = (user) => {
  if (!user.socialAccounts?.youtube?.refreshToken)
    throw new Error('YouTube not linked');

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: user.socialAccounts.youtube.refreshToken
  });
  return google.youtube({ version: 'v3', auth: oauth2Client });
};

/* ────────────────────────────────────────────────────────────────── */
/*  GET /api/social/posts                                            */
/* ────────────────────────────────────────────────────────────────── */
router.get('/posts', auth, async (req, res) => {
  try {
    const yt = getYTClient(req.user);

    /* last 10 uploads from the user’s channel */
    const uploads = await yt.search.list({
      part: 'snippet',
      maxResults: 10,
      forMine: true,
      type: 'video',
      order: 'date'
    });

    const posts = uploads.data.items.map((v) => ({
      platform: 'youtube',
      id: v.id.videoId,
      title: v.snippet.title,
      description: v.snippet.description,
      url: `https://youtube.com/watch?v=${v.id.videoId}`,
      thumbnail: v.snippet.thumbnails?.high?.url,
      publishedAt: v.snippet.publishedAt,
      stats: {}                                  // you can enrich with videos.list if needed
    }));

    // TODO: push instagram / tiktok posts here when APIs are ready
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/* ────────────────────────────────────────────────────────────────── */
/*  GET /api/social/liked-content                                    */
/* ────────────────────────────────────────────────────────────────── */
router.get('/liked-content', auth, async (req, res) => {
  try {
    const yt = getYTClient(req.user);

    const liked = await yt.videos.list({
      part: 'snippet,statistics',
      maxResults: 10,
      myRating: 'like'
    });

    const likedContent = liked.data.items.map((v) => ({
      platform: 'youtube',
      id: v.id,
      title: v.snippet.title,
      channelTitle: v.snippet.channelTitle,
      url: `https://youtube.com/watch?v=${v.id}`,
      thumbnail: v.snippet.thumbnails?.high?.url,
      likedAt: v.snippet.publishedAt // YouTube doesn’t expose like‑time
    }));

    res.json({ likedContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch liked content' });
  }
});

/* ────────────────────────────────────────────────────────────────── */
/*  GET /api/social/posts/:id                                        */
/* ────────────────────────────────────────────────────────────────── */
router.get('/posts/:id', auth, async (req, res) => {
  try {
    const yt = getYTClient(req.user);
    const { id } = req.params;

    const vid = await yt.videos.list({
      part: 'snippet,statistics,contentDetails',
      id
    });
    if (!vid.data.items.length)
      return res.status(404).json({ error: 'Not found' });

    const v = vid.data.items[0];
    res.json({
      id: v.id,
      platform: 'youtube',
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail: v.snippet.thumbnails?.high?.url,
      timestamp: v.snippet.publishedAt,
      engagement: {
        views: v.statistics.viewCount,
        likes: v.statistics.likeCount,
        comments: v.statistics.commentCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/* ────────────────────────────────────────────────────────────────── */
/*  GET /api/social/liked-posts  (alias of liked-content)            */
/* ────────────────────────────────────────────────────────────────── */
router.get('/liked-posts', (req, res) => {
  res.redirect('/api/social/liked-content');
});

/* ────────────────────────────────────────────────────────────────── */
/*  POST /api/social/posts  (placeholder)                            */
/* ────────────────────────────────────────────────────────────────── */
router.post('/posts', auth, async (req, res) => {
  // Implement create‑video logic if you really need it (requires upload scope)
  res.status(501).json({ error: 'Creating posts not implemented yet' });
});

module.exports = router;
