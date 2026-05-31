const express = require('express');

const adminRoutes = require('../modules/admin/admin.routes');
const healthRoutes = require('../modules/health/health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const roomRoutes = require('../modules/rooms/room.routes');
const roomOperationRoutes = require('../modules/room-operations/roomOperation.routes');
const scheduleChangeRequestRoutes = require('../modules/schedule-change-requests/scheduleChangeRequest.routes');
const scheduleRequestRoutes = require('../modules/schedule-requests/scheduleRequest.routes');
const scheduleRoutes = require('../modules/schedules/schedule.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/rooms', roomRoutes);
router.use('/', roomOperationRoutes);
router.use('/schedule-change-requests', scheduleChangeRequestRoutes);
router.use('/schedule-requests', scheduleRequestRoutes);
router.use('/schedules', scheduleRoutes);

module.exports = router;
