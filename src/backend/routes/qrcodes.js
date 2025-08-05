const express = require('express');
const {
  getQRCodes,
  getQRCode,
  verifyQRCode,
  getQRCodeByCode,
  addShare,
  getShares
} = require('../controllers/qrcodes');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(protect, getQRCodes);
router.route('/:id').get(protect, getQRCode);
router.route('/verify').post(verifyQRCode);
router.route('/code/:code').get(getQRCodeByCode);
router.route('/:code/share').post(protect, addShare);
router.route('/:code/shares').get(protect, getShares);

module.exports = router;
