const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = req.user;
    let dashboardData = {};

    if (user.role === 'donor') {
      const donations = await Donation.find({ donorId: user._id })
        .populate('receiverId', 'name organizationName')
        .populate('volunteerId', 'name')
        .sort({ createdAt: -1 });

      const stats = {
        total: donations.length,
        pending: donations.filter(d => d.status === 'pending').length,
        accepted: donations.filter(d => d.status === 'accepted').length,
        completed: donations.filter(d => d.status === 'completed').length,
        cancelled: donations.filter(d => d.status === 'cancelled').length
      };

      const totalMeals = donations
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.quantity, 0);

      dashboardData = {
        stats,
        donations: donations.slice(0, 10), // Recent 10
        totalMeals,
        points: user.points,
        badges: user.badges
      };
    } else if (user.role === 'receiver') {
      // NGO: donations they accepted
      const acceptedDonations = await Donation.find({ receiverId: user._id })
        .populate('donorId', 'name organizationName location')
        .populate('volunteerId', 'name phone')
        .sort({ createdAt: -1 });

      // NGO: donations they created (give)
      const myDonations = await Donation.find({ donorId: user._id })
        .populate('receiverId', 'name organizationName')
        .sort({ createdAt: -1 });

      const stats = {
        total: acceptedDonations.length,
        pending: acceptedDonations.filter(d => d.status === 'accepted').length,
        picked: acceptedDonations.filter(d => d.status === 'picked').length,
        completed: acceptedDonations.filter(d => d.status === 'completed').length
      };

      const totalMeals = acceptedDonations
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.quantity, 0);

      dashboardData = {
        stats,
        donations: acceptedDonations.slice(0, 10),
        myDonations: myDonations.slice(0, 10),
        totalMeals,
        points: user.points,
        badges: user.badges
      };
    } else if (user.role === 'volunteer') {
      const volunteerDonations = await Donation.find({ volunteerId: user._id })
        .populate('donorId', 'name location')
        .populate('receiverId', 'name location')
        .sort({ createdAt: -1 });

      const stats = {
        total: volunteerDonations.length,
        picked: volunteerDonations.filter(d => d.status === 'picked').length,
        completed: volunteerDonations.filter(d => d.status === 'completed').length
      };

      dashboardData = {
        stats,
        donations: volunteerDonations.slice(0, 10),
        points: user.points,
        badges: user.badges
      };
    }

    res.json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard'
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { role, limit = 50 } = req.query;
    
    const query = role ? { role, isActive: true } : { isActive: true };
    
    const users = await User.find(query)
      .select('name role points badges organizationName')
      .sort({ points: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      leaderboard: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard'
    });
  }
});

module.exports = router;

