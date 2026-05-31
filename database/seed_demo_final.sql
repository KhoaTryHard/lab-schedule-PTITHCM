-- =============================================================================
-- seed_demo_final.sql — Demo data for 5 roles: QTV, CBDT, GV, KTV, SV
-- Issue #27 W4-02
--
-- Demo accounts (password: 123456 for all):
--   QTV   : admin
--   CBDT  : cbdt1
--   GV    : gv_ntbnguyen  (sees 2 published entries, Sep 17 + Oct 1 at 2B31)
--   KTV   : ktv1          (sees 7 published entries across 3 rooms)
--   SV    : sv1           (sees 2 published entries via practice team membership)
--
-- Run:
--   .\scripts\reset-demo-db.ps1
--
-- Do not import through PowerShell Get-Content | mysql. Let mysql read this
-- UTF-8 file directly, otherwise Vietnamese text may become question marks.
--
-- Regenerate password hash (bcryptjs, cost 10):
--   cd backend && node -e "const b=require('bcryptjs');console.log(b.hashSync('123456',10));"
-- =============================================================================

USE `lab_schedule_ptit_v2`;

SET FOREIGN_KEY_CHECKS = 0;

-- ─── CLEANUP (reverse dependency order) ──────────────────────────────────────
TRUNCATE TABLE `lab_schedule_entries`;
TRUNCATE TABLE `lab_schedule_requests`;
TRUNCATE TABLE `calendar_holidays`;
TRUNCATE TABLE `practice_team_members`;
TRUNCATE TABLE `practice_teams`;
TRUNCATE TABLE `course_registrations`;
TRUNCATE TABLE `course_section_cohorts`;
TRUNCATE TABLE `course_section_available_slots`;
TRUNCATE TABLE `course_section_lecturers`;
TRUNCATE TABLE `course_sections`;
TRUNCATE TABLE `academic_weeks`;
TRUNCATE TABLE `course_software_requirements`;
TRUNCATE TABLE `courses`;
TRUNCATE TABLE `student_profiles`;
TRUNCATE TABLE `student_cohorts`;
TRUNCATE TABLE `technician_profiles`;
TRUNCATE TABLE `lecturer_profiles`;
TRUNCATE TABLE `room_software_installations`;
TRUNCATE TABLE `software_packages`;
TRUNCATE TABLE `rooms`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `semesters`;
TRUNCATE TABLE `time_slots`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SECTION 1: MASTER DATA
-- =============================================================================

-- ─── 1. time_slots ───────────────────────────────────────────────────────────
INSERT INTO `time_slots` (`id`, `slot_label`, `start_period`, `end_period`, `start_time`, `end_time`, `is_active`) VALUES
(1, '1-4',  1,  4, '07:00:00', '11:00:00', 1),
(2, '7-10', 7, 10, '13:00:00', '17:00:00', 1);

-- ─── 2. semesters ────────────────────────────────────────────────────────────
INSERT INTO `semesters` (`id`, `academic_year`, `semester_no`, `semester_name`, `start_date`, `end_date`, `is_active`) VALUES
(1, '2025-2026', 1, 'HK1 2025-2026', '2025-09-01', '2026-01-15', 0),
(2, '2025-2026', 2, 'HK2 2025-2026', '2026-02-01', '2026-06-30', 1);

-- ─── 3. software_packages ────────────────────────────────────────────────────
INSERT INTO `software_packages` (`id`, `software_name`, `software_version`) VALUES
(1, 'Visual Studio Code', '1.85'),
(2, 'Python',             '3.11'),
(3, 'MySQL Workbench',    '8.0');

-- ─── 4. student_cohorts ──────────────────────────────────────────────────────
INSERT INTO `student_cohorts` (`id`, `cohort_code`, `faculty_name`, `major_name`, `intake_year`, `cohort_status`) VALUES
(1, 'D23CQAT01-N', 'Khoa Viễn thông 1', 'An toàn thông tin',      '2023', 'active'),
(2, 'D23CQCN01-N', 'Khoa CNTT',         'Công nghệ phần mềm',     '2023', 'active');

