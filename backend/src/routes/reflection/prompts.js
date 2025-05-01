const router = require('express').Router();
const { getYTClient } = require('../../routes/socialContent');
const { generateReflectionPrompts } = require('../../services/promptGenerator');
const { verifySession } = require('../../middleware/auth');

router.get('/personalized', verifySession, async (req, res) => {
  try {
    const user = req.user;
    const youtube = getYTClient(user);

    // Get user's latest video and liked videos in parallel
    const [latestVideo, likedVideos] = await Promise.all([
      youtube.search.list({
        part: 'snippet',
        forMine: true,
        maxResults: 1,
        type: 'video',
        order: 'date'
      }),
      youtube.videos.list({
        part: 'snippet',
        maxResults: 3,
        myRating: 'like'
      })
    ]);

    let content = '';
    if (latestVideo.data.items.length) {
      const video = latestVideo.data.items[0].snippet;
      content = `${video.title} - ${video.description}`;
    }

    // Get liked content even if user hasn't posted
    const likedContent = likedVideos.data.items.map(video => ({
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle
    }));

    const prompts = await generateReflectionPrompts(content, likedContent);
    res.json({ prompts });
  } catch (error) {
    console.error('Error fetching personalized prompts:', error);
    res.status(500).json({
      error: 'Failed to generate personalized prompts',
      prompts: [
        'What inspired you today?',
        'What challenges did you face?',
        'What are you grateful for?'
      ]
    });
  }
});

module.exports = router;