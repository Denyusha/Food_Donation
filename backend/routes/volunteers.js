const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { getDistance } = require('geolib');
const sendNotification = require('../utils/sendNotification');

const router = express.Router();

// @route   GET /api/volunteers/available
// @desc    Get available donations for volunteers
// @access  Private (Volunteer)
router.get('/available', [
  protect,
  authorize('volunteer', 'admin')
], async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Find accepted donations without volunteer
    const donations = await Donation.find({
      status: 'accepted',
      volunteerId: null
    })
      .populate('donorId', 'name location phone')
      .populate('receiverId', 'name location phone');

    const userLocation = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };

    // Calculate distances and filter
    const availableDonations = donations
      .map(donation => {
        const donorLocation = {
          latitude: donation.donorId.location?.coordinates?.lat,
          longitude: donation.donorId.location?.coordinates?.lng
        };

        if (!donorLocation.latitude || !donorLocation.longitude) {
          return null;
        }

        const distance = getDistance(userLocation, donorLocation) / 1000; // km

        return {
          ...donation.toObject(),
          distance: Math.round(distance * 100) / 100
        };
      })
      .filter(d => d && d.distance <= parseFloat(maxDistance))
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: availableDonations.length,
      donations: availableDonations
    });
  } catch (error) {
    console.error('Available donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available donations'
    });
  }
});

// @route   POST /api/volunteers/assign/:donationId
// @desc    Assign volunteer to a donation
// @access  Private (Volunteer)
router.post('/assign/:donationId', [
  protect,
  authorize('volunteer', 'admin')
], async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId)
      .populate('donorId')
      .populate('receiverId');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Donation is not available for pickup'
      });
    }

    if (donation.volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Donation already has a volunteer assigned'
      });
    }

    donation.volunteerId = req.user._id;
    donation.status = 'picked';
    donation.pickedAt = new Date();
    await donation.save();

    // Award points
    await req.user.addPoints(20);

    // Notify donor and receiver
    const io = req.app.get('io');
    if (donation.donorId) {
      await sendNotification(
        io,
        donation.donorId._id,
        'donation_picked',
        'Donation Picked Up',
        `${req.user.name} has picked up your donation`,
        { donationId: donation._id, volunteerId: req.user._id }
      );
    }

    if (donation.receiverId) {
      await sendNotification(
        io,
        donation.receiverId._id,
        'donation_picked',
        'Donation Picked Up',
        `${req.user.name} is delivering your donation`,
        { donationId: donation._id, volunteerId: req.user._id }
      );
    }

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    console.error('Assign volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning volunteer'
    });
  }
});

// @route   GET /api/volunteers/my-assignments
// @desc    Get volunteer's assigned donations
// @access  Private (Volunteer)
router.get('/my-assignments', [
  protect,
  authorize('volunteer', 'admin')
], async (req, res) => {
  try {
    const donations = await Donation.find({ volunteerId: req.user._id })
      .populate('donorId', 'name location phone')
      .populate('receiverId', 'name location phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching assignments'
    });
  }
});

module.exports = router;

