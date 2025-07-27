const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  updateProfile, 
  updatePassword,
  forgotPassword,
  resetPassword,
  updateLegalConsents
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updateprofile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);
router.put('/legal-consents', protect, updateLegalConsents);

// Password reset routes (pubbliche - senza protect)
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
