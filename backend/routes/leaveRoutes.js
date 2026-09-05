const express = require('express');
const controller = require('../controllers/leaveController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.get('/history', asyncHandler(controller.history));
router.get('/:id', asyncHandler(controller.get));
router.post('/', requireRole('PERSONNEL'), asyncHandler(controller.create));
router.put('/:id', requireRole('PERSONNEL'), asyncHandler(controller.update));
router.patch('/:id/cancel', requireRole('PERSONNEL'), asyncHandler(controller.cancel));
router.post('/:id/approve', requireRole('MANAGER', 'ADMIN'), asyncHandler(controller.approve));
router.post('/:id/reject', requireRole('MANAGER', 'ADMIN'), asyncHandler(controller.reject));

module.exports = router;
