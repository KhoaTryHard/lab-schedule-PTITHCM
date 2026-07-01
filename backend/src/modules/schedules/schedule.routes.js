const express = require("express");
const { body } = require("express-validator");
const {
  checkConstraints,
  createSchedule,
  autoArrange,
  listSchedules,
  approveScheduleEntry,
  publishScheduleEntry,
  listPublishedSchedules,
  listScheduleWeeks,
  listTimeSlots,
} = require("./schedule.controller");
const { requireAuth } = require("../../middlewares/auth.middleware");
const { requireRoles } = require("../../middlewares/role.middleware");
const { ROLES } = require("../../config/roles");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

function isPositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function validateDraftItem(item, label) {
  if (!isPositiveInteger(item.practice_team_id)) {
    throw new Error(`${label}.practice_team_id must be a positive integer`);
  }

  if (!String(item.room_code || "").trim()) {
    throw new Error(`${label}.room_code is required`);
  }

  if (!isPositiveInteger(item.lecturer_user_id)) {
    throw new Error(`${label}.lecturer_user_id must be a positive integer`);
  }

  if (!isPositiveInteger(item.day_of_week)) {
    throw new Error(`${label}.day_of_week must be between 1 and 7`);
  }

  const dayOfWeek = Number(item.day_of_week);
  if (dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error(`${label}.day_of_week must be between 1 and 7`);
  }

  if (!String(item.time_slot || "").trim()) {
    throw new Error(`${label}.time_slot is required`);
  }

  if (!isDateOnly(item.start_date)) {
    throw new Error(`${label}.start_date must be a valid date (YYYY-MM-DD)`);
  }

  if (!isDateOnly(item.end_date)) {
    throw new Error(`${label}.end_date must be a valid date (YYYY-MM-DD)`);
  }

  if (new Date(item.end_date) < new Date(item.start_date)) {
    throw new Error(
      `${label}.end_date must be greater than or equal to start_date`,
    );
  }

  if (item.notes && String(item.notes).length > 255) {
    throw new Error(`${label}.notes must not exceed 255 characters`);
  }
}

const scheduleDraftValidator = [
  body().custom((_, { req }) => {
    const scheduleItems = Array.isArray(req.body.schedule_items)
      ? req.body.schedule_items
      : null;

    if (scheduleItems) {
      if (scheduleItems.length === 0) {
        throw new Error("schedule_items must not be empty");
      }

      scheduleItems.forEach((item, index) => {
        validateDraftItem(
          {
            ...req.body,
            ...item,
            lab_schedule_request_id:
              item.lab_schedule_request_id || req.body.lab_schedule_request_id,
          },
          `schedule_items[${index}]`,
        );
      });

      return true;
    }

    validateDraftItem(req.body, "body");
    return true;
  }),
];

const checkConstraintsValidator = [
  body("room_code").notEmpty().withMessage("room_code is required"),
  body("lecturer_user_id")
    .isInt({ min: 1 })
    .withMessage("lecturer_user_id must be a positive integer"),
  body("practice_team_id")
    .isInt({ min: 1 })
    .withMessage("practice_team_id must be a positive integer"),
  body("day_of_week")
    .isInt({ min: 1, max: 7 })
    .withMessage("day_of_week must be between 1 and 7"),
  body("time_slot").notEmpty().withMessage("time_slot is required"),
  body("start_date")
    .isDate()
    .withMessage("start_date must be a valid date (YYYY-MM-DD)"),
  body("end_date")
    .isDate()
    .withMessage("end_date must be a valid date (YYYY-MM-DD)")
    .custom((endDate, { req }) => {
      if (
        req.body.start_date &&
        new Date(endDate) < new Date(req.body.start_date)
      ) {
        throw new Error("end_date must be greater than or equal to start_date");
      }
      return true;
    }),
];

router.get("/", requireAuth, asyncHandler(listSchedules));

router.get("/published", requireAuth, asyncHandler(listPublishedSchedules));

router.get("/time-slots", requireAuth, asyncHandler(listTimeSlots));

router.get(
  "/weeks",
  requireAuth,
  requireRoles(
    ROLES.ADMIN,
    ROLES.ACADEMIC_OFFICER,
    ROLES.LECTURER,
    ROLES.STUDENT,
    ROLES.TECHNICIAN,
  ),
  asyncHandler(listScheduleWeeks),
);

router.patch(
  "/:id/approve",
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(approveScheduleEntry),
);

router.patch(
  "/:id/publish",
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(publishScheduleEntry),
);

router.post(
  "/",
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  scheduleDraftValidator,
  asyncHandler(createSchedule),
);

router.post(
  "/check-constraints",
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  checkConstraintsValidator,
  asyncHandler(checkConstraints),
);

router.post(
  "/auto-arrange",
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(autoArrange),
);

module.exports = router;
