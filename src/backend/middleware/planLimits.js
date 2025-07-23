const User = require('../models/User');

// Middleware per controllare se l'utente può creare promozioni (limite mensile)
exports.checkPromotionLimit = async (req, res, next) => {
  try {
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

    const canCreate = user.canCreatePromotion();
    
    if (!canCreate.allowed) {
      return res.status(400).json({
        success: false,
        error: canCreate.reason,
        currentPlan: user.planType,
        currentMonth: user.currentMonth,
        monthlyCount: user.monthlyPromotionsCount,
        limits: {
          free: { monthlyPromotions: 3, monthlyQrCodes: 5 },
          pro: { monthlyPromotions: 'unlimited', monthlyQrCodes: 'unlimited' }
        }
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error checking monthly promotion limits'
    });
  }
};

// Middleware per controllare se l'utente può creare QR codes (limite mensile)
exports.checkQRCodeLimit = (quantity = 1) => {
  return async (req, res, next) => {
    try {
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

      // Se la quantità è specificata nel body della richiesta, usala
      const qrQuantity = req.body.qrCodesCount || quantity;
      const canCreate = user.canCreateQRCode(qrQuantity);
      
      if (!canCreate.allowed) {
        return res.status(400).json({
          success: false,
          error: canCreate.reason,
          currentPlan: user.planType,
          currentMonth: user.currentMonth,
          monthlyCount: user.monthlyQrCodesCount,
          requestedQuantity: qrQuantity,
          limits: {
            free: { monthlyPromotions: 3, monthlyQrCodes: 5 },
            pro: { monthlyPromotions: 'unlimited', monthlyQrCodes: 'unlimited' }
          }
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Server error checking monthly QR code limits'
      });
    }
  };
};

// Middleware per verificare se il piano è attivo
exports.checkActivePlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isPlanActive()) {
      return res.status(400).json({
        success: false,
        error: 'Your plan has expired. Please renew your subscription.',
        planType: user.planType,
        planExpiresAt: user.planExpiresAt
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error checking plan status'
    });
  }
};
