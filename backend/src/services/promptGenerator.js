const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReflectionPrompts(socialData) {
  try {
    // Validate input data structure
    if (!socialData || typeof socialData !== 'object') {
      console.warn('Invalid socialData format received:', socialData);
      throw new Error('Invalid social data format');
    }

    // Log sanitized version of social data for debugging
    const sanitizedData = {
      hasYoutube: !!socialData.youtube,
      youtubeDataTypes: socialData.youtube ? Object.keys(socialData.youtube) : [],
      contentCount: Array.isArray(socialData.recentContent) ? socialData.recentContent.length : 0,
      interestsCount: Array.isArray(socialData.interests) ? socialData.interests.length : 0,
      hasEngagement: !!socialData.engagement
    };
    console.log('Processing social data with structure:', sanitizedData);
    
    // Log detailed YouTube data for debugging
    if (socialData.youtube) {
      console.log('YouTube Data Structure:', {
        likedVideos: socialData.youtube.liked?.length || 0,
        watchHistory: socialData.youtube.watchHistory?.length || 0,
        playlists: socialData.youtube.playlists?.length || 0
      });
    }
    
    const { youtube = {}, recentContent = [], interests = [], engagement = {} } = socialData;

    // Extract and validate YouTube activity details
    // Randomly select and filter recent YouTube activity
    const getRandomItems = (arr, count) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const youtubeActivity = {
      liked: Array.isArray(youtube.liked) 
        ? getRandomItems(
            youtube.liked.filter(video => video && typeof video === 'object' && video.title && video.channelTitle)
            .slice(-20), // Only consider last 20 liked videos
            3
          ) : [],
      watched: Array.isArray(youtube.watchHistory)
        ? getRandomItems(
            youtube.watchHistory.filter(video => video && typeof video === 'object' && video.title && video.channelTitle)
            .slice(-20), // Only consider last 20 watched videos
            3
          ) : [],
      playlists: Array.isArray(youtube.playlists)
        ? getRandomItems(
            youtube.playlists.filter(playlist => playlist && typeof playlist === 'object' && playlist.title),
            2
          ) : []
    };

    // Log validation results
    console.log('Validated YouTube activity counts:', {
      liked: youtubeActivity.liked.length,
      watched: youtubeActivity.watched.length,
      playlists: youtubeActivity.playlists.length
    });

    // Create YouTube activity summary
    const youtubeSummary = [
      youtubeActivity.liked.slice(0, 3).map(video => `Liked: ${video.title}`).join('\n'),
      youtubeActivity.watched.slice(0, 3).map(video => `Watched: ${video.title}`).join('\n'),
      youtubeActivity.playlists.slice(0, 2).map(playlist => `Playlist: ${playlist.title}`).join('\n')
    ].filter(Boolean).join('\n');

    // Analyze social content patterns with validation
    const contentSummary = Array.isArray(recentContent) 
      ? recentContent
        .slice(0, 5)
        .map(post => post?.content || post?.title || '')
        .join('\n')
      : '';

    const interestsSummary = Array.isArray(interests) ? interests.join(', ') : '';
    
    // Analyze engagement patterns
    const engagementPatterns = engagement ? Object.entries(engagement)
      .map(([type, value]) => `${type}: ${value}`)
      .join('\n') : 'No engagement data';

    // Extract channel names and video details for more specific prompts
    const youtubeDetails = {
      likedChannels: youtubeActivity.liked.map(video => video.channelTitle || '').filter(Boolean),
      watchedChannels: youtubeActivity.watched.map(video => video.channelTitle || '').filter(Boolean),
      recentTitles: [...youtubeActivity.liked, ...youtubeActivity.watched]
        .slice(0, 5)
        .map(video => ({ title: video.title, channel: video.channelTitle }))
        .filter(v => v.title && v.channel)
    };

    // Only proceed with YouTube-specific prompts if we have valid activity
    const hasValidYoutubeActivity = youtubeActivity.liked.length > 0 || youtubeActivity.watched.length > 0;

    const prompt = `You're a perceptive teen mentor who understands digital culture. Create personalized reflection prompts that help teens discover meaningful insights about themselves through their content choices.

    USER'S CONTENT PROFILE:
    Recent Favorites:
    ${youtubeDetails.recentTitles.map(v => `- "${v.title}" by ${v.channel}`).join('\n') || 'Building their content profile'}
    
    Top Creators:
    ${[...new Set([...youtubeDetails.likedChannels, ...youtubeDetails.watchedChannels])].slice(0, 3).join('\n') || 'Exploring new creators'}
    
    Content Interactions:
    ${contentSummary || 'Starting their journey'}
    
    Interests & Engagement:
    ${interestsSummary || 'Discovering interests'}
    ${engagementPatterns}

    PROMPT CREATION GUIDELINES:
    1. Pattern Recognition:
    - Identify recurring themes in their watched content
    - Notice shifts in interests over time
    - Connect dots between different content types
    - Highlight unique content combinations
    
    2. Personal Growth Lens:
    - Link content choices to potential interests/skills
    - Explore how content influences perspectives
    - Uncover learning patterns in entertainment choices
    - Consider content's role in their aspirations
    
    3. Engagement Style:
    - Reference specific videos/creators they enjoy
    - Frame questions around their actual viewing habits
    - Use casual but thoughtful language
    - Keep prompts concise and focused
    
    4. Depth Requirements:
    - Move beyond surface-level reactions
    - Encourage genuine self-reflection
    - Avoid generic or obvious questions
    - Make connections to real-life impact

    Create 3 reflection prompts that:
    - Directly reference their specific content choices
    - Encourage meaningful pattern recognition
    - Feel personally relevant and engaging
    - Lead to genuine insights about themselves
    - Maintain a casual, approachable tone

    Format each prompt as a single, clear question that sparks genuine reflection while staying conversational.`;

    // Log detailed prompt data for debugging
    console.log('YouTube Activity being sent to OpenAI:', {
      selectedLikedVideos: youtubeActivity.liked.map(v => ({ title: v.title, channel: v.channelTitle })),
      selectedWatchedVideos: youtubeActivity.watched.map(v => ({ title: v.title, channel: v.channelTitle })),
      selectedPlaylists: youtubeActivity.playlists.map(p => ({ title: p.title })),
      hasValidYoutubeActivity,
      totalVideosProcessed: youtubeActivity.liked.length + youtubeActivity.watched.length
    });
    
    console.log('Sending prompt to OpenAI:', prompt);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 200,
      temperature: 0.9, // Increased temperature for more creative and varied responses
      n: 1
    });

    console.log('Received response from OpenAI:', response.choices[0].message.content);

    // Process and randomize the generated prompts
    let generatedPrompts = response.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 4); // Get up to 4 prompts for more variety

    // Randomly select 3 prompts from the generated ones
    generatedPrompts = getRandomItems(generatedPrompts, 3);

    if (!generatedPrompts.length) {
      throw new Error('No prompts were generated from the OpenAI response');
    }

    console.log('Successfully generated prompts:', generatedPrompts);
    return generatedPrompts;
  } catch (error) {
    console.error('Error generating prompts:', error);
    // Return default prompts focused on academic redirection
    const defaultPrompts = [
      'What kind of videos make you hit that like button without even thinking? 🔥',
      'If your YouTube feed could predict your future, what would it say about your dreams? ✨',
      'What secret skills have you picked up just from watching your fave content? 💪'
    ];
    console.log('Returning default prompts due to error:', defaultPrompts);
    return defaultPrompts;
  }
}

module.exports = { generateReflectionPrompts };

module.exports = { generateReflectionPrompts };