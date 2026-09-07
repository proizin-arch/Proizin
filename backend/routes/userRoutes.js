const express = require('express');
const controller = require('../controllers/userController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireRole('ADMIN', 'MANAGER'), asyncHandler(controller.list));
router.patch('/profile', asyncHandler(controller.updateProfile));
router.get('/:id/temporary-credentials', requireRole('ADMIN'), asyncHandler(controller.getTemporaryCredentials));
router.get('/:id', asyncHandler(controller.get));
router.post('/', requireRole('ADMIN'), asyncHandler(controller.create));
router.put('/:id', requireRole('ADMIN'), asyncHandler(controller.update));
router.patch('/:id/status', requireRole('ADMIN'), asyncHandler(controller.setStatus));
router.post('/:id/reset-password', requireRole('ADMIN'), asyncHandler(controller.resetPassword));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove));

module.exports = router;
