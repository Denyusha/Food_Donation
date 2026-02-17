const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const sendNotification = require('../utils/sendNotification');

const router = express.Router();

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/verify
// @desc    Verify a user account
// @access  Private (Admin)
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isVerified = { ...user.isVerified, email: true, phone: true };
    await user.save();

    const io = req.app.get('io');
    await sendNotification(
      io,
      user._id,
      'admin_verification',
      'Account Verified',
      'Your account has been verified by admin',
      { userId: user._id }
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error verifying user'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Activate/Deactivate user
// @access  Private (Admin)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
});

// @route   GET /api/admin/donations
// @desc    Get all donations with filters
// @access  Private (Admin)
router.get('/donations', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    const query = status ? { status } : {};

    const donations = await Donation.find(query)
      .populate('donorId', 'name email')
      .populate('receiverId', 'name email')
      .populate('volunteerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      success: true,
      count: donations.length,
      total,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching donations'
    });
  }
});

// @route   PUT /api/admin/donations/:id
// @desc    Edit any donation (admin fix)
// @access  Private (Admin)
router.put('/donations/:id', async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('donorId', 'name email')
      .populate('receiverId', 'name email')
      .populate('volunteerId', 'name email');

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
    console.error('Admin edit donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating donation'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get admin analytics
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalReceivers = await User.countDocuments({ role: 'receiver' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });

    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.find({ status: 'completed' });
    const totalMeals = completedDonations.reduce((sum, d) => sum + d.quantity, 0);

    // Calculate CO2 reduction (rough estimate: 1kg food waste = 2.5kg CO2)
    const co2Reduction = totalMeals * 0.5 * 2.5; // Assuming 0.5kg per meal

    // Get feedback stats
    const feedbacks = await Feedback.find();
    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    // Low-rated donors (rating < 3)
    const lowRatedDonors = await Feedback.aggregate([
      { $group: { _id: '$donorId', avgRating: { $avg: '$rating' } } },
      { $match: { avgRating: { $lt: 3 } } }
    ]);

    // Monthly stats
    const monthlyStats = await Donation.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          meals: { $sum: '$quantity' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          donors: totalDonors,
          receivers: totalReceivers,
          volunteers: totalVolunteers
        },
        donations: {
          total: totalDonations,
          completed: completedDonations.length,
          totalMeals,
          co2Reduction: Math.round(co2Reduction * 100) / 100
        },
        quality: {
          avgRating: Math.round(avgRating * 100) / 100,
          lowRatedDonors: lowRatedDonors.length
        },
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
});

// @route   GET /api/admin/reports/monthly
// @desc    Generate monthly report PDF
// @access  Private (Admin)
router.get('/reports/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const donations = await Donation.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).populate('donorId', 'name organizationName');

    const totalMeals = donations.reduce((sum, d) => sum + d.quantity, 0);
    const co2Reduction = totalMeals * 0.5 * 2.5;

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${targetMonth}-${targetYear}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Monthly CSR Impact Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Month: ${targetMonth}/${targetYear}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(16).text('Summary Statistics');
    doc.fontSize(12);
    doc.text(`Total Donations: ${donations.length}`);
    doc.text(`Total Meals Provided: ${totalMeals}`);
    doc.text(`CO₂ Reduction: ${Math.round(co2Reduction * 100) / 100} kg`);
    doc.moveDown();

    doc.fontSize(16).text('Top Donors');
    donations.slice(0, 10).forEach((donation, index) => {
      doc.text(`${index + 1}. ${donation.donorId.name || 'Anonymous'}: ${donation.quantity} meals`);
    });

    doc.end();
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating report'
    });
  }
});

module.exports = router;

