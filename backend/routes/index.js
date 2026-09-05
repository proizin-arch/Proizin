const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const departmentRoutes = require('./departmentRoutes');
const leaveTypeRoutes = require('./leaveTypeRoutes');
const leaveRoutes = require('./leaveRoutes');
const dashboardController = require('../controllers/dashboardController');
const departmentController = require('../controllers/departmentController');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.get('/public/departments', asyncHandler(departmentController.publicList));
router.use('/auth', authRoutes);
router.use(requireAuth);
router.get('/dashboard/summary', asyncHandler(dashboardController.summary));
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/leave-types', leaveTypeRoutes);
router.use('/leave-requests', leaveRoutes);

module.exports = router;
