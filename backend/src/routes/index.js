const express = require('express');

const healthRoutes = require('../modules/health/health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const roomRoutes = require('../modules/rooms/room.routes');
const scheduleRequestRoutes = require('../modules/schedule-requests/scheduleRequest.routes');
const scheduleRoutes = require('../modules/schedules/schedule.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/schedule-requests', scheduleRequestRoutes);
router.use('/schedules', scheduleRoutes);

module.exports = router;
