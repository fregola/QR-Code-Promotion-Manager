const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const {
  getAllUsers,
  searchUsers,
  updateUser,
  toggleUserStatus,
  getAdminStats,
  getRecentActivity,
  resetUserPassword,
  getUserDetails,
  deleteUser
} = require('../controllers/admin');

router.use(protect);
router.use(adminOnly);

router.get('/users', getAllUsers);
router.get('/users/search', searchUsers);
router.put('/users/:id', updateUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/stats', getAdminStats);
router.get('/recent-activity', getRecentActivity);
router.post('/users/:id/reset-password', resetUserPassword);
router.get('/users/:id/details', getUserDetails);
router.delete('/users/:id', deleteUser);

module.exports = router;
