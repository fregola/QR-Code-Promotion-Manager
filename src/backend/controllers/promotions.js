const Promotion = require('../models/Promotion');
const QRCode = require('../models/QRCode');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private
exports.getPromotions = async (req, res) => {
  try {
    // Add pagination
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

    // Execute query
    const promotions = await query;
    const promotionsWithUsage = promotions.map(promotion => {
      const promotionObj = promotion.toObject();
      promotionObj.usedQRCount = promotion.qrCodes.filter(qr => qr.usageCount >= qr.maxUsageCount).length;
      return promotionObj;
    });

    // Pagination result
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

    res.status(200).json({
      success: true,
      count: promotions.length,
      pagination,
      data: promotionsWithUsage
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single promotion
// @route   GET /api/promotions/:id
// @access  Private
exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id).populate('qrCodes');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found'
      });
    }

    // Make sure user is the promotion owner
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

// @desc    Create new promotion
// @route   POST /api/promotions
// @access  Private
exports.createPromotion = async (req, res) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const promotion = await Promotion.create(req.body);

    // Generate QR codes for this promotion
    const qrCodesCount = promotion.qrCodesCount || 1;
    const qrCodes = [];

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../..', 'uploads/qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (let i = 0; i < qrCodesCount; i++) {
      // Create QR code in DB
      const qrCodeDoc = await QRCode.create({
        promotion: promotion._id,
        maxUsageCount: promotion.maxUsageCount
      });

      // Generate QR code image
      const qrImagePath = path.join(uploadsDir, `${qrCodeDoc.code}.png`);
      const qrImageUrl = `/uploads/qrcodes/${qrCodeDoc.code}.png`;
      
      // Generate QR code with the code embedded in the image
      await qrcode.toFile(qrImagePath, qrCodeDoc.code, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Update QR code with image path
      qrCodeDoc.qrImagePath = qrImageUrl;
      await qrCodeDoc.save();

      qrCodes.push(qrCodeDoc);
    }

    res.status(201).json({
      success: true,
      data: promotion,
      qrCodes: qrCodes
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private
exports.updatePromotion = async (req, res) => {
  try {
    let promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found'
      });
    }

    // Make sure user is the promotion owner
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

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        error: 'Promotion not found'
      });
    }

    // Make sure user is the promotion owner
    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this promotion'
      });
    }

    // This will trigger the cascade delete middleware
    await promotion.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

