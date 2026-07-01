const express = require("express");
const { changePassword, login, me, logout } = require("./auth.controller");
const { requireAuth } = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.patch("/change-password", requireAuth, asyncHandler(changePassword));
router.post("/logout", requireAuth, logout);

module.exports = router;
