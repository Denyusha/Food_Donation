const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  foodName: {
    type: String,
    required: [true, 'Please provide food name']
  },
  foodType: {
    type: String,
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'dessert', 'beverage', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 1
  },
  unit: {
    type: String,
    enum: ['servings', 'plates', 'kg', 'pieces', 'liters'],
    default: 'servings'
  },
  description: String,
  images: [String],
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  expiryTime: {
    type: Date,
    required: [true, 'Please provide expiry time']
  },
  availableTimeSlot: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  freshness: {
    type: String,
    enum: ['freshly-cooked', 'stored-4hrs', 'stored-8hrs', 'stored-12hrs', 'other'],
    default: 'freshly-cooked'
  },
  foodHealthScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 10
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date,
  pickedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  volunteerLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    default: null
  }
}, {
  timestamps: true
});

// Index for geospatial queries
donationSchema.index({ 'location.coordinates': '2dsphere' });
donationSchema.index({ status: 1, expiryTime: 1 });

// Auto-expire donations
donationSchema.pre('save', function(next) {
  if (this.expiryTime < new Date() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);

