const express = require('express');
const { getScopeRooms } = require('./room.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/scope', requireAuth, getScopeRooms);

module.exports = router;
