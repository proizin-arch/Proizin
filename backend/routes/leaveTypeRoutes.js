const express = require('express');
const controller = require('../controllers/leaveTypeController');
const asyncHandler = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.post('/', requireRole('ADMIN'), asyncHandler(controller.create));
router.put('/:id', requireRole('ADMIN'), asyncHandler(controller.update));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove));

module.exports = router;
