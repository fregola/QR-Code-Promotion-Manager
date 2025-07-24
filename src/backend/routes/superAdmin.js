const express = require('express');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const QRCode = require('../models/QRCode');
const { protect } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const router = express.Router();

// Middleware per verificare che sia super_admin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Accesso negato. Sono richiesti diritti di super amministratore.'
    });
  }
  next();
};

// @desc    Get all users with detailed stats
// @route   GET /api/admin/users
// @access  Super Admin only
router.get('/users', protect, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const users = await User.find({})
      .select('-password')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await User.countDocuments();

    // Get detailed stats for each user
    const usersWithDetailedStats = await Promise.all(users.map(async (user) => {
      const promotions = await Promotion.find({ createdBy: user._id });
      const promotionIds = promotions.map(p => p._id);
      const qrCodes = await QRCode.find({ promotion: { $in: promotionIds } });
      
      // Detailed QR statistics
      const usedQRCodes = qrCodes.filter(qr => qr.isUsed);
      const totalScans = qrCodes.reduce((sum, qr) => sum + qr.usageCount, 0);
      
      // Recent activity (last 5 QR scans)
      const recentScans = qrCodes
        .filter(qr => qr.lastUsedAt)
        .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
        .slice(0, 5)
        .map(qr => ({
          qrCode: qr.code,
          lastUsedAt: qr.lastUsedAt,
          usageCount: qr.usageCount,
          promotion: promotions.find(p => p._id.toString() === qr.promotion.toString())?.name
        }));

      // Monthly vs Total comparison
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      return {
        ...user.toObject(),
        stats: {
          // Totals
          totalPromotions: promotions.length,
          totalQRCodes: qrCodes.length,
          totalScans: totalScans,
          
          // Usage details
          usedQRCodes: usedQRCodes.length,
          unusedQRCodes: qrCodes.length - usedQRCodes.length,
          
          // Monthly vs Total
          monthlyPromotions: user.monthlyPromotionsCount || 0,
          monthlyQRCodes: user.monthlyQrCodesCount || 0,
          
          // Activity
          recentScans: recentScans,
          lastActivityDate: qrCodes.length > 0 ? 
            Math.max(...qrCodes.map(qr => qr.lastUsedAt ? new Date(qr.lastUsedAt).getTime() : 0)) : null,
          
          // Plan info
          planLimitsReached: {
            promotions: user.planType === 'free' && user.monthlyPromotionsCount >= 3,
            qrCodes: user.planType === 'free' && user.monthlyQrCodesCount >= 5
          }
        }
      };
    }));

    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.json({
      success: true,
      count: usersWithDetailedStats.length,
      total,
      pagination,
      data: usersWithDetailedStats
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Get single user detailed info
// @route   GET /api/admin/users/:id
// @access  Super Admin only
router.get('/users/:id', protect, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Get all user's promotions with QR codes
    const promotions = await Promotion.find({ createdBy: user._id })
      .populate('qrCodes')
      .sort('-createdAt');

    // Get all QR codes with detailed scan history
    const promotionIds = promotions.map(p => p._id);
    const allQRCodes = await QRCode.find({ promotion: { $in: promotionIds } })
      .populate('promotion', 'name description')
      .sort('-lastUsedAt');

    // Activity timeline (last 20 activities)
    const activityTimeline = allQRCodes
      .filter(qr => qr.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, 20)
      .map(qr => ({
        type: 'qr_scan',
        date: qr.lastUsedAt,
        details: {
          qrCode: qr.code,
          promotion: qr.promotion.name,
          usageCount: qr.usageCount,
          maxUsage: qr.maxUsageCount
        }
      }));

    res.json({
      success: true,
      data: {
        user,
        promotions,
        qrCodes: allQRCodes,
        activityTimeline,
        summary: {
          totalPromotions: promotions.length,
          totalQRCodes: allQRCodes.length,
          totalScans: allQRCodes.reduce((sum, qr) => sum + qr.usageCount, 0),
          activeQRCodes: allQRCodes.filter(qr => !qr.isUsed).length
        }
      }
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Super Admin only
router.put('/users/:id/plan', protect, requireSuperAdmin, async (req, res) => {
  try {
    const { planType, planExpiresAt } = req.body;
    
    if (!['free', 'pro', 'pro_test'].includes(planType)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo di piano non valido'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    const oldPlan = user.planType;
    user.planType = planType;
    user.planExpiresAt = planExpiresAt || null;
    
    // Reset monthly counters if upgrading to pro
    if (planType === 'pro' || planType === 'pro_test') {
      user.monthlyPromotionsCount = 0;
      user.monthlyQrCodesCount = 0;
    }
    
    await user.save();

    res.json({
      success: true,
      data: user,
      message: `Piano utente cambiato da ${oldPlan} a ${planType}`,
      actionBy: req.user.email,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Super Admin only
router.put('/users/:id/reset-password', protect, requireSuperAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La password deve essere di almeno 6 caratteri'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear any existing reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: `Password reset completato per ${user.email}`,
      actionBy: req.user.email,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Super Admin only
router.put('/users/:id/toggle-status', protect, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Add isActive field if it doesn't exist
    if (user.isActive === undefined) {
      user.isActive = true;
    }
    
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: `Utente ${user.isActive ? 'attivato' : 'disattivato'}`,
      actionBy: req.user.email,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Super Admin only
router.get('/stats', protect, requireSuperAdmin, async (req, res) => {
  try {
    // Users statistics
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ planType: 'free' });
    const proUsers = await User.countDocuments({ planType: 'pro' });
    const testUsers = await User.countDocuments({ planType: 'pro_test' });
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    
    // Promotions statistics
    const totalPromotions = await Promotion.countDocuments();
    const activePromotions = await Promotion.countDocuments({ isActive: true });
    
    // QR Codes statistics
    const totalQRCodes = await QRCode.countDocuments();
    const usedQRCodes = await QRCode.countDocuments({ isUsed: true });
    
    // Scans statistics
    const totalScans = await QRCode.aggregate([
      { $group: { _id: null, total: { $sum: '$usageCount' } } }
    ]);
    
    // Monthly statistics
    const currentMonth = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(currentMonth + '-01T00:00:00.000Z');
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    
    const monthlyPromotions = await Promotion.countDocuments({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const monthlyQRCodes = await QRCode.countDocuments({
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });

    // Recent activity
    const recentUsers = await User.find({})
      .select('name email createdAt planType isActive')
      .sort('-createdAt')
      .limit(5);

    const recentPromotions = await Promotion.find({})
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .limit(5);

    // Top users by activity
    const topUsers = await User.aggregate([
      {
        $lookup: {
          from: 'promotions',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'promotions'
        }
      },
      {
        $addFields: {
          promotionCount: { $size: '$promotions' }
        }
      },
      {
        $sort: { promotionCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          name: 1,
          email: 1,
          planType: 1,
          promotionCount: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            free: freeUsers,
            pro: proUsers,
            test: testUsers
          },
          promotions: {
            total: totalPromotions,
            active: activePromotions,
            inactive: totalPromotions - activePromotions,
            thisMonth: monthlyPromotions
          },
          qrCodes: {
            total: totalQRCodes,
            used: usedQRCodes,
            unused: totalQRCodes - usedQRCodes,
            thisMonth: monthlyQRCodes
          },
          scans: {
            total: totalScans[0]?.total || 0
          }
        },
        recent: {
          users: recentUsers,
          promotions: recentPromotions
        },
        topUsers: topUsers
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Get activity logs
// @route   GET /api/admin/activity
// @access  Super Admin only
router.get('/activity', protect, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;

    // Get recent QR code scans as activity
    const recentScans = await QRCode.find({ lastUsedAt: { $exists: true } })
      .populate({
        path: 'promotion',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      })
      .sort('-lastUsedAt')
      .skip(startIndex)
      .limit(limit);

    const activities = recentScans.map(qr => ({
      type: 'qr_scan',
      timestamp: qr.lastUsedAt,
      user: qr.promotion.createdBy,
      details: {
        qrCode: qr.code,
        promotion: qr.promotion.name,
        usageCount: qr.usageCount,
        maxUsage: qr.maxUsageCount,
        isCompleted: qr.isUsed
      }
    }));

    const total = await QRCode.countDocuments({ lastUsedAt: { $exists: true } });

    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.json({
      success: true,
      count: activities.length,
      total,
      pagination,
      data: activities
    });
  } catch (error) {
    console.error('Admin activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

module.exports = router;
