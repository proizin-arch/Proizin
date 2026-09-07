const express = require('express');
const controller = require('../controllers/departmentController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.post('/', requireRole('ADMIN'), asyncHandler(controller.create));
router.put('/:id', requireRole('ADMIN'), asyncHandler(controller.update));
router.patch('/:id/status', requireRole('ADMIN'), asyncHandler(controller.setStatus));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove));

module.exports = router;
