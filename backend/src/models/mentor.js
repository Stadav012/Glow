const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  expertise: [{
    type: String,
    required: true
  }],
  matchCriteria: {
    topics: [String],
    skills: [String],
    interests: [String],
    aiTags: [String],
    sentimentMatch: String
  },
  matchReasons: [{
    type: String,
    default: []
  }],
  availability: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mentor', mentorSchema);