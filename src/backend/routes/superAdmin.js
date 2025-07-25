const express = require('express');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const QRCode = require('../models/QRCode');
const ActivityLog = require('../models/ActivityLog'); // NUOVO
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
      
      // NUOVO: Statistiche dalle attività logged
      const recentActivities = await ActivityLog.find({ userId: user._id })
        .sort('-timestamp')
        .limit(5)
        .select('activityType description timestamp metadata.endpoint');
      
      const totalActivities = await ActivityLog.countDocuments({ userId: user._id });
      const loginCount = await ActivityLog.countDocuments({ 
        userId: user._id, 
        activityType: 'login',
        success: true 
      });
      
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

      return {
        ...user.toObject(),
        stats: {
          // Totals
          totalPromotions: promotions.length,
          totalQRCodes: qrCodes.length,
          totalScans: totalScans,
          
          // NUOVO: Activity stats
          totalActivities: totalActivities,
          loginCount: loginCount,
          lastActivity: recentActivities[0]?.timestamp || null,
          
          // Usage details
          usedQRCodes: usedQRCodes.length,
          unusedQRCodes: qrCodes.length - usedQRCodes.length,
          
          // Monthly vs Total
          monthlyPromotions: user.monthlyPromotionsCount || 0,
          monthlyQRCodes: user.monthlyQrCodesCount || 0,
          
          // Activity
          recentScans: recentScans,
          recentActivities: recentActivities, // NUOVO
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

// @desc    Get single user detailed info with complete activity log
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

    const promotionIds = promotions.map(p => p._id);
    const allQRCodes = await QRCode.find({ promotion: { $in: promotionIds } })
      .populate('promotion', 'name description')
      .sort('-lastUsedAt');

    // NUOVO: Complete activity timeline dal database ActivityLog
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    const completeActivityLog = await ActivityLog.find({ userId: user._id })
      .sort('-timestamp')
      .skip(skip)
      .limit(limit)
      .select('activityType description timestamp metadata duration success priority');
    
    const totalActivities = await ActivityLog.countDocuments({ userId: user._id });
    
    // Activity statistics by type
    const activityStats = await ActivityLog.aggregate([
      { $match: { userId: user._id } },
      { $group: { 
        _id: '$activityType', 
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }},
      { $sort: { count: -1 } }
    ]);

    // Activity by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActivity = await ActivityLog.aggregate([
      { 
        $match: { 
          userId: user._id,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$timestamp" 
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        user,
        promotions,
        qrCodes: allQRCodes,
        
        // NUOVO: Complete activity data
        activityLog: completeActivityLog,
        activityStats: activityStats,
        dailyActivity: dailyActivity,
        
        // Pagination for activity log
        activityPagination: {
          page,
          limit,
          total: totalActivities,
          hasNext: skip + limit < totalActivities,
          hasPrev: page > 1
        },
        
        summary: {
          totalPromotions: promotions.length,
          totalQRCodes: allQRCodes.length,
          totalScans: allQRCodes.reduce((sum, qr) => sum + qr.usageCount, 0),
          activeQRCodes: allQRCodes.filter(qr => !qr.isUsed).length,
          totalActivities: totalActivities
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

// @desc    Get complete activity logs (ALL USERS)
// @route   GET /api/admin/activity
// @access  Super Admin only
router.get('/activity', protect, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    // Filtri opzionali
    const filters = {};
    
    // Filtro per utente specifico
    if (req.query.userId) {
      filters.userId = req.query.userId;
    }
    
    // Filtro per tipo di attività
    if (req.query.activityType) {
      filters.activityType = req.query.activityType;
    }
    
    // Filtro per successo/errore
    if (req.query.success !== undefined) {
      filters.success = req.query.success === 'true';
    }
    
    // Filtro per priorità
    if (req.query.priority) {
      filters.priority = req.query.priority;
    }
    
    // Filtro per data (ultimi X giorni)
    if (req.query.days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(req.query.days));
      filters.timestamp = { $gte: daysAgo };
    }
    
    // Filtro per endpoint specifico
    if (req.query.endpoint) {
      filters['metadata.endpoint'] = { $regex: req.query.endpoint, $options: 'i' };
    }

    // Query principale con populate per ottenere info utente
    const activities = await ActivityLog.find(filters)
      .populate('userId', 'name email role planType')
      .sort('-timestamp')
      .skip(startIndex)
      .limit(limit);

    const total = await ActivityLog.countDocuments(filters);

    // Statistiche aggiuntive per il periodo filtrato
    const stats = await ActivityLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          successfulActivities: {
            $sum: { $cond: ['$success', 1, 0] }
          },
          failedActivities: {
            $sum: { $cond: ['$success', 0, 1] }
          },
          uniqueUsers: { $addToSet: '$userId' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Top attività per frequenza
    const topActivities = await ActivityLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Attività per ora del giorno (heatmap data)
    const hourlyActivity = await ActivityLog.aggregate([
      { $match: filters },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

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
      data: activities,
      statistics: {
        overview: stats[0] || {
          totalActivities: 0,
          successfulActivities: 0,
          failedActivities: 0,
          uniqueUsers: [],
          avgDuration: 0
        },
        topActivities,
        hourlyDistribution: hourlyActivity
      },
      filters: req.query // Rimanda i filtri applicati per riferimento frontend
    });
  } catch (error) {
    console.error('Admin activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Get activity statistics and analytics
// @route   GET /api/admin/activity/stats
// @access  Super Admin only
router.get('/activity/stats', protect, requireSuperAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Statistiche generali
    const totalActivities = await ActivityLog.countDocuments({
      timestamp: { $gte: daysAgo }
    });

    const uniqueActiveUsers = await ActivityLog.distinct('userId', {
      timestamp: { $gte: daysAgo }
    });

    // Attività per giorno (trend)
    const dailyActivity = await ActivityLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$timestamp" 
            }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { 
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      { 
        $project: {
          count: 1,
          uniqueUserCount: 1
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top utenti per attività
    const topActiveUsers = await ActivityLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
          activityTypes: { $addToSet: '$activityType' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          activityCount: 1,
          lastActivity: 1,
          activityTypeCount: { $size: '$activityTypes' },
          userName: '$user.name',
          userEmail: '$user.email',
          userPlan: '$user.planType'
        }
      },
      { $sort: { activityCount: -1 } },
      { $limit: 10 }
    ]);

    // Errori più frequenti
    const topErrors = await ActivityLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: daysAgo },
          success: false
        }
      },
      {
        $group: {
          _id: {
            activityType: '$activityType',
            errorMessage: '$errorMessage'
          },
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Performance analysis (durata media per tipo di attività)
    const performanceStats = await ActivityLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: daysAgo },
          duration: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$activityType',
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgDuration: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalActivities,
          uniqueActiveUsers: uniqueActiveUsers.length,
          period: `${days} giorni`,
          startDate: daysAgo,
          endDate: new Date()
        },
        trends: {
          dailyActivity
        },
        users: {
          topActiveUsers
        },
        errors: {
          topErrors,
          errorRate: topErrors.reduce((sum, err) => sum + err.count, 0) / totalActivities
        },
        performance: {
          performanceStats
        }
      }
    });
  } catch (error) {
    console.error('Admin activity stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
});

