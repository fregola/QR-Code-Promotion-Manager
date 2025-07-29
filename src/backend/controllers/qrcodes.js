const QRCode = require('../models/QRCode');
const Promotion = require('../models/Promotion');

// @desc    Get all QR codes
// @route   GET /api/qrcodes
// @access  Private
exports.getQRCodes = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let query;
    let queryConditions = {};
    
    // If promotion ID is provided, filter by promotion
    if (req.query.promotion) {
      // Check if user owns the promotion
      const promotion = await Promotion.findById(req.query.promotion);
      
      if (!promotion) {
        return res.status(404).json({
          success: false,
          error: 'Promotion not found'
        });
      }
      
      if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access QR codes for this promotion'
        });
      }
      
      queryConditions.promotion = req.query.promotion;
    } else {
      // Get all QR codes for promotions created by the user
      const promotions = await Promotion.find({ createdBy: req.user.id });
      const promotionIds = promotions.map(promo => promo._id);
      
      queryConditions.promotion = { $in: promotionIds };
    }
    
    // If search term is provided, filter by code
    if (req.query.search) {
      // Create a case-insensitive regex for the search term
      const searchRegex = new RegExp(req.query.search, 'i');
      queryConditions.code = searchRegex;
    }
    
    query = QRCode.find(queryConditions);
    
    // Count before pagination
    const total = await QRCode.countDocuments(queryConditions);
    
    // Add pagination to query
    query = query.populate('promotion')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    // Execute query
    const qrCodes = await query;

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
      count: qrCodes.length,
      pagination,
      data: qrCodes
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single QR code
// @route   GET /api/qrcodes/:id
// @access  Private
exports.getQRCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id).populate('promotion');

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Check if user owns the promotion this QR code belongs to
    const promotion = await Promotion.findById(qrCode.promotion);
    
    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this QR code'
      });
    }

    res.status(200).json({
      success: true,
      data: qrCode
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Verify and use a QR code
// @route   POST /api/qrcodes/verify
// @access  Public
exports.verifyQRCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a QR code'
      });
    }

    const qrCode = await QRCode.findOne({ code }).populate('promotion');

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR code'
      });
    }

    // Check if promotion is active and not expired
    const promotion = qrCode.promotion;
    
    if (!promotion.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This promotion is not active'
      });
    }

    if (promotion.expiryDate && new Date(promotion.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This promotion has expired'
      });
    }

    // Check if QR code has reached max usage
    if (qrCode.usageCount >= qrCode.maxUsageCount) {
      return res.status(400).json({
        success: false,
        error: 'This QR code has reached its maximum usage limit'
      });
    }
    
    // Controllo se il QR code è stato utilizzato negli ultimi 5 secondi per evitare scansioni multiple
    const now = Date.now();
    const lastUsed = qrCode.lastUsedAt ? new Date(qrCode.lastUsedAt).getTime() : 0;
    const timeDiff = now - lastUsed;
    
    // Se il QR code è stato utilizzato negli ultimi 5 secondi, non incrementare il contatore
    // ma restituisci comunque i dati del QR code
    if (timeDiff < 5000) {
      return res.status(200).json({
        success: true,
        data: {
          qrCode,
          promotion: {
            name: promotion.name,
            description: promotion.description
          }
        }
      });
    }

    // Update QR code usage
    qrCode.usageCount += 1;
    qrCode.lastUsedAt = now;
    
    if (qrCode.usageCount >= qrCode.maxUsageCount) {
      qrCode.isUsed = true;
    }

    await qrCode.save();

    res.status(200).json({
      success: true,
      data: {
        qrCode,
        promotion: {
          name: promotion.name,
          description: promotion.description
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get QR code by code (for scanning)
// @route   GET /api/qrcodes/code/:code
// @access  Public
exports.getQRCodeByCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code })
      .populate('promotion')
      .populate({
        path: 'promotion',
        populate: {
          path: 'createdBy',
          select: 'name businessName businessType address city postalCode phoneNumber website businessLogo'
        }
      });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Only return basic info for public access
    res.status(200).json({
      success: true,
      data: {
        code: qrCode.code,
        isUsed: qrCode.isUsed,
        usageCount: qrCode.usageCount,
        maxUsageCount: qrCode.maxUsageCount,
        lastUsedAt: qrCode.lastUsedAt,
        qrImagePath: qrCode.qrImagePath,
        promotion: {
          name: qrCode.promotion.name,
          description: qrCode.promotion.description,
          isActive: qrCode.promotion.isActive,
          expiryDate: qrCode.promotion.expiryDate
        },
        business: qrCode.promotion.createdBy ? {
          name: qrCode.promotion.createdBy.name,
          businessName: qrCode.promotion.createdBy.businessName,
          businessType: qrCode.promotion.createdBy.businessType,
          address: qrCode.promotion.createdBy.address,
          city: qrCode.promotion.createdBy.city,
          postalCode: qrCode.promotion.createdBy.postalCode,
          phoneNumber: qrCode.promotion.createdBy.phoneNumber,
          website: qrCode.promotion.createdBy.website,
          businessLogo: qrCode.promotion.createdBy.businessLogo
        } : null
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Record a share event
// @route   POST /api/qrcodes/:id/share
// @access  Private
exports.shareQRCode = async (req, res) => {
  try {
    const { platform } = req.body;
    
    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required'
      });
    }

    const qrCode = await QRCode.findById(req.params.id).populate('promotion');

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Verifica che l'utente possa condividere questo QR code
    const promotion = await Promotion.findById(qrCode.promotion);
    
    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to share this QR code'
      });
    }

    // Aggiungi la condivisione all'array
    qrCode.shares.push({
      platform: platform,
      sharedAt: new Date(),
      sharedBy: req.user.id
    });
    
    qrCode.totalShares = qrCode.shares.length;
    
    await qrCode.save();

    res.status(200).json({
      success: true,
      message: `QR code shared via ${platform}`,
      data: {
        totalShares: qrCode.totalShares,
        lastShare: qrCode.shares[qrCode.shares.length - 1]
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get share history for a QR code
// @route   GET /api/qrcodes/:id/shares
// @access  Private
exports.getQRCodeShares = async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id)
      .populate('promotion')
      .populate('shares.sharedBy', 'name email');

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Verifica autorizzazione
    const promotion = await Promotion.findById(qrCode.promotion);
    
    if (promotion.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to view shares for this QR code'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        qrCodeId: qrCode._id,
        totalShares: qrCode.totalShares,
        shares: qrCode.shares.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt))
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};