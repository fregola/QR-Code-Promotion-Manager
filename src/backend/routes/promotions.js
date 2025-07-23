const express = require('express');
const {
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotions');
const { protect, authorize } = require('../middleware/auth');
const { checkPromotionLimit, checkActivePlan } = require('../middleware/planLimits');

const router = express.Router();

router
  .route('/')
  .get(protect, getPromotions)
  .post(protect, checkActivePlan, checkPromotionLimit, createPromotion);

router
  .route('/:id')
  .get(protect, getPromotion)
  .put(protect, checkActivePlan, updatePromotion)
  .delete(protect, deletePromotion);

module.exports = router;
