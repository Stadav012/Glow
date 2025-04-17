const router = require('express').Router();

// Reflection routes placeholder
router.post('/entry', (req, res) => {
  res.json({ message: 'Create reflection entry endpoint' });
});

router.get('/prompts', (req, res) => {
  res.json({ message: 'Get daily prompts endpoint' });
});

module.exports = router;