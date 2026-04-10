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

    // If no location provided, return all accepted donations without distance filtering
    if (!lat || !lng) {
      const donations = await Donation.find({
        status: 'accepted',
        volunteerId: null
      })
        .populate('donorId', 'name location phone')
        .populate('receiverId', 'name location phone');

      return res.json({
        success: true,
        count: donations.length,
        donations: donations.map(d => ({ ...d.toObject(), distance: null }))
      });
    }

    // Find accepted donations without volunteer
    const donations = await Donation.find({
      status: 'accepted',
      volunteerId: null
    })
      .populate('donorId', 'name location phone')
      .populate('receiverId', 'name location phone');

    // Validate user location
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates'
      });
    }

    const userLocation = {
      latitude: userLat,
      longitude: userLng
    };

    // Calculate distances and filter - use donation location (pickup location)
    const availableDonations = donations
      .map(donation => {
        // Safely get coordinates with fallback
        const lat = donation.location?.coordinates?.lat;
        const lng = donation.location?.coordinates?.lng;

        // Skip if coordinates are missing
        if (lat == null || lng == null) {
          console.log(`Skipping donation ${donation._id}: missing coordinates`);
          return null;
        }

        // Parse to float
        const pickupLat = parseFloat(lat);
        const pickupLng = parseFloat(lng);

        // Validate they're valid numbers
        if (isNaN(pickupLat) || isNaN(pickupLng)) {
          console.log(`Skipping donation ${donation._id}: invalid coordinates (${lat}, ${lng})`);
          return null;
        }

        const pickupLocation = {
          latitude: pickupLat,
          longitude: pickupLng
        };

        try {
          const distance = getDistance(userLocation, pickupLocation) / 1000; // km
          return {
            ...donation.toObject(),
            distance: Math.round(distance * 100) / 100
          };
        } catch (error) {
          console.error('Distance calculation error for donation', donation._id, error);
          return null;
        }
      })
      .filter(d => d !== null && d.distance <= parseFloat(maxDistance))
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

// @route   GET /api/volunteers/pickup-requests
// @desc    Get pending pickup requests for volunteers
// @access  Private (Volunteer)
router.get('/pickup-requests', [
  protect,
  authorize('volunteer', 'admin')
], async (req, res) => {
  try {
    const { lat, lng, maxDistance = 15 } = req.query;

    // Find donations with pending pickup requests
    const donations = await Donation.find({
      status: 'accepted',
      'pickupRequest.status': 'pending',
      volunteerId: null
    })
      .populate('donorId', 'name location phone')
      .populate('receiverId', 'name location phone organizationName');

    if (!lat || !lng) {
      return res.json({
        success: true,
        count: donations.length,
        requests: donations.map(d => ({
          donationId: d._id,
          foodName: d.foodName,
          quantity: d.quantity,
          unit: d.unit,
          pickupLocation: d.location,
          donor: d.donorId,
          ngo: d.receiverId,
          requestedAt: d.pickupRequest.requestedAt
        }))
      });
    }

    const userLocation = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };

    // Calculate distances and filter
    const requests = donations
      .map(donation => {
        // Safely get coordinates
        const lat = donation.location?.coordinates?.lat;
        const lng = donation.location?.coordinates?.lng;

        if (lat == null || lng == null) {
          console.log(`Skipping pickup request ${donation._id}: missing coordinates`);
          return null;
        }

        const pickupLat = parseFloat(lat);
        const pickupLng = parseFloat(lng);

        if (isNaN(pickupLat) || isNaN(pickupLng)) {
          console.log(`Skipping pickup request ${donation._id}: invalid coordinates`);
          return null;
        }

        const pickupLocation = {
          latitude: pickupLat,
          longitude: pickupLng
        };

        try {
          const distance = getDistance(userLocation, pickupLocation) / 1000; // km

          return {
            donationId: donation._id,
            foodName: donation.foodName,
            quantity: donation.quantity,
            unit: donation.unit,
            pickupLocation: donation.location,
            donor: donation.donorId,
            ngo: donation.receiverId,
            requestedAt: donation.pickupRequest.requestedAt,
            distance: Math.round(distance * 100) / 100
          };
        } catch (error) {
          console.error('Distance calculation error for pickup request', donation._id, error);
          return null;
        }
      })
      .filter(r => r !== null && r.distance <= parseFloat(maxDistance))
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Pickup requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pickup requests'
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
    console.log('Assign volunteer request:', req.params.donationId, 'User:', req.user._id);
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

    // Award points - load full user document first
    try {
      const user = await User.findById(req.user._id);
      if (user && typeof user.addPoints === 'function') {
        await user.addPoints(20);
        console.log('Awarded 20 points to volunteer:', req.user._id);
      }
    } catch (pointsError) {
      console.error('Error awarding points:', pointsError);
      // Continue even if points fail
    }

    // Notify donor and receiver - defensive
    try {
      const io = req.app.get('io');
      if (donation.donorId && io) {
        await sendNotification(
          io,
          donation.donorId._id,
          'donation_picked',
          'Donation Picked Up',
          `${req.user.name} has picked up your donation`,
          { donationId: donation._id, volunteerId: req.user._id }
        );
      }

      if (donation.receiverId && io) {
        await sendNotification(
          io,
          donation.receiverId._id,
          'donation_picked',
          'Donation Picked Up',
          `${req.user.name} is delivering your donation`,
          { donationId: donation._id, volunteerId: req.user._id }
        );
      }
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
      // Continue even if notifications fail
    }

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    console.error('Assign volunteer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error assigning volunteer',
      error: error.message
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

// @desc    Mark donation as delivered/completed
// @access  Private (Volunteer)
router.post('/complete/:donationId', [
  protect,
  authorize('volunteer', 'admin')
], async (req, res) => {
  try {
    console.log('Completing delivery:', req.params.donationId);
    const donation = await Donation.findById(req.params.donationId)
      .populate('donorId', 'name')
      .populate('receiverId', 'name');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if this volunteer is assigned
    if (donation.volunteerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this delivery'
      });
    }

    // Check if donation is in 'picked' status
    if (donation.status !== 'picked') {
      return res.status(400).json({
        success: false,
        message: `Donation must be picked up first. Current status: ${donation.status}`
      });
    }

    // Update donation status
    donation.status = 'completed';
    donation.deliveredAt = new Date();
    await donation.save();

    // Award bonus points to volunteer
    try {
      const user = await User.findById(req.user._id);
      if (user && typeof user.addPoints === 'function') {
        await user.addPoints(30); // 30 points for completing delivery
        console.log('Awarded 30 points for completion to volunteer:', req.user._id);
      }
    } catch (pointsError) {
      console.error('Error awarding completion points:', pointsError);
    }

    // Send notifications
    try {
      const io = req.app.get('io');
      if (donation.donorId && io) {
        await sendNotification(
          io,
          donation.donorId._id,
          'donation_completed',
          'Donation Delivered',
          `Your donation has been successfully delivered by ${req.user.name}`,
          { donationId: donation._id }
        );
      }

      if (donation.receiverId && io) {
        await sendNotification(
          io,
          donation.receiverId._id,
          'donation_completed',
          'Donation Received',
          `Your requested donation has been delivered by ${req.user.name}`,
          { donationId: donation._id }
        );
      }
    } catch (notifyError) {
      console.error('Error sending completion notifications:', notifyError);
    }

    res.json({
      success: true,
      message: 'Delivery completed successfully!',
      donation
    });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing delivery',
      error: error.message
    });
  }
});

module.exports = router;