-- ─── 5. users (password: 123456) ─────────────────────────────────────────────
-- Hash below: bcryptjs.hashSync('123456', 10)
SET @pwd = '$2a$10$Qyvjo8FitC/EkN5FhBSwp..JPZLS.Bu0HyL5xxOjQgqCHaj0utk5u';

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `email`, `role_code`, `account_status`) VALUES
( 1, 'admin',         @pwd, 'Quản trị viên',          'admin@ptit.edu.vn',      'QTV',  'active'),
( 2, 'cbdt1',         @pwd, 'Nguyễn Văn An',           'cbdt1@ptit.edu.vn',      'CBDT', 'active'),
( 3, 'gv_phthy',      @pwd, 'Phan Thanh Hy',           'phthy@ptit.edu.vn',      'GV',   'active'),
( 4, 'gv_trnam',      @pwd, 'Trần Hoàng Nam',          'trnam@ptit.edu.vn',      'GV',   'active'),
( 5, 'gv_ntthai',     @pwd, 'Nguyễn Thị Tuyết Hài',   'ntthai@ptit.edu.vn',     'GV',   'active'),
( 6, 'gv_ntbnguyen',  @pwd, 'Nguyễn Thị Bích Nguyên', 'ntbnguyen@ptit.edu.vn',  'GV',   'active'),
( 7, 'gv_nthieu',     @pwd, 'Nguyễn Trung Hiếu',      'nthieu@ptit.edu.vn',     'GV',   'active'),
( 8, 'gv_pnhiep',     @pwd, 'Phan Nghĩa Hiệp',        'pnhiep@ptit.edu.vn',     'GV',   'active'),
( 9, 'ktv1',          @pwd, 'Lê Văn Kỹ',              'ktv1@ptit.edu.vn',       'KTV',  'active'),
(10, 'sv1',           @pwd, 'Phạm Văn Sinh',           'sv1@ptit.edu.vn',        'SV',   'active');

-- ─── 6. rooms ─────────────────────────────────────────────────────────────────
-- usable_student_computers is GENERATED (total - broken - reserved), do NOT insert it
-- 2B11: 31 total, 1 broken, 1 reserved → 29 usable
-- 2B21: 31 total, 0 broken, 1 reserved → 30 usable
-- 2B31: 31 total, 0 broken, 1 reserved → 30 usable
INSERT INTO `rooms` (`id`, `room_code`, `total_computers`, `broken_computers`, `reserved_teacher_computers`, `has_projector`, `has_wifi`, `has_lan`, `room_status`, `primary_technician_user_id`) VALUES
(1, '2B11', 31, 1, 1, 1, 1, 1, 'available', 9),
(2, '2B21', 31, 0, 1, 1, 1, 1, 'available', 9),
(3, '2B31', 31, 0, 1, 1, 1, 1, 'maintenance', 9);

-- ─── 7. lecturer_profiles ────────────────────────────────────────────────────
INSERT INTO `lecturer_profiles` (`user_id`, `lecturer_code`, `department_name`, `academic_rank`) VALUES
( 3, 'GV001', 'Khoa CNTT',       'Tiến sĩ'),
( 4, 'GV002', 'Khoa CNTT',       'Tiến sĩ'),
( 5, 'GV003', 'Khoa CNTT',       'Thạc sĩ'),
( 6, 'GV004', 'Khoa CNTT',       'Tiến sĩ'),
( 7, 'GV005', 'Khoa CNTT',       'Thạc sĩ'),
( 8, 'GV006', 'Khoa Điện tử',    'Tiến sĩ');

-- ─── 8. technician_profiles ──────────────────────────────────────────────────
INSERT INTO `technician_profiles` (`user_id`, `technician_code`, `unit_name`) VALUES
(9, 'KTV001', 'Phòng Quản lý Thiết bị');

-- ─── 9. student_profiles ─────────────────────────────────────────────────────
INSERT INTO `student_profiles` (`user_id`, `student_code`, `cohort_id`, `intake_year`, `training_program`, `student_status`) VALUES
(10, 'B23DCAT001', 1, '2023', 'Đại học chính quy', 'studying');

-- ─── 10. room_software_installations ─────────────────────────────────────────
-- W4-08: software package 1 is installed only in 2B11.
-- This keeps auto-arrange software constraint test deterministic.
INSERT INTO `room_software_installations` (`room_id`, `software_id`, `installed_version`, `installed_on`) VALUES
(1, 1, '1.85', '2025-09-01'), (1, 2, '3.11', '2025-09-01'), (1, 3, '8.0', '2025-09-01'),
(2, 2, '3.11', '2025-09-01'), (2, 3, '8.0', '2025-09-01'),
(3, 2, '3.11', '2025-09-01'), (3, 3, '8.0', '2025-09-01');

-- =============================================================================
-- SECTION 2: ACADEMIC STRUCTURE
-- =============================================================================

