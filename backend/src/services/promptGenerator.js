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

    const prompt = `Yo! You're a super chill Gen Z content vibe checker and growth hype person! Your mission? Check out this person's YouTube game and drop some fun but lowkey deep questions that'll help them understand their content choices better. Keep it real, relatable, and maybe throw in some trending references when it fits the vibe!

    THE VIBE CHECK 🎮:
    Recent Watch History:
    ${youtubeDetails.recentTitles.map(v => `- "${v.title}" by ${v.channel}`).join('\n') || 'No YouTube data yet'}
    
    Content Creators in Their Circle:
    ${[...new Set([...youtubeDetails.likedChannels, ...youtubeDetails.watchedChannels])].slice(0, 3).join('\n') || 'Still building the squad'}
    
    Their Content Energy:
    ${contentSummary || 'No posts yet - and that's cool too!'}
    
    What They're Into:
    ${interestsSummary || 'Still exploring'}
    ${engagementPatterns}

    THE MISSION 🎯:
    1. Spot the main character energy in their content choices
    2. Notice how their taste has evolved (like a Pokemon, but make it content)
    3. Find the hidden connections between different creators (it's giving multiverse vibes)
    4. See how their watch history matches their future goals
    5. Check if they're balancing entertainment with that growth mindset

    HOW TO KEEP IT REAL:
    1. Reference specific videos/channels they actually watch (no cap)
    2. Make it feel like a TikTok comment section convo, but make it meaningful
    3. Help them connect dots between different content they're into
    4. Show how their content choices shape their main character development
    5. Keep questions short, sweet, and lowkey thought-provoking

    VIBE CHECK RULES:
    - No basic questions that could be about literally anyone
    - Keep it specific to their actual content
    - Focus on the bigger picture, not just single videos
    - Help them understand their content personality
    - Make them think about how their watch time shapes their character arc

    Drop 3 reflection prompts that are giving main character energy but also help them understand their content choices better. Make it feel like a friend asking questions in the group chat - casual but meaningful!`;

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
      'ngl, what type of content has you hitting that like button faster than your morning alarm? 👀',
      'your watch history is giving main character energy - what future plot twist are you manifesting? ✨',
      'spill the tea on the skills you've lowkey picked up from your fav content creators! 💅'
    ];
    console.log('Returning default prompts due to error:', defaultPrompts);
    return defaultPrompts;
  }
}

module.exports = { generateReflectionPrompts };

module.exports = { generateReflectionPrompts };