// @desc    Get real-time activity feed
// @route   GET /api/admin/activity/live
// @access  Super Admin only
router.get('/activity/live', protect, requireSuperAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // Ultimi X minuti di attività
    const minutesAgo = new Date();
    minutesAgo.setMinutes(minutesAgo.getMinutes() - 15); // Ultimi 15 minuti
    
    const liveActivities = await ActivityLog.find({
      timestamp: { $gte: minutesAgo }
    })
    .populate('userId', 'name email role')
    .sort('-timestamp')
    .limit(limit);

    // Conteggio attività per gli ultimi 15 minuti
    const activityCount = await ActivityLog.countDocuments({
      timestamp: { $gte: minutesAgo }
    });

    // Utenti attivi negli ultimi 15 minuti
    const activeUsers = await ActivityLog.aggregate([
      { 
        $match: { 
          timestamp: { $gte: minutesAgo }
        }
      },
      {
        $group: {
          _id: '$userId',
          lastActivity: { $max: '$timestamp' },
          activityCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          lastActivity: 1,
          activityCount: 1
        }
      },
      { $sort: { lastActivity: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        recentActivities: liveActivities,
        summary: {
          totalRecentActivities: activityCount,
          activeUsersCount: activeUsers.length,
          timeWindow: '15 minuti',
          timestamp: new Date()
        },
        activeUsers
      }
    });
  } catch (error) {
    console.error('Admin live activity error:', error);
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

    // NUOVO: Log dell'azione admin
    await ActivityLog.logActivity({
      userId: user._id,
      activityType: 'plan_upgrade',
      description: `Piano modificato da ${oldPlan} a ${planType} dall'amministratore`,
      metadata: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        oldPlan,
        newPlan: planType,
        adminUserId: req.user.id,
        adminEmail: req.user.email
      },
      priority: 'high'
    });

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

module.exports = router;