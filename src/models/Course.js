const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  bannerUrl: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  enrolledUsers: {
    type: Number,
    default: 0
  },
  units: [{
    name: String,
    order: Number,
    lessons: [{
      name: String,
      order: Number,
      videoUrl: String,
      description: String,
      attachments: [{
        name: String,
        url: String
      }]
    }]
  }],
  comments: [{
    author: String,
    title: String,
    content: String,
    date: {
      type: Date,
      default: Date.now
    },
    likes: {
      type: Number,
      default: 0
    },
    dislikes: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);