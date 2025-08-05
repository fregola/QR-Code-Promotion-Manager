const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { getVerificationEmailTemplate, getWelcomeEmailTemplate } = require('../utils/emailTemplates');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    console.log('🔥 REGISTER FUNCTION CALLED');  
    try {
      const { name, email, password, legalAcceptance, acceptedTerms, acceptedPrivacy, acceptedCookies } = req.body;

  // Gestisci entrambi i formati (strutturato e piatto)
  const legal = legalAcceptance || {
    acceptedTerms,
    acceptedPrivacy, 
    acceptedCookies
  };

// Validazione accettazione legale
if (!legal?.acceptedTerms || !legal?.acceptedPrivacy || !legal?.acceptedCookies) {
      return res.status(400).json({
        success: false,
        error: 'È necessario accettare tutti i termini legali per procedere con la registrazione'
      });
    }

    // Crea utente (NON VERIFICATO)
    const user = await User.create({
      name,
      email,
      password,
      legalAcceptance: legal,
      emailVerified: false
    });

    // Genera token di verifica
    const verifyToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
    await user.save();

    // URL di verifica
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verifyToken}`;

    // Invia email di verifica
    try {
      await sendEmail({
        email: user.email,
        subject: '✅ Conferma il tuo account - QR Code Promotion Manager',
        html: getVerificationEmailTemplate(user.name, verifyUrl)
      });

      res.status(201).json({
        success: true,
        message: 'Registrazione completata! Controlla la tua email per confermare l\'account.',
        data: {
          needsVerification: true,
          email: user.email
        }
      });
    } catch (emailError) {
      console.error('Errore invio email:', emailError);
      // Elimina l'utente se non riesce a inviare l'email
      await User.findByIdAndDelete(user._id);
      
      res.status(500).json({
        success: false,
        error: 'Errore nell\'invio dell\'email di verifica. Riprova la registrazione.'
      });
    }
  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(400).json({
      success: false,
      error: error.message
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

    // Controlla se l'email è verificata
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        error: 'Devi confermare la tua email prima di accedere. Controlla la tua casella di posta.',
        needsVerification: true,
        email: user.email
      });
    }

// Log accesso per audit

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
// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  console.log('🎯 VERIFY EMAIL FUNCTION CALLED');
  try {
    // Hash del token ricevuto
    const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token di verifica non valido o scaduto'
      });
    }

    // Attiva l'account
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Invia email di benvenuto
    try {
      await sendEmail({
        email: user.email,
        subject: '🎉 Account confermato - Benvenuto!',
        html: getWelcomeEmailTemplate(user.name)
      });
    } catch (emailError) {
      console.error('Errore invio email benvenuto:', emailError);
    }

    // Reindirizza alla pagina di successo
    res.redirect(`https://qrcodepromotion.it/email-verified?success=true`);
  } catch (error) {
    console.error('Errore verifica email:', error);
    res.status(500).json({
      success: false,
      error: 'Errore del server'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email già verificata'
      });
    }

    // Genera nuovo token
    const verifyToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 ore
    await user.save();

    // URL di verifica
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verifyToken}`;

    // Invia email
    await sendEmail({
      email: user.email,
      subject: '✅ Conferma il tuo account - QR Code Promotion Manager',
      html: getVerificationEmailTemplate(user.name, verifyUrl)
    });

    res.json({
      success: true,
      message: 'Email di verifica inviata nuovamente'
    });
  } catch (error) {
    console.error('Errore reinvio email:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel reinvio dell\'email'
    });
  }
};
