const router = require('express').Router();

// Importing the demo mentor data
const mentors = require('./mentorData'); 

// GET all mentor profiles
router.get('/profiles', (req, res) => {
  console.log('[mentor.profiles] route hit, mentors =', mentors);
  res.json(mentors);
});

// GET matched mentors based on tags (e.g., /match?tags=AI,Python)
router.get('/match', (req, res) => {
  const { tags } = req.query;
  if (!tags) {
    return res.status(400).json({ error: 'Tags query param is required, e.g., ?tags=AI,Design' });
  }

  const userTags = tags.split(',').map(t => t.trim().toLowerCase());

  const matched = mentors.filter(mentor =>
    mentor.tags.some(tag => userTags.includes(tag.toLowerCase()))
  );

  res.json(matched);
});

// // Mentor matching routes placeholder
// router.get('/profiles', (req, res) => {
//   res.json({ message: 'Get mentor profiles endpoint' });
// });

// router.post('/match', (req, res) => {
//   res.json({ message: 'Match mentor endpoint' });
// });

module.exports = router;