const Promotion = require('../models/Promotion');
const QRCode = require('../models/QRCode');
const User = require('../models/User');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { updateMonthlyPromotionCount, updateMonthlyQRCodeCount } = require('../utils/updateCounters');

exports.getPromotions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Promotion.countDocuments({ createdBy: req.user.id });

    const query = Promotion.find({ createdBy: req.user.id })
      .populate('qrCodes')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const promotions = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    // Aggiorna e ottieni contatori mensili
    const user = await User.findById(req.user.id);
    user.resetMonthlyCountersIfNeeded();
    await user.save();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const planInfo = {
      planType: user.planType,
      currentMonth: currentMonth,
      monthlyPromotionsCount: user.monthlyPromotionsCount,
      monthlyQrCodesCount: user.monthlyQrCodesCount,
      totalPromotionsCount: user.totalPromotionsCount,
      totalQrCodesCount: user.totalQrCodesCount,
      limits: {
        monthly: {
          promotions: user.planType === 'free' ? 3 : 'unlimited',
          qrCodes: user.planType === 'free' ? 5 : 'unlimited'
        }
      }
    };

    res.status(200).json({
      success: true,
      count: promotions.length,
      pagination,
      planInfo,
      data: promotions
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id).populate('qrCodes');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found'
      });
    }

    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this promotion'
      });
    }

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    // Controlla i limiti mensili per i QR codes
    const user = await User.findById(req.user.id);
    const qrCodesCount = req.body.qrCodesCount || 1;
    
    const canCreateQR = user.canCreateQRCode(qrCodesCount);
    if (!canCreateQR.allowed) {
      return res.status(400).json({
        success: false,
        error: canCreateQR.reason,
        currentPlan: user.planType,
        monthlyQRCount: user.monthlyQrCodesCount,
        requestedQRCount: qrCodesCount
      });
    }

    const promotion = await Promotion.create(req.body);

    // Generate QR codes for this promotion
    const qrCodes = [];
    const uploadsDir = path.join(__dirname, '../../..', 'uploads/qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (let i = 0; i < qrCodesCount; i++) {
      const qrCodeDoc = await QRCode.create({
        promotion: promotion._id,
        maxUsageCount: promotion.maxUsageCount
      });

      const qrImagePath = path.join(uploadsDir, `${qrCodeDoc.code}.png`);
      const qrImageUrl = `/uploads/qrcodes/${qrCodeDoc.code}.png`;
      
      await qrcode.toFile(qrImagePath, qrCodeDoc.code, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      qrCodeDoc.qrImagePath = qrImageUrl;
      await qrCodeDoc.save();

      qrCodes.push(qrCodeDoc);
    }

    // Aggiorna automaticamente i contatori mensili dell'utente
    try {
      await updateMonthlyPromotionCount(req.user.id);
      await updateMonthlyQRCodeCount(req.user.id);
    } catch (updateError) {
      console.error('Error updating monthly counters:', updateError);
    }

    res.status(201).json({
      success: true,
      data: promotion,
      qrCodes: qrCodes,
      message: `Promozione creata con successo! Generati ${qrCodesCount} QR codes per questo mese.`
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    let promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found'
      });
    }

    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this promotion'
      });
    }

    promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: promotion
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found'
      });
    }

    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this promotion'
      });
    }

    // Elimina i file delle immagini QR associate
    try {
      const qrCodes = await QRCode.find({ promotion: promotion._id });
      const uploadsDir = path.join(__dirname, '../../..', 'uploads/qrcodes');
      
      for (const qrCode of qrCodes) {
        const filePath = path.join(uploadsDir, `${qrCode.code}.png`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (fileError) {
      console.error('Error deleting QR code files:', fileError);
    }

    await promotion.remove();

    // Aggiorna automaticamente i contatori mensili dell'utente
    try {
      await updateMonthlyPromotionCount(req.user.id);
      await updateMonthlyQRCodeCount(req.user.id);
    } catch (updateError) {
      console.error('Error updating monthly counters:', updateError);
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Promozione eliminata con successo!'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
