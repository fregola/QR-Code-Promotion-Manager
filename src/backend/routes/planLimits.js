const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateAllMonthlyCounts } = require('../utils/updateCounters');

const router = express.Router();

// @desc    Get current user plan info and monthly limits
// @route   GET /api/plans/info
// @access  Private
router.get('/info', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Resetta contatori se è un nuovo mese e aggiorna
    user.resetMonthlyCountersIfNeeded();
    await user.save();

    // Aggiorna i contatori mensili per essere sicuri che siano accurati
    const currentCounts = await updateAllMonthlyCounts(req.user.id);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const planInfo = {
      planType: user.planType,
      planExpiresAt: user.planExpiresAt,
      isActive: user.isPlanActive(),
      currentMonth: currentMonth,
      monthlyCounts: {
        promotions: currentCounts.promotions.monthly,
        qrCodes: currentCounts.qrCodes.monthly
      },
      totalCounts: {
        promotions: currentCounts.promotions.total,
        qrCodes: currentCounts.qrCodes.total
      },
      limits: {
        free: {
          monthlyPromotions: 3,
          monthlyQrCodes: 5
        },
        pro: {
          monthlyPromotions: 'unlimited',
          monthlyQrCodes: 'unlimited'
        },
        pro_test: {
          monthlyPromotions: 'unlimited',
          monthlyQrCodes: 'unlimited'
        }
      },
      canCreatePromotion: user.canCreatePromotion(),
      canCreateQRCode: user.canCreateQRCode(1),
      upgradeMessage: user.planType === 'free' ? `Piano FREE - Limiti mensili: ${currentCounts.promotions.monthly}/3 campagne, ${currentCounts.qrCodes.monthly}/5 QR codes. Passa al piano PRO per limiti illimitati!` : null
    };

    res.status(200).json({
      success: true,
      data: planInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Check if user can perform specific action (monthly limits)
// @route   POST /api/plans/check
// @access  Private
router.post('/check', protect, async (req, res) => {
  try {
    const { action, quantity } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Resetta contatori se è un nuovo mese
    user.resetMonthlyCountersIfNeeded();
    await user.save();

    let result = {};

    switch (action) {
      case 'create_promotion':
        result = user.canCreatePromotion();
        break;
      case 'create_qrcode':
        result = user.canCreateQRCode(quantity || 1);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action specified'
        });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
