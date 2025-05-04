const express = require('express');
const router = express.Router();
const Reflection = require('../models/Reflection');
const auth = require('../middleware/auth');
const { generateReflectionPrompts } = require('../services/promptGenerator');
const User = require('../models/User');

// Get personalized prompts
router.get('/prompts/personalized', auth, async (req, res) => {
  try {
    // Get user's complete social data from the database
    const user = await User.findById(req.user._id).select('youtubeData socialContent');
    
    if (!user) {
      console.log('User not found, returning default prompts');
      return res.json({
        prompts: [
          'What inspired you today?',
          'What challenges did you face?',
          'What are you grateful for?'
        ]
      });
    }

    // Prepare social data object for prompt generation with structured YouTube data
    const socialData = {
      youtube: {
        liked: user.socialContent?.likedContent?.filter(content => content.platform === 'youtube') || [],
        watchHistory: user.socialContent?.posts?.filter(post => post.platform === 'youtube') || [],
        playlists: [] // Reserved for future playlist integration
      },
      recentContent: user.socialContent?.posts || [],
      interests: user.socialContent?.interests || [],
      engagement: user.socialContent?.engagement || {}
    };

    console.log('Collected social data for prompt generation:', socialData);

    // Generate personalized prompts based on user's social data
    const personalizedPrompts = await generateReflectionPrompts(socialData);
    console.log('Generated personalized prompts:', personalizedPrompts);
    res.json({ prompts: personalizedPrompts });
  } catch (error) {
    console.error('Error generating personalized prompts:', error);
    res.status(500).json({
      prompts: [
        'What inspired you today?',
        'What challenges did you face?',
        'What are you grateful for?'
      ]
    });
  }
});

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