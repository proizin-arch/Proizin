const express = require('express');
const controller = require('../controllers/leaveController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.get('/history', asyncHandler(controller.history));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.patch('/:id/cancel', requireRole('MANAGER', 'ADMIN'), asyncHandler(controller.cancel));
router.delete('/:id/mine', asyncHandler(controller.removeOwn));
router.post('/:id/approve', requireRole('MANAGER', 'ADMIN'), asyncHandler(controller.approve));
router.post('/:id/reject', requireRole('MANAGER', 'ADMIN'), asyncHandler(controller.reject));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove));

module.exports = router;
