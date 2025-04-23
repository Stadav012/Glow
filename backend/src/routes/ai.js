const router = require('express').Router();
require('dotenv').config();
const { OpenAI } = require("openai");
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI processing route using latest social media post
router.post('/analyze', async (req, res) => {
  try {
    console.log("Fetching social posts...");

    // const socialResponse = await axios.get('http://localhost:5100/api/social/posts');
    // console.log("Social posts fetched");

    // const posts = socialResponse.data.posts;


    // dummy data for testing
  const posts = [
    {
      platform: "instagram",
      id: "dummy123",
      caption: "Feeling hopeful about the future ✨ #growth #motivation",
      media_type: "IMAGE",
      media_url: "https://example.com/media.jpg",
      permalink: "https://instagram.com/p/dummy123",
      timestamp: "2024-06-02T15:30:00Z",
      stats: { likes: 80, comments: 5 }
    }
  ];


    if (!posts || posts.length === 0) {
      console.log("No social posts found");
      return res.status(404).json({ message: 'No social posts found' });
    }

    const latestPost = posts[0];
    const text = latestPost.caption || latestPost.description || latestPost.title || '';

    if (!text) {
      console.log("No usable text in the latest post");
      return res.status(400).json({ message: 'No text content in the latest social post' });
    }

    console.log("Sending text to OpenAI for sentiment analysis...");

    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Analyze the sentiment of this text: ${text}` },
      ],
    });

    const sentiment = sentimentResponse.choices[0].message.content;

    const tagsResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Generate 5 relevant hashtag-style tags based on this text: ${text}` },
      ],
    });

    const tags = tagsResponse.choices[0].message.content
      .replace(/\n/g, "")
      .split(/[,#]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => (tag.startsWith("#") ? tag : `#${tag}`));

    res.json({
      sentiment,
      tags,
      source: {
        platform: latestPost.platform,
        content: text,
      }
    });

  } catch (error) {
    console.error("Error in analyze route:", error.response?.data || error.message || error);
    res.status(500).json({ message: "Failed to analyze content." });
  }
});

module.exports = router;
