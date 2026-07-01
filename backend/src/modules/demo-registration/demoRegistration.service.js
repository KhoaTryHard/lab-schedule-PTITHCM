const pool = require("../../config/database");
const { recordAuditLog } = require("../audit/audit.service");

function groupByCourseSection(rows) {
  return rows.reduce((map, row) => {
    const sectionId = Number(row.course_section_id);
    if (!map.has(sectionId)) {
      map.set(sectionId, []);
    }

    map.get(sectionId).push(row);
    return map;
  }, new Map());
}

async function simulatePracticeTeamMembers(user) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [teamRows] = await connection.query(
      `SELECT
         id AS practice_team_id,
         course_section_id,
         team_no,
         planned_size
       FROM practice_teams
       WHERE team_status <> 'cancelled'
       ORDER BY course_section_id, team_no, id`,
    );

    if (teamRows.length === 0) {
      await connection.rollback();

      return {
        practice_team_count: 0,
        student_count: 0,
        inserted_member_count: 0,
        skipped_existing_count: 0,
      };
    }

    const [studentRows] = await connection.query(
      `SELECT id AS student_user_id
       FROM users
       WHERE role_code = 'SV'
         AND account_status = 'active'
       ORDER BY id`,
    );

    if (studentRows.length === 0) {
      await connection.rollback();

      return {
        practice_team_count: teamRows.length,
        student_count: 0,
        inserted_member_count: 0,
        skipped_existing_count: 0,
      };
    }

    const [registrationRows] = await connection.query(
      `SELECT DISTINCT
         cr.course_section_id,
         cr.student_user_id
       FROM course_registrations cr
       JOIN users u ON u.id = cr.student_user_id
       WHERE cr.registration_status = 'registered'
         AND u.role_code = 'SV'
         AND u.account_status = 'active'
       ORDER BY cr.course_section_id, cr.student_user_id`,
    );

    const teamsBySection = groupByCourseSection(teamRows);
    const registeredBySection = groupByCourseSection(registrationRows);
    const allStudentIds = studentRows.map((row) => Number(row.student_user_id));
    const values = [];

    for (const [sectionId, teams] of teamsBySection.entries()) {
      const registeredStudents = registeredBySection
        .get(sectionId)
        ?.map((row) => Number(row.student_user_id));

      const studentIds =
        registeredStudents && registeredStudents.length > 0
          ? registeredStudents
          : allStudentIds;

      studentIds.forEach((studentUserId, studentIndex) => {
        const targetTeam = teams[studentIndex % teams.length];

        values.push([targetTeam.practice_team_id, studentUserId]);
      });
    }

    if (values.length === 0) {
      await connection.rollback();

      return {
        practice_team_count: teamRows.length,
        student_count: studentRows.length,
        inserted_member_count: 0,
        skipped_existing_count: 0,
      };
    }

    const [insertResult] = await connection.query(
      `INSERT IGNORE INTO practice_team_members (
         practice_team_id,
         student_user_id,
         assigned_at
       ) VALUES ?`,
      [
        values.map(([practiceTeamId, studentUserId]) => [
          practiceTeamId,
          studentUserId,
          new Date(),
        ]),
      ],
    );

    const insertedCount = Number(insertResult.affectedRows || 0);

    await recordAuditLog(connection, {
      entity_type: "practice_team_members",
      entity_id: 1,
      action_type: "demo_simulate_registration",
      old_status: null,
      new_status: null,
      action_by_user_id: user.id,
      action_notes: {
        practice_team_count: teamRows.length,
        student_count: studentRows.length,
        attempted_member_count: values.length,
        inserted_member_count: insertedCount,
        skipped_existing_count: values.length - insertedCount,
      },
    });

    await connection.commit();

    return {
      practice_team_count: teamRows.length,
      student_count: studentRows.length,
      attempted_member_count: values.length,
      inserted_member_count: insertedCount,
      skipped_existing_count: values.length - insertedCount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  simulatePracticeTeamMembers,
};
