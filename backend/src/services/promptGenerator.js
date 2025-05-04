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

    const prompt = `You are a perceptive media analyst and personal growth coach. Your task is to analyze this person's YouTube activity and generate thought-provoking reflection prompts that help them uncover deeper patterns and meaning in their content consumption.

    USER'S CONTENT PROFILE:
    Recent YouTube Activity:
    ${youtubeDetails.recentTitles.map(v => `- "${v.title}" by ${v.channel}`).join('\n') || 'No YouTube data available'}
    
    Content Creators They Follow:
    ${[...new Set([...youtubeDetails.likedChannels, ...youtubeDetails.watchedChannels])].slice(0, 3).join('\n') || 'No channel data available'}
    
    Their Own Content:
    ${contentSummary || 'No recent posts available'}
    
    Interests & Engagement:
    ${interestsSummary || 'No interests specified'}
    ${engagementPatterns}

    ANALYSIS OBJECTIVES:
    1. Identify recurring themes, topics, or patterns across their watched and liked content
    2. Notice any progression or evolution in their content choices over time
    3. Look for connections between different creators or topics they engage with
    4. Consider how their content choices reflect their aspirations or areas of growth
    5. Analyze the balance between entertainment, education, and personal development in their choices

    PROMPT GENERATION GUIDELINES:
    1. Each prompt must reference specific videos, channels, or patterns from their activity
    2. Focus on uncovering the 'why' behind their content choices rather than just the 'what'
    3. Help them discover connections between seemingly unrelated content they consume
    4. Encourage reflection on how their content choices influence their perspectives and growth
    5. Frame questions that help them examine their content consumption critically and mindfully

    IMPORTANT:
    - Avoid generic questions that could apply to anyone
    - Make direct references to specific content they've engaged with
    - Focus on patterns and themes rather than individual pieces of content
    - Help them discover insights about themselves through their content choices
    - Encourage them to think about the impact of their media consumption on their personal growth

    Generate 3 insightful reflection prompts that help them uncover meaningful patterns and insights about themselves through their content choices.`;

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
      'What patterns do you notice in the content that truly captures your attention?',
      'How do your online interests reflect the future you envision for yourself?',
      'What skills have you naturally developed through your digital activities?'
    ];
    console.log('Returning default prompts due to error:', defaultPrompts);
    return defaultPrompts;
  }
}

module.exports = { generateReflectionPrompts };

module.exports = { generateReflectionPrompts };