-- ─── 11. courses ─────────────────────────────────────────────────────────────
-- is_lab_required is GENERATED (lab_periods > 0), do NOT insert it
INSERT INTO `courses` (`id`, `course_code`, `course_name`, `credits`, `lecture_periods`, `lab_periods`, `course_status`) VALUES
(1, 'INT1303',  'Lập trình hướng đối tượng', 3, 30, 15, 'active'),
(2, 'INT1434',  'Lập trình Web',              3, 30, 15, 'active'),
(3, 'INT1332',  'Cơ sở dữ liệu',             3, 30, 15, 'active'),
(4, 'INT14105', 'Mạng máy tính',              3, 30, 15, 'active');

-- ─── 12. course_software_requirements ────────────────────────────────────────
INSERT INTO `course_software_requirements` (`course_id`, `software_id`, `is_required`) VALUES
(1, 1, 1), -- INT1303  → VS Code
(2, 1, 1), -- INT1434  → VS Code
(3, 3, 1), -- INT1332  → MySQL Workbench
(4, 2, 1); -- INT14105 → Python

-- ─── 13. course_sections ─────────────────────────────────────────────────────
-- group_no is VARCHAR
INSERT INTO `course_sections` (`id`, `course_id`, `semester_id`, `group_no`, `registered_enrollment`, `class_start_date`, `class_end_date`, `section_status`) VALUES
(1, 1, 2, '03', 60, '2026-02-01', '2026-06-30', 'open'), -- INT1303/03  HK2
(2, 2, 2, '03', 60, '2026-02-01', '2026-06-30', 'open'), -- INT1434/03  HK2
(3, 3, 1, '01', 60, '2025-09-01', '2026-01-15', 'open'), -- INT1332/01  HK1
(4, 3, 1, '03', 60, '2025-09-01', '2026-01-15', 'open'), -- INT1332/03  HK1
(5, 3, 1, '04', 60, '2025-09-01', '2026-01-15', 'open'), -- INT1332/04  HK1
(6, 4, 1, '01', 60, '2025-09-01', '2026-01-15', 'open'); -- INT14105/01 HK1

-- ─── 14. course_section_lecturers ────────────────────────────────────────────
INSERT INTO `course_section_lecturers` (`course_section_id`, `lecturer_user_id`, `lecturer_role`) VALUES
(1, 3, 'primary'), -- INT1303/03  → Phan Thanh Hy
(2, 4, 'primary'), -- INT1434/03  → Trần Hoàng Nam
(3, 6, 'primary'), -- INT1332/01  → Nguyễn Thị Bích Nguyên
(4, 5, 'primary'), -- INT1332/03  → Nguyễn Thị Tuyết Hài
(5, 7, 'primary'), -- INT1332/04  → Nguyễn Trung Hiếu
(6, 8, 'primary'); -- INT14105/01 → Phan Nghĩa Hiệp

