const express = require('express');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
  updateProfile,
  updateProfileWithLogo,
  updateLegalConsents,
} = require('../controllers/auth');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updateprofile', protect, upload.single('businessLogo'), updateProfile);
router.put('/profile-with-logo', protect, updateProfileWithLogo);
router.put('/updatepassword', protect, updatePassword);
router.put('/legal-consents', protect, updateLegalConsents);

// Password reset routes (pubbliche - senza protect)
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
