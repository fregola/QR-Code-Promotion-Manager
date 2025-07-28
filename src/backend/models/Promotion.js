const mongoose = require('mongoose');
const QRCode = require('./QRCode');

const PromotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a promotion name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: false,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUsageCount: {
    type: Number,
    default: 1,
    min: [1, 'Max usage count must be at least 1']
  },
  qrCodesCount: {
    type: Number,
    required: [true, 'Please specify how many QR codes to generate'],
    min: [1, 'Must generate at least 1 QR code']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with virtuals
PromotionSchema.virtual('qrCodes', {
  ref: 'QRCode',
  localField: '_id',
  foreignField: 'promotion',
  justOne: false
});

// Cascade delete QR codes when a promotion is deleted
PromotionSchema.pre(['remove', 'deleteOne', 'findOneAndDelete'], async function(next) {
  await QRCode.deleteMany({ promotion: this._id });
  next();
});

module.exports = mongoose.model('Promotion', PromotionSchema);