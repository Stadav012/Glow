const express = require('express');
const router = express.Router();

// Mock data for demonstration
const mentors = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    expertise: ['AI/ML', 'Data Science', 'Tech Leadership'],
    experience: '15+ years',
    bio: 'Former Google AI researcher with focus on machine learning applications',
    matchScore: 95,
    matchReasons: [
      'Strong alignment with your interest in AI technology',
      'Matches your career growth aspirations',
      'Similar background in tech innovation'
    ]
  },
  {
    id: 2,
    name: 'James Tsenesa',
    expertise: ['Social Media Marketing', 'Content Strategy', 'Brand Building'],
    experience: '10+ years',
    bio: 'Digital marketing expert and social media consultant for major brands',
    matchScore: 88,
    matchReasons: [
      'Expertise in social media content strategy',
      'Strong track record in brand development',
      'Aligns with your content creation interests'
    ]
  },
  {
    id: 3,
    name: 'Stanley Ndlovu',
    expertise: ['Personal Development', 'Career Coaching', 'Leadership'],
    experience: '12+ years',
    bio: 'Executive coach with focus on tech industry professionals',
    matchScore: 85,
    matchReasons: [
      'Specializes in tech career development',
      'Matches your leadership aspirations',
      'Experience in personal growth coaching'
    ]
  }
];

// Get recommended mentors based on user profile and AI analysis
router.get('/recommended', async (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Fetch user's social media data
    // 2. Get AI analysis results
    // 3. Match with mentor profiles
    // 4. Calculate compatibility scores
    
    res.json({
      success: true,
      mentors: mentors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentor recommendations'
    });
  }
});

// Get specific mentor details
router.get('/:id', async (req, res) => {
  try {
    const mentor = mentors.find(m => m.id === parseInt(req.params.id));
    if (!mentor) {
      return res.status(404).json({
        success: false,
        error: 'Mentor not found'
      });
    }
    res.json({
      success: true,
      mentor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentor details'
    });
  }
});

module.exports = router;