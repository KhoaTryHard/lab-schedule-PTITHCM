const { ok, created, fail } = require('../../utils/apiResponse');
const { validationResult } = require('express-validator');
const {
  checkScheduleConstraints,
  createDraftSchedule,
  autoArrangeSchedule,
  getScheduleList,
  approveSchedule,
  publishSchedule,
  getPublishedSchedules
} = require('./schedule.service');

async function listSchedules(req, res) {
  const schedules = await getScheduleList({
    status: req.query.status,
    room_code: req.query.room_code,
    lecturer_user_id: req.query.lecturer_user_id,
    schedule_request_id: req.query.schedule_request_id,
    student_user_id: req.query.student_user_id,
    semester_id: req.query.semester_id,
    week_no: req.query.week_no,
    course_section_id: req.query.course_section_id
  }, req.user);
  return ok(res, { schedules }, 'Successfully fetched schedules');
}

async function checkConstraints(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await checkScheduleConstraints(req.body);
  return ok(res, result, 'Constraint check completed');
}

async function createSchedule(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await createDraftSchedule(req.body, req.user.id);

  if (!result.created) {
    return fail(res, 409, 'Schedule constraints failed', result.constraintResult);
  }

  return created(
    res,
    {
      schedule: result.schedule,
      constraints: result.constraintResult
    },
    'Successfully created draft schedule'
  );
}

async function autoArrange(req, res) {
  return ok(res, await autoArrangeSchedule(req.body), 'Auto arrange options');
}

async function approveScheduleEntry(req, res) {
  const result = await approveSchedule(req.params.id, req.user.id);

  if (!result.ok) {
    return fail(res, result.statusCode, result.message, {
      current_status: result.current_status
    });
  }

  return ok(res, result.schedule, 'Successfully approved schedule');
}

async function publishScheduleEntry(req, res) {
  const result = await publishSchedule(req.params.id, req.user.id);

  if (!result.ok) {
    return fail(res, result.statusCode, result.message, {
      current_status: result.current_status
    });
  }

  return ok(res, result.schedule, 'Successfully published schedule');
}

async function listPublishedSchedules(req, res) {
  const schedules = await getPublishedSchedules({
    schedule_request_id: req.query.schedule_request_id,
    room_code: req.query.room_code,
    lecturer_user_id: req.query.lecturer_user_id,
    student_user_id: req.query.student_user_id,
    semester_id: req.query.semester_id,
    week_no: req.query.week_no,
    course_section_id: req.query.course_section_id
  }, req.user);

  return ok(res, schedules, 'Successfully fetched published schedules');
}

module.exports = {
  listSchedules,
  checkConstraints,
  createSchedule,
  autoArrange,
  approveScheduleEntry,
  publishScheduleEntry,
  listPublishedSchedules
};
