const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Feedback = require('../models/Feedback');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const sendNotification = require('../utils/sendNotification');
const { getDistance } = require('geolib');

const router = express.Router();

// @route   POST /api/donations
// @desc    Create a new donation
// @access  Private (Donor)
router.post('/', [
  protect,
  authorize('donor', 'receiver', 'admin'), // Donor: give only. NGO/Receiver: can give + accept.
  body('foodName').trim().notEmpty().withMessage('Food name is required'),
  body('foodType').isIn(['vegetarian', 'non-vegetarian', 'vegan', 'dessert', 'beverage', 'other']),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.coordinates.lat').isFloat().withMessage('Valid latitude is required'),
  body('location.coordinates.lng').isFloat().withMessage('Valid longitude is required'),
  body('expiryTime').isISO8601().withMessage('Valid expiry time is required'),
  body('availableTimeSlot.start').isISO8601(),
  body('availableTimeSlot.end').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const donation = await Donation.create({
      ...req.body,
      donorId: req.user._id
    });

    // Award points for creating donation
    await req.user.addPoints(10);

    // Send notification to nearby receivers
    const io = req.app.get('io');
    if (io) {
      // This would ideally query nearby receivers and notify them
      // For now, we'll implement this in the matching system
    }

    res.status(201).json({
      success: true,
      donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating donation'
    });
  }
});

// @route   GET /api/donations
// @desc    Get all donations (with filters)
// @access  Public (with optional auth for personalized results)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      status = 'pending',
      foodType,
      minQuantity,
      maxDistance,
      lat,
      lng,
      isEmergency,
      page = 1,
      limit = 20
    } = req.query;

    const query = { status };

    if (foodType) query.foodType = foodType;
    if (isEmergency === 'true') query.isEmergency = true;
    if (minQuantity) query.quantity = { $gte: parseInt(minQuantity) };

    let donations = await Donation.find(query)
      .populate('donorId', 'name email location organizationName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by distance if coordinates provided
    if (lat && lng && maxDistance) {
      const userLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      donations = donations.filter(donation => {
        const donationLocation = {
          latitude: donation.location.coordinates.lat,
          longitude: donation.location.coordinates.lng
        };
        const distance = getDistance(userLocation, donationLocation) / 1000; // Convert to km
        return distance <= parseFloat(maxDistance);
      });
    }

    // Calculate distances if user location provided
    if (lat && lng && req.user) {
      const userLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      donations = donations.map(donation => {
        const donationLocation = {
          latitude: donation.location.coordinates.lat,
          longitude: donation.location.coordinates.lng
        };
        const distance = getDistance(userLocation, donationLocation) / 1000;
        return { ...donation.toObject(), distance };
      });
    }

    res.json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching donations'
    });
  }
});

// @route   GET /api/donations/:id
// @desc    Get single donation
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email location organizationName profileImage')
      .populate('receiverId', 'name email location organizationName')
      .populate('volunteerId', 'name email phone location')
      .populate('feedback');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/donations/:id
// @desc    Update donation
// @access  Private (Donor/Owner)
router.put('/:id', protect, async (req, res) => {
  try {
    let donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check ownership
    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this donation'
      });
    }

    // Don't allow updates if already accepted
    if (donation.status === 'accepted' || donation.status === 'picked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update donation that has been accepted'
      });
    }

    donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating donation'
    });
  }
});

// @route   DELETE /api/donations/:id
// @desc    Cancel/Delete donation
// @access  Private (Donor/Owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this donation'
      });
    }

    donation.status = 'cancelled';
    donation.cancelledAt = new Date();
    donation.cancellationReason = req.body.reason || 'Cancelled by donor';
    await donation.save();

    // Notify receiver if accepted
    if (donation.receiverId) {
      const io = req.app.get('io');
      await sendNotification(
        io,
        donation.receiverId,
        'donation_cancelled',
        'Donation Cancelled',
        `The donation "${donation.foodName}" has been cancelled`,
        { donationId: donation._id }
      );
    }

    res.json({
      success: true,
      message: 'Donation cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error cancelling donation'
    });
  }
});

// @route   POST /api/donations/:id/accept
// @desc    Accept a donation (Receiver)
// @access  Private (Receiver)
router.post('/:id/accept', [
  protect,
  authorize('receiver', 'admin')
], async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Donation is not available for acceptance'
      });
    }

    donation.receiverId = req.user._id;
    donation.status = 'accepted';
    donation.acceptedAt = new Date();
    await donation.save();

    // Award points
    await req.user.addPoints(5);

    // Notify donor
    const io = req.app.get('io');
    await sendNotification(
      io,
      donation.donorId,
      'donation_accepted',
      'Donation Accepted',
      `${req.user.name} has accepted your donation "${donation.foodName}"`,
      { donationId: donation._id, receiverId: req.user._id }
    );

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error accepting donation'
    });
  }
});

