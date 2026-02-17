const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  freshnessScore: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  comments: String,
  quality: {
    type: String,
    enum: ['excellent', 'good', 'average', 'poor'],
    required: true
  },
  wouldAcceptAgain: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);

