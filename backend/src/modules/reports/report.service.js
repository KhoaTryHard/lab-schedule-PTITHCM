const pool = require('../../config/database');

function toNumber(value) {
  return Number(value || 0);
}

function normalizeSummary(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [key, toNumber(value)])
  );
}

async function getScheduleSummary() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_scheduled,
       SUM(entry_status = 'draft') AS draft_sessions,
       SUM(entry_status = 'approved') AS approved_sessions,
       SUM(entry_status = 'published') AS published_sessions,
       SUM(entry_status = 'cancelled') AS cancelled_sessions,
       SUM(entry_status = 'completed') AS completed_sessions
     FROM lab_schedule_entries`
  );

  return normalizeSummary(rows[0]);
}

async function getRoomUsage() {
  const [rows] = await pool.query(
    `SELECT
       room.room_code,
       COUNT(schedule.id) AS total_sessions,
       SUM(schedule.entry_status = 'published') AS published_sessions,
       SUM(schedule.entry_status = 'cancelled') AS cancelled_sessions,
       SUM(schedule.entry_status = 'completed') AS completed_sessions
     FROM rooms room
     LEFT JOIN lab_schedule_entries schedule ON schedule.room_id = room.id
     GROUP BY room.id, room.room_code
     ORDER BY room.room_code`
  );

  return rows.map((row) => ({
    room_code: row.room_code,
    total_sessions: toNumber(row.total_sessions),
    published_sessions: toNumber(row.published_sessions),
    cancelled_sessions: toNumber(row.cancelled_sessions),
    completed_sessions: toNumber(row.completed_sessions)
  }));
}

async function getIssueSummary() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_issues,
       SUM(issue_status = 'new') AS new_issues,
       SUM(issue_status = 'in_progress') AS in_progress_issues,
       SUM(issue_status = 'resolved') AS resolved_issues,
       SUM(issue_status = 'closed') AS closed_issues
     FROM room_issue_reports`
  );

  return normalizeSummary(rows[0]);
}

async function getRoomBlockSummary() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_blocks,
       SUM(block_status = 'submitted') AS submitted_blocks,
       SUM(block_status = 'approved') AS approved_blocks,
       SUM(block_status = 'rejected') AS rejected_blocks
     FROM room_block_requests`
  );

  return normalizeSummary(rows[0]);
}

async function getChangeRequestSummary() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_change_requests,
       SUM(change_type = 'reschedule') AS reschedule_requests,
       SUM(change_type = 'makeup') AS makeup_requests,
       SUM(change_type = 'cancel') AS cancel_requests,
       SUM(request_status = 'submitted') AS submitted_requests,
       SUM(request_status = 'approved') AS approved_requests,
       SUM(request_status = 'implemented') AS implemented_requests,
       SUM(request_status = 'rejected') AS rejected_requests
     FROM lab_schedule_change_requests`
  );

  return normalizeSummary(rows[0]);
}

async function getFeedbackSummary() {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS total_feedback,
       SUM(feedback_status = 'submitted') AS submitted_feedback,
       SUM(feedback_status = 'under_review') AS under_review_feedback,
       SUM(feedback_status = 'responded') AS responded_feedback,
       SUM(feedback_status = 'closed') AS closed_feedback
     FROM student_feedback`
  );

  return normalizeSummary(rows[0]);
}

async function getBasicReport() {
  const [
    schedule_summary,
    room_usage,
    issue_summary,
    room_block_summary,
    change_request_summary,
    feedback_summary
  ] = await Promise.all([
    getScheduleSummary(),
    getRoomUsage(),
    getIssueSummary(),
    getRoomBlockSummary(),
    getChangeRequestSummary(),
    getFeedbackSummary()
  ]);

  return {
    generated_at: new Date().toISOString(),
    schedule_summary,
    room_usage,
    issue_summary,
    room_block_summary,
    change_request_summary,
    feedback_summary,
    data_sources: [
      {
        metric: 'Scheduled/published session counts',
        source: 'lab_schedule_entries'
      },
      {
        metric: 'Room usage by room',
        source: 'rooms + lab_schedule_entries'
      },
      {
        metric: 'Issue counts',
        source: 'room_issue_reports'
      },
      {
        metric: 'Room block counts',
        source: 'room_block_requests'
      },
      {
        metric: 'Change/cancel counts',
        source: 'lab_schedule_change_requests'
      },
      {
        metric: 'Student feedback counts',
        source: 'student_feedback'
      }
    ]
  };
}

module.exports = {
  getBasicReport
};
