const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define waitlist schema
const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  position: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

// POST /api/waitlist - Add email to waitlist
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return res.status(200).json({ 
        position: existingEntry.position,
        message: 'Email already registered'
      });
    }

    // Get current count for position and add artificial demand
    const count = await Waitlist.countDocuments();
    const artificialDemand = 15;
    
    // Create new waitlist entry with position starting from artificial demand
    const waitlistEntry = new Waitlist({
      email,
      position: count + artificialDemand
    });

    await waitlistEntry.save();

    res.status(201).json({
      position: waitlistEntry.position,
      message: 'Successfully joined waitlist'
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;