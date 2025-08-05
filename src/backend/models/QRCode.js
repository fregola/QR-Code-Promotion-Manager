const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const QRCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    default: () => {
      // Genera un codice alfanumerico di 8 caratteri
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  qrImagePath: {
    type: String
  },
  shares: [{
    platform: {
      type: String,
      required: true,
      enum: ['WhatsApp', 'SMS', 'Telegram', 'Email', 'Facebook', 'Twitter', 'LinkedIn', 'Copia Link', 'Condivisione Nativa']
    },
    message: {
      type: String,
      required: true
    },
    recipient: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String
    }
  }],
  totalShares: {
    type: Number,
    default: 0
  },
  lastSharedAt: {
    type: Date
  }
});

// Middleware per impostare maxUsageCount dal valore della promozione associata
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