// @route   POST /api/donations/:id/complete
// @desc    Mark donation as completed
// @access  Private
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Only receiver or volunteer can complete
    const canComplete = 
      donation.receiverId?.toString() === req.user._id.toString() ||
      donation.volunteerId?.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!canComplete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this donation'
      });
    }

    donation.status = 'completed';
    donation.completedAt = new Date();
    await donation.save();

    // Award points and check badges
    if (donation.donorId) {
      const Donor = require('../models/User');
      const { checkBadges } = require('../utils/badgeSystem');
      const donor = await Donor.findById(donation.donorId);
      await donor.addPoints(50);
      await checkBadges(donor, donation);
    }

    // Notify all parties
    const io = req.app.get('io');
    if (donation.donorId) {
      await sendNotification(
        io,
        donation.donorId,
        'donation_completed',
        'Donation Completed',
        `Your donation "${donation.foodName}" has been completed`,
        { donationId: donation._id }
      );
    }

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error completing donation'
    });
  }
});

// @route   GET /api/donations/:id/tracking
// @desc    Get delivery tracking data (donor, NGO, volunteer, timeline) for map & offline
// @access  Private (donor, receiver, volunteer, admin)
router.get('/:id/tracking', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name location phone')
      .populate('receiverId', 'name location phone')
      .populate('volunteerId', 'name location phone');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    const isDonor = donation.donorId?._id?.toString() === req.user._id?.toString();
    const isReceiver = donation.receiverId?._id?.toString() === req.user._id?.toString();
    const isVolunteer = donation.volunteerId?._id?.toString() === req.user._id?.toString();
    if (!isDonor && !isReceiver && !isVolunteer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this delivery'
      });
    }

    const donorLocation = donation.location?.coordinates
      ? { lat: donation.location.coordinates.lat, lng: donation.location.coordinates.lng, label: 'Donor (pickup)', address: donation.location?.address }
      : null;

    const receiverLocation = donation.receiverId?.location?.coordinates
      ? { lat: donation.receiverId.location.coordinates.lat, lng: donation.receiverId.location.coordinates.lng, label: 'NGO / Receiver', address: donation.receiverId.location?.address }
      : null;

    const volunteerLocation = donation.volunteerLocation?.lat != null
      ? { lat: donation.volunteerLocation.lat, lng: donation.volunteerLocation.lng, updatedAt: donation.volunteerLocation.updatedAt, label: 'Volunteer' }
      : (donation.volunteerId?.location?.coordinates
          ? { lat: donation.volunteerId.location.coordinates.lat, lng: donation.volunteerId.location.coordinates.lng, label: 'Volunteer' }
          : null);

    const timeline = [
      { step: 'created', label: 'Donation created', at: donation.createdAt, done: true },
      { step: 'accepted', label: 'Accepted by NGO', at: donation.acceptedAt, done: !!donation.acceptedAt },
      { step: 'volunteer_assigned', label: 'Volunteer accepted delivery', at: donation.pickedAt, done: !!donation.volunteerId },
      { step: 'picked', label: 'Picked up from donor', at: donation.pickedAt, done: donation.status === 'picked' || donation.status === 'completed' },
      { step: 'completed', label: 'Delivered to NGO', at: donation.completedAt, done: donation.status === 'completed' }
    ];

    res.json({
      success: true,
      tracking: {
        donationId: donation._id,
        foodName: donation.foodName,
        status: donation.status,
        donorLocation,
        receiverLocation,
        volunteerLocation,
        donorName: donation.donorId?.name,
        receiverName: donation.receiverId?.name,
        volunteerName: donation.volunteerId?.name,
        volunteerId: donation.volunteerId?._id,
        timeline,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tracking'
    });
  }
});

// @route   POST /api/donations/:id/volunteer-location
// @desc    Update volunteer's current location (for live delivery tracking)
// @access  Private (Volunteer assigned to this donation)
router.post('/:id/volunteer-location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    if (donation.volunteerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (typeof lat !== 'number' && typeof lat !== 'string') {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    donation.volunteerLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      updatedAt: new Date()
    };
    await donation.save();

    res.json({ success: true, volunteerLocation: donation.volunteerLocation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
});

// @route   POST /api/donations/:id/feedback
// @desc    Submit feedback for a donation
// @access  Private (Receiver)
router.post('/:id/feedback', [
  protect,
  authorize('receiver', 'admin'),
  body('rating').isInt({ min: 1, max: 5 }),
  body('freshnessScore').isInt({ min: 0, max: 10 }),
  body('quality').isIn(['excellent', 'good', 'average', 'poor'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.receiverId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to provide feedback for this donation'
      });
    }

    const feedback = await Feedback.create({
      donationId: donation._id,
      receiverId: req.user._id,
      donorId: donation.donorId,
      ...req.body
    });

    donation.feedback = feedback._id;
    donation.foodHealthScore = req.body.freshnessScore;
    await donation.save();

    res.status(201).json({
      success: true,
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error submitting feedback'
    });
  }
});

module.exports = router;

