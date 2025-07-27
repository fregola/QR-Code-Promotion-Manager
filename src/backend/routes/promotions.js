const express = require('express');
const {
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotions');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getPromotions)
  .post(protect, createPromotion);

router
  .route('/:id')
  .get(protect, getPromotion)
  .put(protect, updatePromotion)
  .delete(protect, deletePromotion);

module.exports = router;