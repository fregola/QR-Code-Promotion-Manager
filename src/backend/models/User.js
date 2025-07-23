const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin'],
    default: 'user',
  },
  planType: {
    type: String,
    enum: ['free', 'pro', 'pro_test'],
    default: 'free'
  },
  planExpiresAt: {
    type: Date,
    default: null
  },
  // CONTATORI MENSILI
  currentMonth: {
    type: String, // formato: "2025-07"
    default: () => new Date().toISOString().slice(0, 7)
  },
  monthlyPromotionsCount: {
    type: Number,
    default: 0
  },
  monthlyQrCodesCount: {
    type: Number,
    default: 0
  },
  // CONTATORI TOTALI (per statistiche)
  totalPromotionsCount: {
    type: Number,
    default: 0
  },
  totalQrCodesCount: {
    type: Number,
    default: 0
  },
  // Campi aziendali opzionali
  businessName: {
    type: String,
  },
  businessType: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  postalCode: {
    type: String,
  },
  vatNumber: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  website: {
    type: String,
  },
  businessLogo: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// METODO PER RESETTARE CONTATORI MENSILI
UserSchema.methods.resetMonthlyCountersIfNeeded = function() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  if (this.currentMonth !== currentMonth) {
    this.currentMonth = currentMonth;
    this.monthlyPromotionsCount = 0;
    this.monthlyQrCodesCount = 0;
    return true; // Indica che i contatori sono stati resettati
  }
  return false;
};

// METODI PER CONTROLLO LIMITAZIONI MENSILI
UserSchema.methods.canCreatePromotion = function() {
  // Resetta contatori se è un nuovo mese
  this.resetMonthlyCountersIfNeeded();
  
  if (this.planType === 'pro' || this.planType === 'pro_test') {
    return { allowed: true };
  }
  
  if (this.planType === 'free' && this.monthlyPromotionsCount >= 3) {
    return { 
      allowed: false, 
      reason: `Limite di 3 campagne mensili raggiunto per il piano gratuito. Questo mese hai creato ${this.monthlyPromotionsCount}/3 campagne. Passa al piano PRO per campagne illimitate.` 
    };
  }
  
  return { allowed: true };
};

UserSchema.methods.canCreateQRCode = function(quantity = 1) {
  // Resetta contatori se è un nuovo mese
  this.resetMonthlyCountersIfNeeded();
  
  if (this.planType === 'pro' || this.planType === 'pro_test') {
    return { allowed: true };
  }
  
  if (this.planType === 'free' && (this.monthlyQrCodesCount + quantity) > 5) {
    return { 
      allowed: false, 
      reason: `Limite di 5 QR Code mensili raggiunto per il piano gratuito. Questo mese hai creato ${this.monthlyQrCodesCount} QR Code e stai cercando di crearne ${quantity}. Passa al piano PRO per QR Code illimitati.` 
    };
  }
  
  return { allowed: true };
};

UserSchema.methods.isPlanActive = function() {
  if (this.planType === 'free' || this.planType === 'pro_test') {
    return true;
  }
  
  if (this.planType === 'pro') {
    if (!this.planExpiresAt) {
      return false;
    }
    return new Date() < this.planExpiresAt;
  }
  
  return false;
};

module.exports = mongoose.model('User', UserSchema);
