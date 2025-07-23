const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ScanHistorySchema = new mongoose.Schema({
  scannedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  location: {
    type: String
  }
}, { _id: false });

const QRCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => {
      return Math.random().toString(36).substring(2, 6) +
             Math.random().toString(36).substring(2, 6);
    }
  },
  promotion: {
    type: mongoose.Schema.ObjectId,
    ref: 'Promotion',
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsageCount: {
    type: Number,
    default: 1
  },
  lastUsedAt: {
    type: Date
  },
  firstUsedAt: {
    type: Date
  },
  scanHistory: [ScanHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  qrImagePath: {
    type: String
  }
});

QRCodeSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Promotion = this.model('Promotion');
      const promotion = await Promotion.findById(this.promotion);
      
      if (promotion) {
        this.maxUsageCount = promotion.maxUsageCount;
      }
    } catch (err) {
      console.error('Error setting maxUsageCount from promotion:', err);
    }
  }
  next();
});

module.exports = mongoose.model('QRCode', QRCodeSchema);
