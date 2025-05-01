const router = require('express').Router();
const mentors = require('./mentorData');

// GET all mentor profiles
router.get('/profiles', (req, res) => {
  console.log('[mentor.profiles] route hit, mentors =', mentors);
  res.json(mentors);
});

// GET matched mentors based on tags
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

// POST recommended mentors based on user's reflections and social content
router.post('/recommended', async (req, res) => {
  try {
    const { reflections, socialContent, userProfile } = req.body;
    
    // Get AI analysis of social content
    let aiTags = [];
    let sentiment = '';
    let contentThemes = [];
    
    try {
      const aiResponse = await fetch('http://localhost:5100/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialContent })
      });
      
      const aiData = await aiResponse.json();
      aiTags = aiData.tags || [];
      sentiment = aiData.sentiment || '';
      contentThemes = aiData.themes || [];
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Continue without AI data if analysis fails
    }
    
    // Extract topics, interests, and background info
    const topics = new Set();
    const interests = new Set();
    const background = {
      location: userProfile?.location || '',
      education: userProfile?.education || [],
      interests: userProfile?.interests || []
    };
    
    // Process reflections
    if (reflections && reflections.length > 0) {
      reflections.forEach(reflection => {
        if (reflection.topics) {
          reflection.topics.forEach(topic => topics.add(topic.toLowerCase()));
        }
        if (reflection.content) {
          const terms = reflection.content.toLowerCase().split(/\W+/);
          terms.forEach(term => {
            if (term.length > 3) interests.add(term);
          });
        }
      });
    }
    
    // Process social content and extract themes
    if (socialContent) {
      Object.values(socialContent).forEach(contentArray => {
        if (Array.isArray(contentArray)) {
          contentArray.forEach(content => {
            if (content.tags) {
              content.tags.forEach(tag => topics.add(tag.toLowerCase()));
            }
            if (content.description) {
              const terms = content.description.toLowerCase().split(/\W+/);
              terms.forEach(term => {
                if (term.length > 3) interests.add(term);
              });
            }
          });
        }
      });
    }
    
    // Add AI-generated tags and themes to topics
    aiTags.forEach(tag => topics.add(tag.toLowerCase()));
    contentThemes.forEach(theme => topics.add(theme.toLowerCase()));
    
    // Match mentors based on extracted topics, interests, background and AI analysis
    const matchedMentors = mentors.map(mentor => {
      let matchScore = 0;
      const matchReasons = [];
      
      // Calculate topic and interest matches
      const mentorTags = mentor.tags.map(tag => tag.toLowerCase());
      const topicMatches = Array.from(topics).filter(topic => 
        mentorTags.includes(topic)
      ).length;

      // Calculate background similarity score
      let backgroundScore = 0;
      if (mentor.location && background.location && 
          mentor.location.toLowerCase() === background.location.toLowerCase()) {
        backgroundScore += 2;
        matchReasons.push('Similar geographical background');
      }
      
      // Compare educational paths
      const educationOverlap = mentor.education?.filter(edu => 
        background.education.some(userEdu => 
          userEdu.field?.toLowerCase() === edu.field?.toLowerCase() ||
          userEdu.school?.toLowerCase() === edu.school?.toLowerCase()
        )
      ).length || 0;
      
      if (educationOverlap > 0) {
        backgroundScore += educationOverlap;
        matchReasons.push('Similar educational pathway');
      }

      // Compare social media interests
      const interestOverlap = mentor.interests?.filter(interest =>
        Array.from(interests).includes(interest.toLowerCase())
      ).length || 0;

      if (interestOverlap > 0) {
        matchScore += interestOverlap;
        matchReasons.push('Shared interests from social media');
      }
      
      // Ensure there's at least a base score if there are any matches
      const baseScore = topicMatches > 0 ? 30 : 0;
      matchScore += baseScore + (topicMatches / Math.max(1, mentor.tags.length)) * 40;
      
      if (topicMatches > 0) {
        matchReasons.push(`Matches ${topicMatches} of your interests and AI-identified topics`);
      }
      
      // Calculate interest matches
      const interestMatches = Array.from(interests).filter(interest =>
        mentor.bio.toLowerCase().includes(interest) ||
        mentor.intro.toLowerCase().includes(interest)
      ).length;
      
      matchScore += (interestMatches / interests.size) * 30;
      
      if (interestMatches > 0) {
        matchReasons.push(`Shares ${interestMatches} common interests based on your content`);
      }
      
      // Add sentiment-based matching
      if (sentiment && mentor.matchCriteria?.sentimentMatch) {
        const sentimentMatch = sentiment.toLowerCase().includes(mentor.matchCriteria.sentimentMatch.toLowerCase());
        if (sentimentMatch) {
          matchScore += 20;
          matchReasons.push('Aligns with your current mindset and goals');
        }
      }
      
      return {
        id: mentor.id,
        name: mentor.name,
        bio: mentor.bio,
        experience: `${mentor.experience} years`,
        expertise: mentor.tags,
        matchScore: Math.round(matchScore),
        matchReasons
      };
    });
    
    // Sort by match score and return top 5
    const recommendedMentors = matchedMentors
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
    
    res.json({
      success: true,
      mentors: recommendedMentors
    });
  } catch (error) {
    console.error('Error in mentor recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentor recommendations'
    });
  }
});

module.exports = router;