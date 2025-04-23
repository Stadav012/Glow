const express = require('express');
const router = express.Router();
const Reflection = require('../models/Reflection');
const auth = require('../middleware/auth');

// Create a new reflection
router.post('/', auth, async (req, res) => {
  try {
    const { mood, content, prompt } = req.body;
    
    if (!mood || !content || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reflection = new Reflection({
      userId: req.user._id,
      mood,
      content,
      prompt
    });

    await reflection.save();
    res.status(201).json(reflection);
  } catch (error) {
    console.error('Reflection creation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error while creating reflection' });
  }
});

// Get all reflections for a user
router.get('/', auth, async (req, res) => {
  try {
    const reflections = await Reflection.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(reflections);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reflections' });
  }
});

// Get a specific reflection
router.get('/:id', auth, async (req, res) => {
  try {
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }
    
    res.json(reflection);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reflection' });
  }
});

// Update a reflection
router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['mood', 'content', 'prompt'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

    updates.forEach(update => reflection[update] = req.body[update]);
    await reflection.save();
    res.json(reflection);
  } catch (error) {
    res.status(500).json({ error: 'Error updating reflection' });
  }
});

// Delete a reflection
router.delete('/:id', auth, async (req, res) => {
  try {
    const reflection = await Reflection.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!reflection) {
      return res.status(404).json({ error: 'Reflection not found' });
    }

    res.json(reflection);
  } catch (error) {
    res.status(500).json({ error: 'Error deleting reflection' });
  }
});

module.exports = router;