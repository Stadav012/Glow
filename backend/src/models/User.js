const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  bio: String,
  socialAccounts: {
    youtube: {
      accessToken: String,
      refreshToken: String,
      channelId: String
    },
    instagram: {
      accessToken: String,
      userId: String
    }
  },
  socialContent: {
    youtube: {
      liked: [{
        platform: String,
        id: String,
        title: String,
        channelTitle: String,
        url: String,
        thumbnail: String,
        likedAt: Date,
        stats: {
          views: String,
          likes: String
        }
      }],
      watchHistory: [{
        platform: String,
        id: String,
        title: String,
        channelTitle: String,
        url: String,
        thumbnail: String,
        watchedAt: Date
      }],
      playlists: [{
        id: String,
        title: String
      }]
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);