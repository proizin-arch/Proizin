const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const departmentRoutes = require('./departmentRoutes');
const leaveTypeRoutes = require('./leaveTypeRoutes');
const leaveRoutes = require('./leaveRoutes');
const positionRoutes = require('./positionRoutes');
const dashboardController = require('../controllers/dashboardController');
const settingsController = require('../controllers/settingsController');
const setupController = require('../controllers/setupController');
const settingsRoutes = require('./settingsRoutes');
const departmentController = require('../controllers/departmentController');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth, requirePasswordChanged } = require('../middleware/auth');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.get('/setup/status', asyncHandler(settingsController.status));
router.post('/setup/complete', asyncHandler(setupController.complete));
router.post('/auth/register', (_req, res) => res.status(404).json({ success: false, message: 'Yeni hesaplar yalnızca admin tarafından oluşturulur.' }));
router.use('/auth', authRoutes);
router.use(requireAuth);
router.use(requirePasswordChanged);
router.get('/dashboard/summary', asyncHandler(dashboardController.summary));
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/leave-types', leaveTypeRoutes);
router.use('/leave-requests', leaveRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
