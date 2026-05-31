const pool = require('../../config/database');

function normalizeNotes(notes) {
  if (notes === undefined || notes === null) {
    return null;
  }

  if (typeof notes === 'string') {
    return notes;
  }

  return JSON.stringify(notes);
}

async function recordAuditLog(connectionOrInput, maybeInput) {
  const connection = maybeInput ? connectionOrInput : pool;
  const input = maybeInput || connectionOrInput;

  if (!input?.entity_type || !input?.entity_id || !input?.action_type) {
    return null;
  }

  const [result] = await connection.query(
    `INSERT INTO workflow_audit_logs (
       entity_type,
       entity_id,
       action_type,
       old_status,
       new_status,
       action_by_user_id,
       action_notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.entity_type,
      input.entity_id,
      input.action_type,
      input.old_status || null,
      input.new_status || null,
      input.action_by_user_id || null,
      normalizeNotes(input.action_notes)
    ]
  );

  return result.insertId;
}

function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function listAuditLogs(filters = {}) {
  const conditions = [];
  const params = [];
  const limit = Math.min(Math.max(toPositiveInt(filters.limit) || 100, 1), 200);

  if (filters.entity_type) {
    conditions.push('log.entity_type = ?');
    params.push(String(filters.entity_type).trim());
  }

  if (filters.entity_id) {
    const entityId = toPositiveInt(filters.entity_id);

    if (entityId) {
      conditions.push('log.entity_id = ?');
      params.push(entityId);
    }
  }

  if (filters.action_type) {
    conditions.push('log.action_type = ?');
    params.push(String(filters.action_type).trim());
  }

  const [rows] = await pool.query(
    `SELECT
       log.id,
       log.entity_type,
       log.entity_id,
       log.action_type,
       log.old_status,
       log.new_status,
       log.action_by_user_id,
       actor.username AS action_by_username,
       actor.full_name AS action_by_name,
       log.action_notes,
       log.action_at
     FROM workflow_audit_logs log
     LEFT JOIN users actor ON actor.id = log.action_by_user_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY log.action_at DESC, log.id DESC
     LIMIT ${limit}`,
    params
  );

  return rows;
}

module.exports = {
  listAuditLogs,
  recordAuditLog
};
