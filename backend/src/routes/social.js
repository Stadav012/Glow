/**
 * routes/social.js
 *
 * Generic social‑media endpoints that are NOT YouTube.
 * (YouTube lives exclusively in routes/youtube.js to avoid route collisions.)
 */

const router = require('express').Router();
const axios  = require('axios');
const qs     = require('querystring');

/* ───────────────────────── Instagram OAuth ───────────────────────── */

const INSTAGRAM_CLIENT_ID     = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI  =
  process.env.INSTAGRAM_REDIRECT_URI ||
  'http://localhost:5000/api/social/instagram/callback';

/* step 1: redirect user to Instagram consent */
router.get('/instagram/login', (req, res) => {
  const url =
    `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
    `&scope=user_profile,user_media&response_type=code`;
  res.redirect(url);
});

/* step 2: Instagram sends us an auth code */
router.get('/instagram/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing "code"' });

  try {
    const tokenRes = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      qs.stringify({
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code
      })
    );
    /* TODO → persist tokenRes.data.access_token in DB */
    res.json(tokenRes.data); // { access_token, user_id, expires_in, ... }
  } catch (err) {
    console.error('Instagram OAuth error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Instagram OAuth failed' });
  }
});

/* ───────────────────────── Misc helper routes ───────────────────────── */

/* Simple reachability test */
router.get('/test', (_, res) => res.json({ ok: true }));

module.exports = router;
