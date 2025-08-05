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
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
lastLogin: {
    type: Date,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  // NUOVI CAMPI LEGALI OBBLIGATORI
  legalAcceptance: {
    acceptedTerms: {
      type: Boolean,
      required: [true, 'Accettazione dei Termini e Condizioni obbligatoria'],
      default: false,
    },
    acceptedPrivacy: {
      type: Boolean,
      required: [true, 'Accettazione della Privacy Policy obbligatoria'],
      default: false,
    },
    acceptedCookies: {
      type: Boolean,
      required: [true, 'Accettazione della Cookie Policy obbligatoria'],
      default: false,
    },
    acceptedMarketing: {
      type: Boolean,
      default: false,
    },
    acceptanceDate: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    }
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

// Validazione personalizzata per i consensi legali
UserSchema.pre('validate', function(next) {
  if (this.isNew) {
    if (!this.legalAcceptance.acceptedTerms) {
      this.invalidate('legalAcceptance.acceptedTerms', 'Devi accettare i Termini e Condizioni per procedere');
    }
    if (!this.legalAcceptance.acceptedPrivacy) {
      this.invalidate('legalAcceptance.acceptedPrivacy', 'Devi accettare la Privacy Policy per procedere');
    }
    if (!this.legalAcceptance.acceptedCookies) {
      this.invalidate('legalAcceptance.acceptedCookies', 'Devi accettare la Cookie Policy per procedere');
    }
  }
  next();
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Metodo per aggiornare i consensi legali
UserSchema.methods.updateLegalConsents = function(consents, ipAddress, userAgent) {
  this.legalAcceptance = {
    ...this.legalAcceptance,
    ...consents,
    acceptanceDate: new Date(),
    ipAddress: ipAddress,
    userAgent: userAgent
  };
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);

