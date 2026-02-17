const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');
const { getDistance } = require('geolib');

const router = express.Router();

// @route   GET /api/analytics/matching
// @desc    Get smart matching recommendations
// @access  Private
router.get('/matching', protect, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    const userLocation = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };

    // Get available donations
    const donations = await Donation.find({
      status: 'pending',
      expiryTime: { $gt: new Date() }
    })
      .populate('donorId', 'name location')
      .populate('feedback');

    // Calculate match scores
    const matches = donations.map(donation => {
      const donationLocation = {
        latitude: donation.location.coordinates.lat,
        longitude: donation.location.coordinates.lng
      };

      const distance = getDistance(userLocation, donationLocation) / 1000; // km

      // Calculate match score (0-100)
      // Factors: distance (40%), freshness (30%), quantity (20%), health score (10%)
      let score = 0;

      // Distance score (closer = higher score, max 10km = 0)
      const distanceScore = Math.max(0, 40 * (1 - distance / 10));
      score += distanceScore;

      // Freshness score
      const freshnessScores = {
        'freshly-cooked': 30,
        'stored-4hrs': 25,
        'stored-8hrs': 20,
        'stored-12hrs': 15,
        'other': 10
      };
      score += freshnessScores[donation.freshness] || 10;

      // Quantity score (more quantity = higher score, capped at 20)
      const quantityScore = Math.min(20, donation.quantity / 5);
      score += quantityScore;

      // Health score
      score += (donation.foodHealthScore / 10) * 10;

      // Time urgency bonus (if expiring soon)
      const hoursUntilExpiry = (donation.expiryTime - new Date()) / (1000 * 60 * 60);
      if (hoursUntilExpiry < 2) {
        score += 10; // Urgency bonus
      }

      return {
        donation: {
          _id: donation._id,
          foodName: donation.foodName,
          foodType: donation.foodType,
          quantity: donation.quantity,
          location: donation.location,
          expiryTime: donation.expiryTime,
          freshness: donation.freshness,
          foodHealthScore: donation.foodHealthScore,
          donorId: donation.donorId
        },
        distance: Math.round(distance * 100) / 100,
        matchScore: Math.round(score * 100) / 100
      };
    });

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      matches: matches.slice(0, 10) // Top 10 matches
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating matches'
    });
  }
});

// @route   GET /api/analytics/impact
// @desc    Get impact statistics
// @access  Public
router.get('/impact', async (req, res) => {
  try {
    const completedDonations = await Donation.find({ status: 'completed' });
    const totalMeals = completedDonations.reduce((sum, d) => sum + d.quantity, 0);
    const co2Reduction = totalMeals * 0.5 * 2.5; // kg CO2
    const totalPeopleFed = Math.ceil(totalMeals / 2); // Assuming 2 meals per person per day

    // Get top donors
    const topDonors = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$donorId', totalMeals: { $sum: '$quantity' } } },
      { $sort: { totalMeals: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donor'
        }
      },
      { $unwind: '$donor' },
      { $project: { donorName: '$donor.name', totalMeals: 1 } }
    ]);

    res.json({
      success: true,
      impact: {
        totalMeals,
        co2Reduction: Math.round(co2Reduction * 100) / 100,
        totalPeopleFed,
        totalDonations: completedDonations.length,
        topDonors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching impact data'
    });
  }
});

module.exports = router;

