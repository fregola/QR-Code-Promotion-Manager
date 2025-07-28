const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      businessName,
      businessType,
      address,
      city,
      postalCode,
      vatNumber,
      phoneNumber,
      website,
      businessLogo,
      // NUOVI CAMPI LEGALI
      acceptedTerms,
      acceptedPrivacy,
      acceptedCookies,
      acceptedMarketing
    } = req.body;

    // VALIDAZIONE CONSENSI LEGALI OBBLIGATORI
    if (!acceptedTerms) {
      return res.status(400).json({
        success: false,
        error: 'Devi accettare i Termini e Condizioni per procedere con la registrazione'
      });
    }

    if (!acceptedPrivacy) {
      return res.status(400).json({
        success: false,
        error: 'Devi accettare la Privacy Policy per procedere con la registrazione'
      });
    }

    if (!acceptedCookies) {
      return res.status(400).json({
        success: false,
        error: 'Devi accettare la Cookie Policy per procedere con la registrazione'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email già in uso'
      });
    }

    // Ottieni informazioni per tracciabilità legale
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.get('User-Agent') || '';

    // Create user with optional business fields and legal acceptance
    const user = await User.create({
      name,
      email,
      password,
      role,
      // Consensi legali obbligatori
      legalAcceptance: {
        acceptedTerms: true,
        acceptedPrivacy: true,
        acceptedCookies: true,
        acceptedMarketing: acceptedMarketing || false,
        acceptanceDate: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent
      },
      // Include optional business fields if provided
      ...(businessName && { businessName }),
      ...(businessType && { businessType }),
      ...(address && { address }),
      ...(city && { city }),
      ...(postalCode && { postalCode }),
      ...(vatNumber && { vatNumber }),
      ...(phoneNumber && { phoneNumber }),
      ...(website && { website }),
      ...(businessLogo && { businessLogo })
    });

    // Log registrazione per audit legale
    console.log(`[LEGAL AUDIT] New user registered: ${email} at ${new Date().toISOString()} from IP: ${ipAddress}`);

    // Return success without sensitive data
    res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        legalAcceptance: {
          acceptedTerms: user.legalAcceptance.acceptedTerms,
          acceptedPrivacy: user.legalAcceptance.acceptedPrivacy,
          acceptedCookies: user.legalAcceptance.acceptedCookies,
          acceptedMarketing: user.legalAcceptance.acceptedMarketing,
          acceptanceDate: user.legalAcceptance.acceptanceDate
        }
      },
      token: user.getSignedJwtToken()
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Gestione errori di validazione Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Errore del server durante la registrazione'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e password sono obbligatori'
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Log accesso per audit
    const ipAddress = req.ip || req.connection.remoteAddress;
    console.log(`[AUDIT] User login: ${email} at ${new Date().toISOString()} from IP: ${ipAddress}`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: user.getSignedJwtToken()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server durante il login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode,
      vatNumber: req.body.vatNumber,
      phoneNumber: req.body.phoneNumber,
      website: req.body.website
    };

    // Se è stato caricato un file logo, aggiungi il percorso
    if (req.file) {
      fieldsToUpdate.businessLogo = `/uploads/logos/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Password corrente non corretta'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: 'Password aggiornata con successo'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Nessun utente trovato con questa email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: 'Email di reset inviata',
      resetToken
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token non valido o scaduto'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: 'Password reimpostata con successo'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update user profile with base64 logo (legacy support)
// @route   PUT /api/auth/profile-with-logo
// @access  Private
exports.updateProfileWithLogo = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode,
      vatNumber: req.body.vatNumber,
      phoneNumber: req.body.phoneNumber,
      website: req.body.website,
      businessLogo: req.body.businessLogo // base64 string per compatibilità
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile with logo error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Update legal consents
// @route   PUT /api/auth/legal-consents
// @access  Private
exports.updateLegalConsents = async (req, res) => {
  try {
    const { acceptedTerms, acceptedPrivacy, acceptedCookies, acceptedMarketing } = req.body;
    
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    const user = await User.findById(req.user.id);
    
    await user.updateLegalConsents({
      acceptedTerms,
      acceptedPrivacy, 
      acceptedCookies,
      acceptedMarketing
    }, ipAddress, userAgent);

    console.log(`[LEGAL AUDIT] User ${user.email} updated legal consents at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Consensi legali aggiornati con successo',
      legalAcceptance: user.legalAcceptance
    });

  } catch (error) {
    console.error('Update legal consents error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};
