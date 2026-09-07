const express = require('express');
const controller = require('../controllers/settingsController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireRole('ADMIN'), asyncHandler(controller.get));
router.put('/', requireRole('ADMIN'), asyncHandler(controller.update));
router.post('/clear-operations', requireRole('ADMIN'), asyncHandler(controller.clearOperations));
router.post('/factory-reset', requireRole('ADMIN'), asyncHandler(controller.factoryReset));

module.exports = router;
