const router = require('express').Router();

// Mentor matching routes placeholder
router.get('/profiles', (req, res) => {
  res.json({ message: 'Get mentor profiles endpoint' });
});

router.post('/match', (req, res) => {
  res.json({ message: 'Match mentor endpoint' });
});

module.exports = router;