-- ─── 15. course_section_cohorts ──────────────────────────────────────────────
INSERT INTO `course_section_cohorts` (`course_section_id`, `cohort_id`) VALUES
(3, 1), -- INT1332/01 ← D23CQAT01-N (sv1's cohort)
(4, 1), -- INT1332/03 ← D23CQAT01-N
(5, 2), -- INT1332/04 ← D23CQCN01-N
(6, 2); -- INT14105/01← D23CQCN01-N

-- ─── 16. course_registrations ────────────────────────────────────────────────
INSERT INTO `course_registrations` (`student_user_id`, `course_section_id`, `registration_status`) VALUES
(10, 3, 'registered'); -- sv1 → INT1332/01

-- ─── 17. practice_teams ──────────────────────────────────────────────────────
-- planned_size=29 → passes CAPACITY_OK (usable_student_computers: 2B11=29, 2B21=30, 2B31=30)
INSERT INTO `practice_teams` (`id`, `course_section_id`, `team_no`, `planned_size`, `team_status`, `created_by_user_id`) VALUES
(1, 1, 1, 29, 'ready', 2), -- INT1303/03 tổ 1
(2, 2, 1, 29, 'ready', 2), -- INT1434/03 tổ 1
(3, 2, 2, 29, 'ready', 2), -- INT1434/03 tổ 2 (entry 3, Labor Day draft)
(4, 4, 1, 29, 'ready', 2), -- INT1332/03 tổ 1
(5, 3, 1, 29, 'ready', 2), -- INT1332/01 tổ 1 ← sv1 is a member here
(6, 5, 1, 29, 'ready', 2), -- INT1332/04 tổ 1
(7, 3, 2, 29, 'ready', 2), -- INT1332/01 tổ 2
(8, 6, 1, 29, 'ready', 2), -- INT14105/01 tổ 1
(999, 1, 99, 100, 'ready', 2); -- W4-08 capacity failure team

-- ─── 18. practice_team_members ───────────────────────────────────────────────
INSERT INTO `practice_team_members` (`practice_team_id`, `student_user_id`) VALUES
(5, 10); -- sv1 in INT1332/01 tổ 1 → will see entries 5 and 7

-- =============================================================================
-- SECTION 3: SCHEDULES
-- =============================================================================

-- ─── 19. calendar_holidays ───────────────────────────────────────────────────
INSERT INTO `calendar_holidays` (`id`, `holiday_date`, `holiday_name`, `holiday_type`, `is_lab_scheduling_blocked`, `holiday_status`) VALUES
(1, '2025-09-02', 'Quốc khánh 2/9 (nghỉ bù)',       'national', 1, 'active'),
(2, '2026-05-01', 'Ngày Quốc tế Lao động',           'national', 1, 'active');
-- Note: entry 3 (2026-05-01) is kept as DRAFT because of holiday #2

-- ─── 20. lab_schedule_requests ───────────────────────────────────────────────
-- Covers all key statuses for CBDT demo (7 tabs):
--   published(2), scheduled(2), approved(1), pending_review(1), draft(1)
INSERT INTO `lab_schedule_requests`
  (`id`, `course_section_id`, `requested_team_count`, `max_students_per_team`,
   `total_required_sessions`, `preferred_week_start`, `preferred_week_end`,
   `preferred_day_of_week`, `preferred_time_slot_id`,
   `request_status`, `requested_by_user_id`, `reviewed_by_user_id`, `published_by_user_id`,
   `reviewed_at`, `published_at`, `notes`)
VALUES
-- 1: INT1332/01 → published (has entries 5, 7)
(1, 3, 2, 29, 8, '2025-09-15', '2026-01-10', 4, 2,
 'published', 2, 2, 2, '2025-09-05 09:00:00', '2025-09-06 10:00:00',
 'Yêu cầu xếp lịch TH Cơ sở dữ liệu nhóm 01'),

-- 2: INT1332/03 → scheduled (has entry 4)
(2, 4, 1, 29, 4, '2025-09-15', '2026-01-10', 4, 1,
 'scheduled', 2, 2, NULL, '2025-09-05 09:30:00', NULL,
 'Yêu cầu xếp lịch TH Cơ sở dữ liệu nhóm 03'),

-- 3: INT1303/03 → approved (has entry 1)
(3, 1, 1, 29, 4, '2026-03-01', '2026-06-30', 3, 2,
 'approved', 2, 2, NULL, '2026-02-10 10:00:00', NULL,
 'Yêu cầu xếp lịch TH Lập trình HĐT nhóm 03'),

-- 4: INT1434/03 → pending_review (has entries 2, 3)
(4, 2, 2, 29, 6, '2026-03-01', '2026-06-30', 3, 2,
 'pending_review', 2, NULL, NULL, NULL, NULL,
 'Yêu cầu xếp lịch TH Lập trình Web nhóm 03'),

-- 5: INT1332/04 → scheduled (has entry 6)
(5, 5, 1, 29, 4, '2025-09-15', '2026-01-10', 5, 2,
 'scheduled', 2, 2, NULL, '2025-09-05 11:00:00', NULL,
 'Yêu cầu xếp lịch TH Cơ sở dữ liệu nhóm 04'),

-- 6: INT14105/01 → published (has entry 8)
(6, 6, 1, 29, 4, '2025-09-15', '2025-12-31', 5, 1,
 'published', 2, 2, 2, '2025-09-04 14:00:00', '2025-09-04 15:00:00',
 'Yêu cầu xếp lịch TH Mạng máy tính nhóm 01'),

-- 7: INT1332/01 second request → draft (no entries yet)
(7, 3, 2, 29, 4, '2025-11-01', '2026-01-15', 4, 2,
 'draft', 2, NULL, NULL, NULL, NULL,
 'Dự kiến bổ sung buổi TH bù kỳ 2');

-- ─── 21. lab_schedule_entries ────────────────────────────────────────────────
-- day_of_week: Vietnamese Thứ N encoding (1=CN, 2=T2, 3=T3, 4=T4, 5=T5, 6=T6, 7=T7)
-- Verified dates:
--   2025-09-17 = Wednesday = Thứ 4 = 4
--   2025-09-18 = Thursday  = Thứ 5 = 5
--   2025-10-01 = Wednesday = Thứ 4 = 4
--   2025-10-02 = Thursday  = Thứ 5 = 5
--   2026-03-31 = Tuesday   = Thứ 3 = 3
--   2026-04-28 = Tuesday   = Thứ 3 = 3
--   2026-05-01 = Friday    = Thứ 6 = 6  ← Labor Day holiday → DRAFT

INSERT INTO `lab_schedule_entries`
  (`id`, `lab_schedule_request_id`, `practice_team_id`, `room_id`, `lecturer_user_id`,
   `day_of_week`, `time_slot_id`, `start_date`, `end_date`,
   `entry_status`, `created_by_user_id`, `approved_by_user_id`, `published_by_user_id`,
   `approved_at`, `published_at`)
VALUES
-- Entry 1: INT1303/03 tổ1 | 2B31 | Phan Thanh Hy | Thứ3 | 7-10 | 2026-03-31 | PUBLISHED
(1, 3, 1, 3, 3, 3, 2, '2026-03-31', '2026-03-31',
 'published', 2, 2, 2, '2026-02-11 09:00:00', '2026-02-12 10:00:00'),

-- Entry 2: INT1434/03 tổ1 | 2B11 | Trần Hoàng Nam | Thứ3 | 7-10 | 2026-04-28 | PUBLISHED
(2, 4, 2, 1, 4, 3, 2, '2026-04-28', '2026-04-28',
 'published', 2, 2, 2, '2026-02-15 09:00:00', '2026-02-15 10:00:00'),

-- Entry 3: INT1434/03 tổ2 | 2B11 | Trần Hoàng Nam | Thứ6 | 7-10 | 2026-05-01 | DRAFT (Labor Day)
(3, 4, 3, 1, 4, 6, 2, '2026-05-01', '2026-05-01',
 'draft', 2, NULL, NULL, NULL, NULL),

-- Entry 4: INT1332/03 tổ1 | 2B21 | Nguyễn Thị Tuyết Hài | Thứ4 | 1-4 | 2025-10-01 | PUBLISHED
(4, 2, 4, 2, 5, 4, 1, '2025-10-01', '2025-10-01',
 'published', 2, 2, 2, '2025-09-06 08:00:00', '2025-09-06 09:00:00'),

-- Entry 5: INT1332/01 tổ1 | 2B31 | Nguyễn Thị Bích Nguyên | Thứ4 | 7-10 | 2025-10-01 | PUBLISHED
-- sv1 is member of practice_team 5 → sv1 sees this entry
(5, 1, 5, 3, 6, 4, 2, '2025-10-01', '2025-10-01',
 'published', 2, 2, 2, '2025-09-06 08:30:00', '2025-09-06 09:30:00'),

-- Entry 6: INT1332/04 tổ1 | 2B31 | Nguyễn Trung Hiếu | Thứ5 | 7-10 | 2025-10-02 | PUBLISHED
(6, 5, 6, 3, 7, 5, 2, '2025-10-02', '2025-10-02',
 'published', 2, 2, 2, '2025-09-06 10:00:00', '2025-09-06 11:00:00'),

-- Entry 7: INT1332/01 tổ2 | 2B31 | Nguyễn Thị Bích Nguyên | Thứ4 | 7-10 | 2025-09-17 | PUBLISHED
-- sv1 is NOT in tổ2 (only in tổ1), so sv1 does NOT see this entry
(7, 1, 7, 3, 6, 4, 2, '2025-09-17', '2025-09-17',
 'published', 2, 2, 2, '2025-09-06 08:30:00', '2025-09-06 09:30:00'),

-- Entry 8: INT14105/01 tổ1 | 2B21 | Phan Nghĩa Hiệp | Thứ5 | 1-4 | 2025-09-18 | PUBLISHED
(8, 6, 8, 2, 8, 5, 1, '2025-09-18', '2025-09-18',
 'published', 2, 2, 2, '2025-09-04 15:30:00', '2025-09-04 16:00:00');

-- =============================================================================
-- VERIFICATION QUERIES (uncomment to check after import)
-- =============================================================================
-- SELECT role_code, COUNT(*) AS cnt FROM users GROUP BY role_code;
-- SELECT room_code, room_status, usable_student_computers FROM rooms;
-- SELECT request_status, COUNT(*) AS cnt FROM lab_schedule_requests GROUP BY request_status;
-- SELECT entry_status, COUNT(*) AS cnt FROM lab_schedule_entries GROUP BY entry_status;
-- SELECT e.id, r.room_code, e.day_of_week, ts.slot_label, e.start_date, e.entry_status
--   FROM lab_schedule_entries e
--   JOIN rooms r ON r.id = e.room_id
--   JOIN time_slots ts ON ts.id = e.time_slot_id
--   ORDER BY e.start_date;
