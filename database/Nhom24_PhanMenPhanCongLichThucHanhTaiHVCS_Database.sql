DROP DATABASE IF EXISTS lab_schedule_ptit_v2;
CREATE DATABASE IF NOT EXISTS `lab_schedule_ptit_v2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `lab_schedule_ptit_v2`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_code` enum('QTV','CBDT','GV','KTV','SV') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_status` enum('active','locked','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_phone` (`phone_number`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tai khoan dang nhap dung chung cho moi vai tro';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `semesters`
--

DROP TABLE IF EXISTS `semesters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semesters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester_no` tinyint unsigned NOT NULL,
  `semester_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_semesters_year_no` (`academic_year`,`semester_no`),
  CONSTRAINT `chk_semesters_date_range` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hoc ky, vi du Hoc ky 2 - Nam hoc 2025-2026';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `academic_weeks`
--

DROP TABLE IF EXISTS `academic_weeks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_weeks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `semester_id` int unsigned NOT NULL,
  `week_no` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_academic_weeks_semester_week` (`semester_id`,`week_no`),
  CONSTRAINT `fk_academic_weeks_semesters` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_academic_weeks_date_range` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh muc tuan hoc de hien thi thoi khoa bieu tuan';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calendar_holidays`
--

DROP TABLE IF EXISTS `calendar_holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_holidays` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `holiday_date` date NOT NULL,
  `holiday_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `holiday_type` enum('national','academic','campus','makeup_day','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'campus',
  `is_lab_scheduling_blocked` tinyint NOT NULL DEFAULT '1',
  `holiday_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_by_user_id` int unsigned DEFAULT NULL,
  `updated_by_user_id` int unsigned DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_calendar_holidays_date` (`holiday_date`),
  KEY `idx_calendar_holidays_lookup` (`holiday_date`,`holiday_status`,`is_lab_scheduling_blocked`),
  KEY `fk_calendar_holidays_created_by` (`created_by_user_id`),
  KEY `fk_calendar_holidays_updated_by` (`updated_by_user_id`),
  CONSTRAINT `fk_calendar_holidays_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_calendar_holidays_updated_by` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh muc ngay nghi / ngay khong duoc xep lich thuc hanh phong may';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `course_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credits` tinyint unsigned NOT NULL DEFAULT '0',
  `lecture_periods` tinyint unsigned NOT NULL DEFAULT '0',
  `lab_periods` tinyint unsigned NOT NULL DEFAULT '0',
  `is_lab_required` tinyint GENERATED ALWAYS AS ((case when (`lab_periods` > 0) then 1 else 0 end)) STORED,
  `course_status` enum('active','inactive','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_courses_code` (`course_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hoc phan goc, vi du INT1340';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_sections`
--

DROP TABLE IF EXISTS `course_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_sections` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `course_id` int unsigned NOT NULL,
  `semester_id` int unsigned NOT NULL,
  `group_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registered_enrollment` int unsigned NOT NULL DEFAULT '0',
  `planned_enrollment` int unsigned DEFAULT NULL,
  `class_start_date` date DEFAULT NULL,
  `class_end_date` date DEFAULT NULL,
  `section_status` enum('draft','open','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_sections_course_semester_group` (`course_id`,`semester_id`,`group_no`),
  KEY `fk_course_sections_semester` (`semester_id`),
  CONSTRAINT `fk_course_sections_courses` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_course_sections_semesters` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_course_sections_date_range` CHECK (((`class_end_date` is null) or (`class_start_date` is null) or (`class_end_date` >= `class_start_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhom hoc phan mo theo hoc ky, vi du INT1340 - Nhom 02';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_cohorts`
--

DROP TABLE IF EXISTS `student_cohorts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_cohorts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cohort_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `faculty_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `major_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intake_year` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cohort_status` enum('active','inactive','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_cohorts_code` (`cohort_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lop hanh chinh, vi du D23CQAT01-N';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_registrations`
--

DROP TABLE IF EXISTS `course_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_registrations` (
  `student_user_id` int unsigned NOT NULL,
  `course_section_id` int unsigned NOT NULL,
  `registration_status` enum('registered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registered',
  `registered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_user_id`,`course_section_id`),
  KEY `fk_course_registrations_section` (`course_section_id`),
  CONSTRAINT `fk_course_registrations_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_course_registrations_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sinh vien dang ky vao nhom hoc phan';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_section_lecturers`
--

DROP TABLE IF EXISTS `course_section_lecturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_section_lecturers` (
  `course_section_id` int unsigned NOT NULL,
  `lecturer_user_id` int unsigned NOT NULL,
  `lecturer_role` enum('primary','assistant') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'primary',
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_section_id`,`lecturer_user_id`,`lecturer_role`),
  KEY `fk_course_section_lecturers_lecturer` (`lecturer_user_id`),
  CONSTRAINT `fk_course_section_lecturers_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_course_section_lecturers_users` FOREIGN KEY (`lecturer_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giang vien phu trach nhom hoc phan';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `time_slots`
--

DROP TABLE IF EXISTS `time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_slots` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `slot_label` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_period` tinyint unsigned NOT NULL,
  `end_period` tinyint unsigned NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_time_slots_period_range` (`start_period`,`end_period`),
  CONSTRAINT `chk_time_slots_period_range` CHECK ((`end_period` >= `start_period`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Khung tiet thuc te, vi du Tiet 1-4, Tiet 7-10';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_computers` int unsigned NOT NULL DEFAULT '0',
  `broken_computers` int unsigned NOT NULL DEFAULT '0',
  `reserved_teacher_computers` int unsigned NOT NULL DEFAULT '1',
  `usable_student_computers` int GENERATED ALWAYS AS (greatest(((`total_computers` - `broken_computers`) - `reserved_teacher_computers`),0)) STORED,
  `has_projector` tinyint NOT NULL DEFAULT '0',
  `has_wifi` tinyint NOT NULL DEFAULT '0',
  `has_lan` tinyint NOT NULL DEFAULT '0',
  `room_status` enum('available','maintenance','out_of_order','locked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `primary_technician_user_id` int unsigned DEFAULT NULL,
  `last_status_updated_at` datetime DEFAULT NULL,
  `last_condition_report_at` datetime DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rooms_code` (`room_code`),
  KEY `fk_rooms_primary_technician` (`primary_technician_user_id`),
  CONSTRAINT `fk_rooms_primary_technician` FOREIGN KEY (`primary_technician_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_rooms_broken_not_gt_total` CHECK ((`broken_computers` <= `total_computers`)),
  CONSTRAINT `chk_rooms_reserved_not_gt_total` CHECK ((`reserved_teacher_computers` <= `total_computers`))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phong may; chi luu cac thuoc tinh phuc vu xep lich thuc hanh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `device_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type` enum('computer','projector','network','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'computer',
  `spec_or_version` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_status` enum('working','minor_issue','broken','under_repair','replaced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'working',
  `last_updated_at` datetime DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_devices_room_code` (`room_id`,`device_code`),
  KEY `fk_devices_room` (`room_id`),
  KEY `idx_devices_type_status` (`device_type`,`device_status`),
  CONSTRAINT `fk_devices_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh muc thiet bi trong phong may';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_section_available_slots`
--

DROP TABLE IF EXISTS `course_section_available_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_section_available_slots` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `course_section_id` int unsigned NOT NULL,
  `day_of_week` tinyint unsigned NOT NULL COMMENT '1=CN, 2=T2, ..., 7=T7',
  `time_slot_id` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `slot_status` enum('available','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `source_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_section_available_slot` (`course_section_id`,`day_of_week`,`time_slot_id`,`start_date`,`end_date`),
  KEY `idx_course_section_available_slot_lookup` (`course_section_id`,`day_of_week`,`time_slot_id`,`start_date`,`end_date`),
  KEY `fk_course_section_available_slots_time_slot` (`time_slot_id`),
  KEY `fk_course_section_available_slots_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_course_section_available_slots_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_course_section_available_slots_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_course_section_available_slots_time_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_course_section_available_slots_date_range` CHECK ((`end_date` >= `start_date`)),
  CONSTRAINT `chk_course_section_available_slots_day` CHECK ((`day_of_week` between 1 and 7))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cac khung thoi gian trong ma nhom hoc phan duoc phep xep lich thuc hanh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `practice_teams`
--

DROP TABLE IF EXISTS `practice_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practice_teams` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `course_section_id` int unsigned NOT NULL,
  `team_no` smallint unsigned NOT NULL,
  `planned_size` int unsigned NOT NULL DEFAULT '0',
  `team_status` enum('planned','ready','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_practice_teams_section_team` (`course_section_id`,`team_no`),
  KEY `fk_practice_teams_users` (`created_by_user_id`),
  CONSTRAINT `fk_practice_teams_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_practice_teams_users` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='To thuc hanh trong mot nhom hoc phan';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `practice_team_members`
--

DROP TABLE IF EXISTS `practice_team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `practice_team_members` (
  `practice_team_id` int unsigned NOT NULL,
  `student_user_id` int unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`practice_team_id`,`student_user_id`),
  KEY `fk_practice_team_members_student` (`student_user_id`),
  CONSTRAINT `fk_practice_team_members_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_practice_team_members_team` FOREIGN KEY (`practice_team_id`) REFERENCES `practice_teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sinh vien thuoc to thuc hanh nao';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lab_schedule_requests`
--

DROP TABLE IF EXISTS `lab_schedule_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_schedule_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `course_section_id` int unsigned NOT NULL,
  `requested_team_count` smallint unsigned NOT NULL DEFAULT '1',
  `max_students_per_team` int unsigned DEFAULT NULL,
  `total_required_sessions` int unsigned NOT NULL DEFAULT '1',
  `preferred_week_start` date DEFAULT NULL,
  `preferred_week_end` date DEFAULT NULL,
  `preferred_day_of_week` tinyint unsigned DEFAULT NULL COMMENT '1=CN, 2=T2, ..., 7=T7',
  `preferred_time_slot_id` int unsigned DEFAULT NULL,
  `request_status` enum('draft','pending_review','approved','rejected','scheduled','published','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `requested_by_user_id` int unsigned NOT NULL,
  `reviewed_by_user_id` int unsigned DEFAULT NULL,
  `published_by_user_id` int unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_lab_schedule_requests_section` (`course_section_id`),
  KEY `fk_lab_schedule_requests_requested_by` (`requested_by_user_id`),
  KEY `fk_lab_schedule_requests_reviewed_by` (`reviewed_by_user_id`),
  KEY `fk_lab_schedule_requests_published_by` (`published_by_user_id`),
  KEY `fk_lab_schedule_requests_time_slot` (`preferred_time_slot_id`),
  CONSTRAINT `fk_lab_schedule_requests_published_by` FOREIGN KEY (`published_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_requests_requested_by` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_requests_reviewed_by` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_requests_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_requests_time_slot` FOREIGN KEY (`preferred_time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_lab_schedule_requests_day` CHECK (((`preferred_day_of_week` is null) or (`preferred_day_of_week` between 1 and 7))),
  CONSTRAINT `chk_lab_schedule_requests_week_range` CHECK (((`preferred_week_end` is null) or (`preferred_week_start` is null) or (`preferred_week_end` >= `preferred_week_start`)))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yeu cau giao vu tao de xep lich thuc hanh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lab_schedule_entries`
--

DROP TABLE IF EXISTS `lab_schedule_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_schedule_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `lab_schedule_request_id` int unsigned DEFAULT NULL,
  `available_slot_id` int unsigned DEFAULT NULL,
  `practice_team_id` int unsigned NOT NULL,
  `room_id` int unsigned NOT NULL,
  `lecturer_user_id` int unsigned NOT NULL,
  `day_of_week` tinyint unsigned NOT NULL COMMENT '1=CN, 2=T2, ..., 7=T7',
  `time_slot_id` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `entry_status` enum('draft','approved','published','cancelled','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by_user_id` int unsigned NOT NULL,
  `approved_by_user_id` int unsigned DEFAULT NULL,
  `published_by_user_id` int unsigned DEFAULT NULL,
  `cancelled_by_user_id` int unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_schedule_room_conflict` (`room_id`,`day_of_week`,`time_slot_id`,`start_date`,`end_date`),
  KEY `idx_lab_schedule_lecturer_conflict` (`lecturer_user_id`,`day_of_week`,`time_slot_id`,`start_date`,`end_date`),
  KEY `idx_lab_schedule_team` (`practice_team_id`),
  KEY `fk_lab_schedule_entries_request` (`lab_schedule_request_id`),
  KEY `fk_lab_schedule_entries_created_by` (`created_by_user_id`),
  KEY `fk_lab_schedule_entries_approved_by` (`approved_by_user_id`),
  KEY `fk_lab_schedule_entries_published_by` (`published_by_user_id`),
  KEY `fk_lab_schedule_entries_cancelled_by` (`cancelled_by_user_id`),
  KEY `fk_lab_schedule_entries_time_slot` (`time_slot_id`),
  KEY `fk_lab_schedule_entries_available_slot` (`available_slot_id`),
  CONSTRAINT `fk_lab_schedule_entries_approved_by` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_available_slot` FOREIGN KEY (`available_slot_id`) REFERENCES `course_section_available_slots` (`id`),
  CONSTRAINT `fk_lab_schedule_entries_cancelled_by` FOREIGN KEY (`cancelled_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_lecturer` FOREIGN KEY (`lecturer_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_published_by` FOREIGN KEY (`published_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_request` FOREIGN KEY (`lab_schedule_request_id`) REFERENCES `lab_schedule_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_team` FOREIGN KEY (`practice_team_id`) REFERENCES `practice_teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_entries_time_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_lab_schedule_entries_date_range` CHECK ((`end_date` >= `start_date`)),
  CONSTRAINT `chk_lab_schedule_entries_day` CHECK ((`day_of_week` between 1 and 7))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lich thuc hanh phong may (bang trung tam cua de tai)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lab_schedule_change_requests`
--

DROP TABLE IF EXISTS `lab_schedule_change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_schedule_change_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `lab_schedule_entry_id` int unsigned NOT NULL,
  `change_type` enum('reschedule','makeup','cancel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposed_day_of_week` tinyint unsigned DEFAULT NULL COMMENT '1=CN, 2=T2, ..., 7=T7',
  `proposed_time_slot_id` int unsigned DEFAULT NULL,
  `proposed_room_id` int unsigned DEFAULT NULL,
  `proposed_start_date` date DEFAULT NULL,
  `proposed_end_date` date DEFAULT NULL,
  `reason_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_status` enum('draft','submitted','approved','rejected','implemented','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `requested_by_user_id` int unsigned NOT NULL,
  `reviewed_by_user_id` int unsigned DEFAULT NULL,
  `implemented_by_user_id` int unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `implemented_at` datetime DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_lab_schedule_change_requests_time_slot` (`proposed_time_slot_id`),
  KEY `fk_lab_schedule_change_requests_room` (`proposed_room_id`),
  KEY `fk_lab_schedule_change_requests_reviewed_by` (`reviewed_by_user_id`),
  KEY `fk_lab_schedule_change_requests_implemented_by` (`implemented_by_user_id`),
  KEY `fk_lab_schedule_change_requests_entry` (`lab_schedule_entry_id`),
  KEY `fk_lab_schedule_change_requests_requested_by` (`requested_by_user_id`),
  CONSTRAINT `fk_lab_schedule_change_requests_entry` FOREIGN KEY (`lab_schedule_entry_id`) REFERENCES `lab_schedule_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_change_requests_implemented_by` FOREIGN KEY (`implemented_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_change_requests_requested_by` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_change_requests_reviewed_by` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_change_requests_room` FOREIGN KEY (`proposed_room_id`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_schedule_change_requests_time_slot` FOREIGN KEY (`proposed_time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_lab_schedule_change_requests_date_range` CHECK (((`proposed_end_date` is null) or (`proposed_start_date` is null) or (`proposed_end_date` >= `proposed_start_date`))),
  CONSTRAINT `chk_lab_schedule_change_requests_day` CHECK (((`proposed_day_of_week` is null) or (`proposed_day_of_week` between 1 and 7)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yeu cau doi / bu / huy lich thuc hanh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room_block_requests`
--

DROP TABLE IF EXISTS `room_block_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_block_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `block_type` enum('maintenance','repair','exam','reserved','incident','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'maintenance',
  `block_title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `block_reason` text COLLATE utf8mb4_unicode_ci,
  `day_of_week` tinyint unsigned DEFAULT NULL COMMENT 'NULL = ap dung moi thu trong khoang ngay; 1=CN, 2=T2, ..., 7=T7',
  `time_slot_id` int unsigned DEFAULT NULL COMMENT 'NULL = ca ngay; neu co gia tri thi chi chan khung tiet tuong ung',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `block_status` enum('draft','submitted','approved','rejected','cancelled','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `requested_by_user_id` int unsigned NOT NULL,
  `reviewed_by_user_id` int unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_block_requests_conflict` (`room_id`,`day_of_week`,`time_slot_id`,`start_date`,`end_date`,`block_status`),
  KEY `idx_room_block_requests_status` (`block_status`,`start_date`,`end_date`),
  KEY `fk_room_block_requests_time_slot` (`time_slot_id`),
  KEY `fk_room_block_requests_requested_by` (`requested_by_user_id`),
  KEY `fk_room_block_requests_reviewed_by` (`reviewed_by_user_id`),
  CONSTRAINT `fk_room_block_requests_requested_by` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_room_block_requests_reviewed_by` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_room_block_requests_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_room_block_requests_time_slot` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_room_block_requests_date_range` CHECK ((`end_date` >= `start_date`)),
  CONSTRAINT `chk_room_block_requests_day` CHECK (((`day_of_week` is null) or (`day_of_week` between 1 and 7)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Yeu cau khoa/chan phong may de bao tri, sua chua, thi hoac su co';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room_issue_reports`
--

DROP TABLE IF EXISTS `room_issue_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_issue_reports` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `device_id` int unsigned DEFAULT NULL,
  `lab_schedule_entry_id` int unsigned DEFAULT NULL,
  `issue_type` enum('computer','network','projector','power','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `issue_title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_description` text COLLATE utf8mb4_unicode_ci,
  `reported_by_user_id` int unsigned NOT NULL,
  `assigned_to_user_id` int unsigned DEFAULT NULL,
  `issue_status` enum('new','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `detected_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_room_issue_reports_device` (`device_id`),
  KEY `fk_room_issue_reports_entry` (`lab_schedule_entry_id`),
  KEY `fk_room_issue_reports_assigned_to` (`assigned_to_user_id`),
  KEY `fk_room_issue_reports_room` (`room_id`),
  KEY `fk_room_issue_reports_reported_by` (`reported_by_user_id`),
  CONSTRAINT `fk_room_issue_reports_assigned_to` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_room_issue_reports_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_room_issue_reports_entry` FOREIGN KEY (`lab_schedule_entry_id`) REFERENCES `lab_schedule_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_room_issue_reports_reported_by` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_room_issue_reports_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phan anh su co phong may / thiet bi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `notification_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_entity_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_entity_id` int unsigned DEFAULT NULL,
  `created_by_user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notifications_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_notifications_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thong bao he thong';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_recipients`
--

DROP TABLE IF EXISTS `notification_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_recipients` (
  `notification_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `recipient_status` enum('unread','read','acknowledged') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unread',
  `read_at` datetime DEFAULT NULL,
  `acknowledged_at` datetime DEFAULT NULL,
  PRIMARY KEY (`notification_id`,`user_id`),
  KEY `fk_notification_recipients_user` (`user_id`),
  CONSTRAINT `fk_notification_recipients_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notification_recipients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thong bao gui den tung nguoi nhan';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workflow_audit_logs`
--

DROP TABLE IF EXISTS `workflow_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_audit_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int unsigned NOT NULL,
  `action_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_status` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_by_user_id` int unsigned DEFAULT NULL,
  `action_notes` text COLLATE utf8mb4_unicode_ci,
  `action_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_audit_logs_entity` (`entity_type`,`entity_id`),
  KEY `fk_workflow_audit_logs_action_by` (`action_by_user_id`),
  CONSTRAINT `fk_workflow_audit_logs_action_by` FOREIGN KEY (`action_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhat ky luong duyet va thay doi nghiep vu';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- View structure for view `vw_active_calendar_holidays`
--

/*!50001 DROP VIEW IF EXISTS `vw_active_calendar_holidays`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_active_calendar_holidays` AS select `calendar_holidays`.`id` AS `id`,`calendar_holidays`.`holiday_date` AS `holiday_date`,`calendar_holidays`.`holiday_name` AS `holiday_name`,`calendar_holidays`.`holiday_type` AS `holiday_type`,`calendar_holidays`.`is_lab_scheduling_blocked` AS `is_lab_scheduling_blocked`,`calendar_holidays`.`notes` AS `notes` from `calendar_holidays` where ((`calendar_holidays`.`holiday_status` = 'active') and (`calendar_holidays`.`is_lab_scheduling_blocked` = 1)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- View structure for view `vw_active_room_blocks`
--

/*!50001 DROP VIEW IF EXISTS `vw_active_room_blocks`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_active_room_blocks` AS select `rbr`.`id` AS `id`,`rbr`.`room_id` AS `room_id`,`r`.`room_code` AS `room_code`,`rbr`.`block_type` AS `block_type`,`rbr`.`block_title` AS `block_title`,`rbr`.`day_of_week` AS `day_of_week`,`rbr`.`time_slot_id` AS `time_slot_id`,`ts`.`slot_label` AS `slot_label`,`rbr`.`start_date` AS `start_date`,`rbr`.`end_date` AS `end_date`,`rbr`.`block_status` AS `block_status`,`rbr`.`requested_by_user_id` AS `requested_by_user_id`,`requester`.`full_name` AS `requested_by_name`,`rbr`.`reviewed_by_user_id` AS `reviewed_by_user_id`,`reviewer`.`full_name` AS `reviewed_by_name`,`rbr`.`reviewed_at` AS `reviewed_at`,`rbr`.`review_notes` AS `review_notes` from ((((`room_block_requests` `rbr` join `rooms` `r` on((`r`.`id` = `rbr`.`room_id`))) left join `time_slots` `ts` on((`ts`.`id` = `rbr`.`time_slot_id`))) join `users` `requester` on((`requester`.`id` = `rbr`.`requested_by_user_id`))) left join `users` `reviewer` on((`reviewer`.`id` = `rbr`.`reviewed_by_user_id`))) where (`rbr`.`block_status` = 'approved') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- View structure for view `vw_course_section_student_counts`
--

/*!50001 DROP VIEW IF EXISTS `vw_course_section_student_counts`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_course_section_student_counts` AS select `cs`.`id` AS `course_section_id`,count((case when (`cr`.`registration_status` = 'registered') then 1 end)) AS `registered_student_count` from (`course_sections` `cs` left join `course_registrations` `cr` on((`cr`.`course_section_id` = `cs`.`id`))) group by `cs`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- View structure for view `vw_practice_team_student_counts`
--

/*!50001 DROP VIEW IF EXISTS `vw_practice_team_student_counts`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_practice_team_student_counts` AS select `pt`.`id` AS `practice_team_id`,count(`ptm`.`student_user_id`) AS `team_student_count` from (`practice_teams` `pt` left join `practice_team_members` `ptm` on((`ptm`.`practice_team_id` = `pt`.`id`))) group by `pt`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- View structure for view `vw_room_capacity`
--

/*!50001 DROP VIEW IF EXISTS `vw_room_capacity`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_room_capacity` AS select `r`.`id` AS `id`,`r`.`room_code` AS `room_code`,`r`.`total_computers` AS `total_computers`,`r`.`broken_computers` AS `broken_computers`,`r`.`reserved_teacher_computers` AS `reserved_teacher_computers`,`r`.`usable_student_computers` AS `usable_student_computers`,`r`.`has_projector` AS `has_projector`,`r`.`room_status` AS `room_status` from `rooms` `r` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- View structure for view `vw_room_pc_inventory`
--

/*!50001 DROP VIEW IF EXISTS `vw_room_pc_inventory`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_room_pc_inventory` AS select `r`.`room_code` AS `room_code`,`r`.`total_computers` AS `total_computers`,`r`.`broken_computers` AS `broken_computers`,`r`.`reserved_teacher_computers` AS `reserved_teacher_computers`,`r`.`usable_student_computers` AS `usable_student_computers`,count(`d`.`id`) AS `total_pc_devices`,sum((case when (`d`.`device_status` = 'working') then 1 else 0 end)) AS `working_pc_devices`,sum((case when (`d`.`device_status` <> 'working') then 1 else 0 end)) AS `non_working_pc_devices` from (`rooms` `r` left join `devices` `d` on(((`d`.`room_id` = `r`.`id`) and (`d`.`device_type` = 'computer')))) where (`r`.`room_code` in ('2B11','2B21','2B31')) group by `r`.`id`,`r`.`room_code`,`r`.`total_computers`,`r`.`broken_computers`,`r`.`reserved_teacher_computers`,`r`.`usable_student_computers` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- =========================================================
-- SEED DATA SECTION - merged from seed_data_final.sql
-- Keep this after Dump.sql so schema/views exist before data insert.
-- =========================================================

-- =========================================================
-- SEED DATA TỔNG HỢP - lab_schedule_ptit_v2
-- Nguồn: Dump(1).sql + seed_data_mau.sql + course_sections người dùng cung cấp.
-- Mục tiêu: chạy được nhiều lần, lọc trùng bằng UNIQUE KEY, không chèn ID cứng.
-- Cách dùng: chạy Dump(1).sql trước để tạo cấu trúc, sau đó chạy file này.
-- =========================================================

USE `lab_schedule_ptit_v2`;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `workflow_audit_logs`;
TRUNCATE TABLE `notification_recipients`;
TRUNCATE TABLE `notifications`;

TRUNCATE TABLE `room_issue_reports`;
TRUNCATE TABLE `room_block_requests`;

TRUNCATE TABLE `lab_schedule_change_requests`;
TRUNCATE TABLE `lab_schedule_entries`;
TRUNCATE TABLE `lab_schedule_requests`;

TRUNCATE TABLE `practice_team_members`;
TRUNCATE TABLE `practice_teams`;

TRUNCATE TABLE `course_section_available_slots`;
TRUNCATE TABLE `course_section_lecturers`;
TRUNCATE TABLE `course_registrations`;
TRUNCATE TABLE `course_sections`;

TRUNCATE TABLE `academic_weeks`;
TRUNCATE TABLE `calendar_holidays`;

TRUNCATE TABLE `devices`;
TRUNCATE TABLE `rooms`;

TRUNCATE TABLE `time_slots`;

TRUNCATE TABLE `student_cohorts`;

TRUNCATE TABLE `courses`;
TRUNCATE TABLE `semesters`;
TRUNCATE TABLE `users`;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

SELECT 'workflow_audit_logs' AS `table_name`, COUNT(*) AS `total_rows` FROM `workflow_audit_logs`
UNION ALL SELECT 'notification_recipients', COUNT(*) FROM `notification_recipients`
UNION ALL SELECT 'notifications', COUNT(*) FROM `notifications`
UNION ALL SELECT 'room_issue_reports', COUNT(*) FROM `room_issue_reports`
UNION ALL SELECT 'room_block_requests', COUNT(*) FROM `room_block_requests`
UNION ALL SELECT 'lab_schedule_change_requests', COUNT(*) FROM `lab_schedule_change_requests`
UNION ALL SELECT 'lab_schedule_entries', COUNT(*) FROM `lab_schedule_entries`
UNION ALL SELECT 'lab_schedule_requests', COUNT(*) FROM `lab_schedule_requests`
UNION ALL SELECT 'practice_team_members', COUNT(*) FROM `practice_team_members`
UNION ALL SELECT 'practice_teams', COUNT(*) FROM `practice_teams`
UNION ALL SELECT 'course_section_available_slots', COUNT(*) FROM `course_section_available_slots`
UNION ALL SELECT 'course_section_lecturers', COUNT(*) FROM `course_section_lecturers`
UNION ALL SELECT 'course_registrations', COUNT(*) FROM `course_registrations`
UNION ALL SELECT 'course_sections', COUNT(*) FROM `course_sections`
UNION ALL SELECT 'academic_weeks', COUNT(*) FROM `academic_weeks`
UNION ALL SELECT 'calendar_holidays', COUNT(*) FROM `calendar_holidays`
UNION ALL SELECT 'devices', COUNT(*) FROM `devices`
UNION ALL SELECT 'rooms', COUNT(*) FROM `rooms`
UNION ALL SELECT 'time_slots', COUNT(*) FROM `time_slots`
UNION ALL SELECT 'student_cohorts', COUNT(*) FROM `student_cohorts`
UNION ALL SELECT 'courses', COUNT(*) FROM `courses`
UNION ALL SELECT 'semesters', COUNT(*) FROM `semesters`
UNION ALL SELECT 'users', COUNT(*) FROM `users`;

SET NAMES utf8mb4;

START TRANSACTION;

-- 1. Users
INSERT INTO `users` (
  `username`, `password_hash`, `full_name`, `email`, `phone_number`, `role_code`, `account_status`
)
VALUES
  ('admin', '$2a$10$Qyvjo8FitC/EkN5FhBSwp..JPZLS.Bu0HyL5xxOjQgqCHaj0utk5u', 'Quản trị viên', 'admin@ptit.edu.vn', NULL, 'QTV', 'active'),
  ('cbdt1', '$2a$10$UaRpq/fhwEpCXAr0NCD1rOMrdtBunc0uDnyxk43AYnTFlrf0fL.Sy', 'Nguyễn Cán Bộ', 'cbdt1@ptit.edu.vn', '973221110', 'CBDT', 'active'),
  ('gv_ntbnguyen', '$2a$10$TlTs5TEpUUCrYTfOlQebEeNKH73a77wCc8oWO8GzQJeVfP9alL23W', 'Nguyễn Thị Bích Nguyên', 'gv_ntbnguyen@ptit.edu.vn', '973221111', 'GV', 'active'),
  ('gv_ky', '$2a$10$b8kz8b8ofkt7ACznWXU2jusojfSTNkmz0U8uC5pLdbCpLHIqJqJzS', 'Phan Thanh Ky', 'phanthanhky@gmail.com', '973221112', 'GV', 'active'),
  ('gv_nguyen', '$2a$10$FDS.OWfMkLRzAAU/gqN38Omhx4T4uIRJEG9Xf/g0PLIkbq.6fDqCW', 'Nguyễn Thị Bích Nguyên', 'nguyenthibichnguyen@gmail.com', '973221113', 'GV', 'active'),
  ('gv_hai', '$2a$10$2gw3JoZ3fm51sdat/JUx3.YA2QZ5XdfiAOkDOSK5KOKozVFBP0NlW', 'Nguyễn Thị Tuyết Hải', 'nguyenthituyethai@gmail.com', '973221114', 'GV', 'active'),
  ('gv_nam', '$2a$10$M1UvwVgfQyZWRhVt6NVcou1bX92S0vZaSQpI7S9cfP/4vuAtaA1mW', 'Trần Hoàng Nam', 'tranhoangnam@gmail.com', '973221115', 'GV', 'active'),
  ('gv_da', '$2a$10$YsaHx.vVKufkH.1bONq8DuhY/guOcFl9f6mRa2eJwrlKfhwmEERim', 'Nguyễn Hữu Đa', 'nguyenhuuda@gmail.com', '973221116', 'GV', 'active'),
  ('ktv1', '$2a$10$nKoYvpr8BMLS/MYMoL323OTKHDfSfttF20BG57UWRjgnmQmgK1rfu', 'Lê Minh Khoa', 'ktv1@ptit.edu.vn', '973221117', 'KTV', 'active'),
  ('ktv_02', '$2a$10$KrBOqF9Qn3nu7Lu571AZBOiVINcORjK9O9tX0pnbXgBf3SVH7vptW', 'Phạm Quốc Huy', 'phamquochuy@gmail.com', '973221118', 'KTV', 'active'),
  ('ktv_03', '$2a$10$X8dG2QfYQXRVQiroOE5lEeTEZJx9BOn0gLObLGqG7uyXKzHO/hddm', 'Trần Đức Long', 'tranduclong@gmail.com', '973221119', 'KTV', 'active'),
  ('sv1', '$2a$10$fnshcMgGhylvTJ7zT4qZRuGoyf5lTf0uusRpwD.6irpOYLlIwwfza', 'Nguyễn Văn An', 'sv1@ptit.edu.vn', '973221120', 'SV', 'active'),
  ('sv_02', '$2a$10$lhsDrxDDN1U//IV/MpAZtenxsCWqPcYmsPwkjv0mGzbmOjKEZzzR.', 'Trần Thị Mai', 'tranthimai@gmail.com', '973221121', 'SV', 'active'),
  ('sv_03', '$2a$10$5VGYJFnNZk6IkDfog9IMvugomAeRSWbwr6iTiPvF1GuUTKIpSh2tm', 'Lê Hoàng Phúc', 'lehoangphuc@gmail.com', '973221122', 'SV', 'active'),
  ('sv_04', '$2a$10$POhsEyS1GIr2JKL0hIb5jOTS8UMC48KfMAIVr9gTwo.JjHBAVemi2', 'Phạm Minh Quân', 'phamminhquan@gmail.com', '973221123', 'SV', 'active'),
  ('sv_05', '$2a$10$RRKtcnUjRdLjvZbxKeUBG.tePtlLLkunRiHnsvIpRibrDpDwcRwSO', 'Võ Thị Lan Anh', 'vothilanh@gmail.com', '973221124', 'SV', 'active'),
  ('sv_06', '$2a$10$OojMWOhdrWBKSfZgOIinee40HfgUv/0mYSvyalHQm5wP4FQeIRmIK', 'Nguyễn Gia Huy', 'nguyengiahuy@gmail.com', '973221125', 'SV', 'active'),
  ('sv_07', '$2a$10$dflyj7rqdcjZ79.cTD7nVOsLD8f1IDpyzI0/PMlyzec.NOf/V5Sti', 'Đặng Thanh Tùng', 'dangthanhtung@gmail.com', '973221126', 'SV', 'active'),
  ('sv_08', '$2a$10$oWw8Ocskrk9sXk/BktcyL.ywzYnSnn/A7xRaCUAWpiUGyE59PsmZq', 'Bùi Khánh Linh', 'buikhanhlinh@gmail.com', '973221127', 'SV', 'active'),
  ('sv_09', '$2a$10$lW.wQaQocIbCLOJbqZpjWe1FbIrkXEMy1C5Yaazw1F8i2eqmhB5qW', 'Nguyễn Minh Anh', 'nguyenminhanh09@gmail.com', '973221128', 'SV', 'active'),
  ('sv_10', '$2a$10$tdxUxpXLYywZEfGf/rzKYOy3CQ733DB3a04dHHYDhk.3Jgqn7WL2K', 'Trần Quốc Bảo', 'tranquocbao10@gmail.com', '973221129', 'SV', 'active'),
  ('sv_11', '$2a$10$u2umVkWGBVC5Mosk4ywC7eNpMVbma3nMMRZwk7FNaIOsWhoryBBK2', 'Lê Gia Bảo', 'legiabao11@gmail.com', '973221130', 'SV', 'active'),
  ('sv_12', '$2a$10$G2nMJREFgSHEnbY0uAGc2uOSV.psQjmdX5tzRVAJm0uLO5s1q9euq', 'Phạm Tuấn Kiệt', 'phamtuankiet12@gmail.com', '973221131', 'SV', 'active'),
  ('sv_13', '$2a$10$jw38kyU.73bWSTYhNcX9UOTzoWDYD31VOI8LvuHinc1U2to/aW9k6', 'Hoàng Đức Anh', 'hoangducanh13@gmail.com', '973221132', 'SV', 'active'),
  ('sv_14', '$2a$10$mEsv.9wkSKfh2o9557bAbusU0HP04/7QbYjlmfnOjG/voWR.aBEPi', 'Võ Nhật Minh', 'vonhatminh14@gmail.com', '973221133', 'SV', 'active'),
  ('sv_15', '$2a$10$WFAg0wfWPY5ru.o2wMM9e.5wTYbkMJ2ZbeyWahjd57CIToeff9deS', 'Đặng Minh Khang', 'dangminhkhang15@gmail.com', '973221134', 'SV', 'active'),
  ('sv_16', '$2a$10$mDAB/rkrRwTJM4tsDzh9MuN3HDdb8jIV73mr3mAor/bk6ZUGpYy9.', 'Bùi Anh Tuấn', 'buianhtuan16@gmail.com', '973221135', 'SV', 'active'),
  ('sv_17', '$2a$10$2SKweAJkzsv.Vq5QXY16e.4xPlS7.IPaeTwj4pY7Q/YVf9ykb1c3W', 'Đỗ Hoàng Long', 'dohoanglong17@gmail.com', '973221136', 'SV', 'active'),
  ('sv_18', '$2a$10$9hglUj4FwVOTogaSyPrac.4siT7pF60rgdDza2K0JIV9KdnTESMP2', 'Hồ Thanh Bình', 'hothanhbinh18@gmail.com', '973221137', 'SV', 'active'),
  ('sv_19', '$2a$10$9glRC.XtORZUEfs43qoqKeAzLFlr0BwsotLYOj61g9URoB0luw9dy', 'Ngô Quang Huy', 'ngoquanghuy19@gmail.com', '973221138', 'SV', 'active'),
  ('sv_20', '$2a$10$Nac895ZFqe3sjlRwShjdbuR.8YRC28RTjDwUlJHZKn/MpOlIuG5fG', 'Dương Đức Mạnh', 'duongducmanh20@gmail.com', '973221139', 'SV', 'active'),
  ('sv_21', '$2a$10$zFGMZYuUKlPltwMYueXJPu0XXxnbPJpsOI76CggG7MPMjlMhTToua', 'Vũ Hải Đăng', 'vuhaidang21@gmail.com', '973221140', 'SV', 'active'),
  ('sv_22', '$2a$10$jqOPJ5eKiwzoYFwjVgGSSuwsJMCBdvSXu0IfXM7ehcBFOyZg/qnRG', 'Huỳnh Minh Nhật', 'huynhminhnhat22@gmail.com', '973221141', 'SV', 'active'),
  ('sv_23', '$2a$10$UCw0KrlKbVlJ5x1.kVb2ceKRh7wOQwNINBTONSM3mr54bFmFLrM7i', 'Phan Thành Đạt', 'phanthanhdat23@gmail.com', '973221142', 'SV', 'active'),
  ('sv_24', '$2a$10$HtAJlc77/SLZ3GDCaBgJZeodMSa.G917UKoh/sF86WpYBRJGBvudO', 'Mai Gia Hân', 'maigiahan24@gmail.com', '973221143', 'SV', 'active'),
  ('sv_25', '$2a$10$M2diQock2x0WHNSDi2Meeu9qWY5wTmKrMnlmhKD.6JvQA6ARFSeb2', 'Đinh Thảo Vy', 'dinhthaovy25@gmail.com', '973221144', 'SV', 'active'),
  ('sv_26', '$2a$10$FmzNhDc.pQ0o7fAC0wLme.XNW0yPZVfxAdwkzmseCqGln2dVWi6wW', 'Lý Phương Thảo', 'lyphuongthao26@gmail.com', '973221145', 'SV', 'active'),
  ('sv_27', '$2a$10$gd4ZZW26l19D9cwZkliS4.zdT1UDt7i85LxxLCQ2fy5HloCZE3xMe', 'Tạ Ngọc Anh', 'tangocanh27@gmail.com', '973221146', 'SV', 'active'),
  ('sv_28', '$2a$10$k4kjZ.GU9Io.D4iCLDv4Nek6IOLK6FOhrpqrrWf96SXMobo/kLIQm', 'Chu Bảo Ngọc', 'chubaongoc28@gmail.com', '973221147', 'SV', 'active'),
  ('sv_29', '$2a$10$NOdXwuwf6lqDXqAc9qhviuDxZTY5uh5wFUAxl.ur7jf5iPZtd6AEW', 'Cao Minh Châu', 'caominhchau29@gmail.com', '973221148', 'SV', 'active'),
  ('sv_30', '$2a$10$3c8ISlX95K9B39gv/2l5K.1yqQsqrWKd/RCtg6Ey23o53qaLx.LVy', 'Lâm Khánh Vy', 'lamkhanhvy30@gmail.com', '973221149', 'SV', 'active'),
  ('sv_31', '$2a$10$WcSYI8EhZ6sMrK2dKhsuAu26cAbXZZNodSmKmEVM0KcfgR40gbXiq', 'Trịnh Ngọc Hân', 'trinhngochan31@gmail.com', '973221150', 'SV', 'active'),
  ('sv_32', '$2a$10$HNnxWbXumSx79d4d.T.jDONZor/SAW6XCCX4rBEm1pxCsTEZ9gqva', 'Đào Thu Hà', 'daothuha32@gmail.com', '973221151', 'SV', 'active'),
  ('sv_33', '$2a$10$tPvXLN.uwkfHQxoZU3w1IuDIauHRUU/38pCamMaaBEDf7jyJu4sdi', 'Tô Mỹ Duyên', 'tomyduyen33@gmail.com', '973221152', 'SV', 'active'),
  ('sv_34', '$2a$10$lKn0B32PUkxMI59N5AJ5/edj3Dp6SspzcIXqfNRjmq76.mthE3Z3q', 'Nguyễn Hoàng Nam', 'nguyenhoangnam34@gmail.com', '973221153', 'SV', 'active'),
  ('sv_35', '$2a$10$TrgZY/0T3YwIsvV2BUPtMeMImrltntp2WQ8Y/zNf/iPomrvtEOVGO', 'Trần Minh Quân', 'tranminhquan35@gmail.com', '973221154', 'SV', 'active'),
  ('sv_36', '$2a$10$jPFTsvftEJONahhYuyKlqu9j1k8sCC8eKk7FL3xLIXfHf.8n5D4vW', 'Lê Công Thành', 'lecongthanh36@gmail.com', '973221155', 'SV', 'active'),
  ('sv_37', '$2a$10$jZaNlkiVQU/YDr5CSxr8mu0XiO4bAPAg/TWz4n9RmQ8g7YtZocYeq', 'Phạm Anh Dũng', 'phamanhdung37@gmail.com', '973221156', 'SV', 'active'),
  ('sv_38', '$2a$10$2TvSO466as4NXX5FAfp6R.e3xCA2H/ZQePwpSWs6AKE0NH2k3c7cC', 'Hoàng Gia Khánh', 'hoanggiakhanh38@gmail.com', '973221157', 'SV', 'active'),
  ('sv_39', '$2a$10$YUtrOcCCVhbbobvWesDZ.u/1KHpPA32l3lnxlJF6LWZvpxW73sFDe', 'Võ Tiến Đạt', 'votiendat39@gmail.com', '973221158', 'SV', 'active'),
  ('sv_40', '$2a$10$FdT4q1xp4xHRYaJIDOpiDuBpO0dwYBFkJWVQahN3fZYlnBRIxuLsm', 'Đặng Quốc Hưng', 'dangquochung40@gmail.com', '973221159', 'SV', 'active'),
  ('sv_41', '$2a$10$s6evi4g27OyEc3R7g5sDl.cWq/5khJn/an4Z7E5Le0WAQAqoJDmK6', 'Bùi Đức Trí', 'buiductri41@gmail.com', '973221160', 'SV', 'active'),
  ('sv_42', '$2a$10$qRZVwD2WJ9M5DwkXlxByqO1ny024Leu6Ogz6R7HySGV6BNGEMQrFa', 'Đỗ Minh Đức', 'dominhduc42@gmail.com', '973221161', 'SV', 'active'),
  ('sv_43', '$2a$10$hThHgoIubrY14ZBccIOuGuL6h1EnXC9aXNFzzarIiLPQVwVgZz/0i', 'Hồ Anh Khoa', 'hoanhkhoa43@gmail.com', '973221162', 'SV', 'active'),
  ('sv_44', '$2a$10$v7wV//EeHlyMT2KfblFLd.SUiZmicefBi9LaScW9mRNJCCdHqw4iS', 'Ngô Trọng Nghĩa', 'ngotrongnghia44@gmail.com', '973221163', 'SV', 'active'),
  ('sv_45', '$2a$10$pQ.iBfUcl40TZKsyJ7dhOe7TFNG6Odh1aNnOwe/Svy4ymNTOMrLTO', 'Dương Hoài Nam', 'duonghoainam45@gmail.com', '973221164', 'SV', 'active'),
  ('sv_46', '$2a$10$47fLggLllubBrbNLpltrx.4ilQ9VjN4YnefCBCEqWNj723VfWqjl2', 'Vũ Thanh Sơn', 'vuthanhson46@gmail.com', '973221165', 'SV', 'active'),
  ('sv_47', '$2a$10$fq2BjFEwX1nqoqKoKydV2.rE1LjOBqmQBJ3KJPeWY2BwjkaxkvdSK', 'Huỳnh Chí Thanh', 'huynhchithanh47@gmail.com', '973221166', 'SV', 'active'),
  ('sv_48', '$2a$10$1s/2Oa1SzooGaPB99G0awuMF3QFwFR7Dby4IujiltJOIq/sEhgZPm', 'Phan Văn Tài', 'phanvantai48@gmail.com', '973221167', 'SV', 'active'),
  ('sv_49', '$2a$10$x2QyZKZpys8EjDbOrBl2YuIy5hEAf/wyFYllaawy.uzZ7Pb1zU//2', 'Mai Thanh Tâm', 'maithanhtam49@gmail.com', '973221168', 'SV', 'active'),
  ('sv_50', '$2a$10$ix1xQEgiCmamQIgpNH.agOm9VeyJt5qD6VqR2eSXs2/XMuAvl/hCG', 'Đinh Bích Trâm', 'dinhbichtram50@gmail.com', '973221169', 'SV', 'active'),
  ('sv_51', '$2a$10$vfe.Ikc2dfOr/mwbEwxHXO0Vxj5kW5NE.J/aRGBFkMpMXgAkM2fmG', 'Lý Khánh Linh', 'lykhanhlinh51@gmail.com', '973221170', 'SV', 'active'),
  ('sv_52', '$2a$10$J.CRBO8T6Dhl3FWS6WeiR.PuS8WceUc6/FcHU7waMTztE/TWOkjpy', 'Tạ Minh Thư', 'taminhthu52@gmail.com', '973221171', 'SV', 'active'),
  ('sv_53', '$2a$10$GdJU9UK.pvYFfX/gYHoG2..uavQpSwEii7hvkA4R9lVu.QrLwICX.', 'Chu Thùy Dương', 'chuthuyduong53@gmail.com', '973221172', 'SV', 'active'),
  ('sv_54', '$2a$10$x3TepkbY68gm/x7Ie0rHROc/Ygz8tVwSpx05n3EZWPAAqueN3gqne', 'Cao Hà My', 'caohamy54@gmail.com', '973221173', 'SV', 'active'),
  ('sv_55', '$2a$10$mKWz0RtzzDA8oinp1/oYSe7QK6XvwlZ5SSgKdMhkzyw6t18dpuSnO', 'Lâm Hoàng Yến', 'lamhoangyen55@gmail.com', '973221174', 'SV', 'active'),
  ('sv_56', '$2a$10$lN2PtP5Ka1/a3SN.bP51bO3TI7pLQ/qKZf4.3pOvgtT6L2/rhbzOi', 'Trịnh Bảo Trân', 'trinhbaotran56@gmail.com', '973221175', 'SV', 'active'),
  ('sv_57', '$2a$10$PJ6pQNsAtluz7.AqFft2OeoRM5Fyd1TGExIMOlWPVnWAjw9roIcnG', 'Đào Kim Ngân', 'daokimngan57@gmail.com', '973221176', 'SV', 'active'),
  ('sv_58', '$2a$10$DckJ/mChcBWwa4kGCZWJBO3ZbvjjMfNmiEfvZe4Hhpx5nObRbeCZ6', 'Tô Như Quỳnh', 'tonhuquynh58@gmail.com', '973221177', 'SV', 'active'),
  ('sv_59', '$2a$10$aN3tP6kJguF5NZmrxNMgrOj6bKtWFdxfBf6OW.JGwIK4iLmvptQiO', 'Nguyễn Phúc Hậu', 'nguyenphuchau59@gmail.com', '973221178', 'SV', 'active'),
  ('sv_60', '$2a$10$79zX10eLJ/OrTjEvEP4G0OBHzVuJuq0P5HbNx0V3Nm3jf99rhLMhK', 'Trần Gia Huy', 'trangiahuy60@gmail.com', '973221179', 'SV', 'active'),
  ('sv_61', '$2a$10$gPABIqbLenydTRmfb1df8e/kiQiaRvoiWlMCu7REX7w0rIyZ9ELGe', 'Lê Minh Triết', 'leminhtriet61@gmail.com', '973221180', 'SV', 'active'),
  ('sv_62', '$2a$10$Jj6Kf.ECqn8oRA3IPSklReIUENuf0Hmj6zPiNxTV8nz7/QWsHzrJW', 'Phạm Nhật Tân', 'phamnhattan62@gmail.com', '973221181', 'SV', 'active'),
  ('sv_63', '$2a$10$OBMYDDSCCLcyuxz0PQSPauTivrIv4dseT/9XTnHLGQAJ2kFIb/nVK', 'Hoàng Anh Vũ', 'hoanganhvu63@gmail.com', '973221182', 'SV', 'active'),
  ('sv_64', '$2a$10$jpy.frTKdlHD.lvYOz.TjOylHDiK8pOHvtt0OUec87G5SVkqspq/C', 'Võ Thành Nhân', 'vothanhnhan64@gmail.com', '973221183', 'SV', 'active'),
  ('sv_65', '$2a$10$8iA58RXotSIKzEteIjwjg.8r/W5S3nCNYIR4unH7Ietc48n0zM/cW', 'Đặng Hữu Phước', 'danghuuphuoc65@gmail.com', '973221184', 'SV', 'active'),
  ('sv_66', '$2a$10$Vz0AsJNtRBJmAuw4CYxSB.H1lKvZ06IHeATy85YoIhJtZuC3wCu4e', 'Bùi Xuân Lộc', 'buixuanloc66@gmail.com', '973221185', 'SV', 'active'),
  ('sv_67', '$2a$10$CiHGY6cDVps3lpy5nHiOGOahROhgjuWioB9AwpgyeffIvkRHky6c6', 'Đỗ Quang Minh', 'doquangminh67@gmail.com', '973221186', 'SV', 'active'),
  ('sv_68', '$2a$10$kpBEY1kj/ML4anyVz9vZLe2hLhiVnCpwyyz/ODpTjzs0fhouo3iWS', 'Hồ Việt Anh', 'hovietanh68@gmail.com', '973221187', 'SV', 'active')
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `full_name` = VALUES(`full_name`),
  `email` = VALUES(`email`),
  `phone_number` = VALUES(`phone_number`),
  `role_code` = VALUES(`role_code`),
  `account_status` = VALUES(`account_status`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 2. Semesters
INSERT INTO `semesters` (
  `academic_year`, `semester_no`, `semester_name`, `start_date`, `end_date`, `is_active`
)
VALUES
  ('2026 - 2027', 1, 'Học kỳ 1 - Năm học 2026 - 2027', '2026-08-10', '2027-01-10', 1),
  ('2026 - 2027', 2, 'Học kỳ 2 - Năm học 2026 - 2027', '2027-01-11', '2027-06-13', 1)
ON DUPLICATE KEY UPDATE
  `semester_name` = VALUES(`semester_name`),
  `start_date` = VALUES(`start_date`),
  `end_date` = VALUES(`end_date`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 3. Courses
INSERT INTO `courses` (
  `course_code`, `course_name`, `credits`, `lecture_periods`, `lab_periods`, `course_status`, `description`
)
VALUES
  ('INT1154', 'Tin học cơ sở 1', 2, 15, 3, 'active', 'Tích hợp thực hành máy tính văn phòng, xử lý thông tin.'),
  ('INT1155', 'Tin học cơ sở 2', 2, 15, 3, 'active', 'Tích hợp thực hành lập trình C, hệ lệnh vào ra.'),
  ('INT1313', 'Cơ sở dữ liệu', 3, 32, 2, 'active', 'Thực hành truy vấn, thiết kế và quản trị cơ sở dữ liệu.'),
  ('INT13134', 'Thương mại điện tử', 3, 32, 2, 'active', 'Thực hành phân tích hệ thống và cơ sở dữ liệu thương mại điện tử.'),
  ('INT13147', 'Thực tập cơ sở', 3, 30, 3, 'active', 'Thực hành tổng hợp các kỹ năng nền tảng trên máy tính.'),
  ('INT13162', 'Lập trình với Python', 3, 30, 3, 'active', 'Thực hành viết mã Python, xử lý dữ liệu và cấu trúc lệnh.'),
  ('INT1306', 'Cấu trúc dữ liệu và giải thuật', 3, 32, 3, 'active', 'Thực hành cài đặt cấu trúc dữ liệu và thuật toán trên máy tính.'),
  ('INT1319', 'Hệ điều hành', 3, 32, 2, 'active', 'Thực hành các khái niệm tiến trình, bộ nhớ, hệ thống tập tin và lệnh hệ điều hành.'),
  ('INT1332', 'Lập trình hướng đối tượng', 3, 30, 3, 'active', 'Thực hành xây dựng ứng dụng hướng đối tượng và xử lý ngoại lệ.'),
  ('INT1336', 'Mạng máy tính và Internet', 3, 36, 2, 'active', 'Thực hành cấu hình, kiểm tra và mô phỏng mạng máy tính.'),
  ('INT1339', 'Ngôn ngữ lập trình C++', 3, 30, 3, 'active', 'Thực hành lập trình C++, xử lý dữ liệu và xây dựng chương trình.'),
  ('INT1340', 'Nhập môn công nghệ phần mềm', 3, 38, 2, 'active', 'Thực hành quy trình phát triển phần mềm, phân tích và thiết kế cơ bản.'),
  ('INT1341', 'Nhập môn Trí tuệ nhân tạo', 3, 30, 2, 'active', 'Thực hành thiết kế thuật toán, mô hình hóa và bài toán AI cơ bản.'),
  ('INT1342', 'Phân tích và thiết kế hệ thống thông tin', 3, 32, 1, 'active', 'Thực hành mô hình hóa hệ thống, UML và bài tập dự án.'),
  ('INT1344', 'Mật mã học cơ sở', 3, 36, 2, 'active', 'Thực hành thuật toán mã hóa, giải mã và kiểm thử các mô hình mật mã cơ bản.'),
  ('INT1472', 'Cơ sở an toàn thông tin', 3, 34, 2, 'active', 'Thực hành các kỹ thuật nền tảng về an toàn thông tin.'),
  ('INT1484', 'An toàn hệ điều hành', 2, 24, 2, 'active', 'Thực hành cấu hình, kiểm tra và bảo vệ hệ điều hành.'),
  ('INT1487', 'Hệ điều hành Windows và Linux/Unix', 3, 30, 3, 'active', 'Thực hành thao tác, cấu hình và quản trị cơ bản trên Windows, Linux/Unix.'),
  ('INT41218', 'Công cụ toán cho Công nghệ thông tin', 2, 24, 1, 'active', 'Thực hành công cụ tính toán, mô phỏng và bài tập trên máy tính.'),
  ('DAE1301', 'Nhập môn Kỹ thuật dữ liệu', 3, 30, 3, 'active', 'Thực hành case study, vòng đời dữ liệu và xử lý dữ liệu.'),
  ('ELE1319', 'Lý thuyết thông tin', 3, 36, 1, 'active', 'Có thể tổ chức thực hành tính toán lượng tin và mô phỏng truyền tin.'),
  ('ELE1433', 'Kỹ thuật số', 2, 24, 2, 'active', 'Thực hành mô phỏng mạch số và kiểm thử các khối logic cơ bản.'),
  ('OTC1301', 'Mạch điện tử', 3, 30, 2, 'active', 'Thực hành mô phỏng mạch điện tử trực tiếp trên máy tính.'),
  ('SEC1416', 'Ứng dụng AI trong ATTT', 3, 30, 3, 'active', 'Thực hành AI trong phòng thí nghiệm an toàn thông tin.'),
  ('SEC4347', 'Hạ tầng khoá công khai (PKI)', 3, 25, 3, 'active', 'Thực hành triển khai, kiểm thử hạ tầng khóa công khai.'),
  ('SEC4348', 'Học máy và ứng dụng trong ATTT', 3, 25, 3, 'active', 'Thực hành học máy và ứng dụng trong an toàn thông tin.'),
  ('SEC4349', 'DevOps và DevSecOps', 3, 25, 3, 'active', 'Thực hành quy trình DevOps, DevSecOps và tự động hóa triển khai.'),
  ('MUL1426', 'Thiết kế đồ họa cơ bản', 2, 15, 3, 'active', 'Thực hành thiết kế ấn phẩm truyền thông trên máy tính.')
ON DUPLICATE KEY UPDATE
  `course_name` = VALUES(`course_name`),
  `credits` = VALUES(`credits`),
  `lecture_periods` = VALUES(`lecture_periods`),
  `lab_periods` = VALUES(`lab_periods`),
  `course_status` = VALUES(`course_status`),
  `description` = VALUES(`description`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 4. Time slots
INSERT INTO `time_slots` (
  `slot_label`, `start_period`, `end_period`, `start_time`, `end_time`, `is_active`
)
VALUES
  ('Ca sáng', 1, 4, '07:30:00', '10:30:00', 1),
  ('Ca chiều', 7, 11, '13:30:00', '16:30:00', 1)
ON DUPLICATE KEY UPDATE
  `slot_label` = VALUES(`slot_label`),
  `start_time` = VALUES(`start_time`),
  `end_time` = VALUES(`end_time`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 5. Rooms
INSERT INTO `rooms` (
  `room_code`, `total_computers`, `broken_computers`, `reserved_teacher_computers`,
  `has_projector`, `has_wifi`, `has_lan`, `room_status`,
  `primary_technician_user_id`, `last_status_updated_at`, `last_condition_report_at`, `notes`
)
VALUES
  ('2B11', 31, 0, 1, 1, 1, 1, 'available', NULL, NULL, NULL, NULL),
  ('2B21', 31, 0, 1, 1, 1, 1, 'available', NULL, NULL, NULL, NULL),
  ('2B31', 31, 0, 1, 1, 1, 1, 'available', NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE
  `total_computers` = VALUES(`total_computers`),
  `broken_computers` = VALUES(`broken_computers`),
  `reserved_teacher_computers` = VALUES(`reserved_teacher_computers`),
  `has_projector` = VALUES(`has_projector`),
  `has_wifi` = VALUES(`has_wifi`),
  `has_lan` = VALUES(`has_lan`),
  `room_status` = VALUES(`room_status`),
  `primary_technician_user_id` = VALUES(`primary_technician_user_id`),
  `last_status_updated_at` = VALUES(`last_status_updated_at`),
  `last_condition_report_at` = VALUES(`last_condition_report_at`),
  `notes` = VALUES(`notes`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 6. Devices
DROP TEMPORARY TABLE IF EXISTS `tmp_device_seed`;
CREATE TEMPORARY TABLE `tmp_device_seed` (
  `room_code` varchar(20) NOT NULL,
  `device_code` varchar(40) NOT NULL,
  `device_name` varchar(120) NOT NULL,
  `device_type` enum('computer','projector','network','other') NOT NULL DEFAULT 'computer',
  `spec_or_version` varchar(255) DEFAULT NULL,
  `device_status` enum('working','minor_issue','broken','under_repair','replaced') NOT NULL DEFAULT 'working',
  `last_updated_at` datetime DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
);

INSERT INTO `tmp_device_seed` (
  `room_code`, `device_code`, `device_name`, `device_type`, `spec_or_version`,
  `device_status`, `last_updated_at`, `notes`
)
VALUES
  ('2B11', '2B11-GV-01', 'Máy chủ giám sát giảng viên phòng 2B11', 'computer', 'Intel Core i7, RAM 16GB, SSD 512GB, màn hình 24 inch', 'working', '2026-06-30 08:21:42', 'Máy giảng viên/giám sát phòng máy'),
  ('2B11', '2B11-SV-01', 'Máy sinh viên 01 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-02', 'Máy sinh viên 02 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-03', 'Máy sinh viên 03 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-04', 'Máy sinh viên 04 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-05', 'Máy sinh viên 05 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-06', 'Máy sinh viên 06 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-07', 'Máy sinh viên 07 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-08', 'Máy sinh viên 08 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-09', 'Máy sinh viên 09 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-10', 'Máy sinh viên 10 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-11', 'Máy sinh viên 11 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-12', 'Máy sinh viên 12 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-13', 'Máy sinh viên 13 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-14', 'Máy sinh viên 14 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:42', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-15', 'Máy sinh viên 15 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-16', 'Máy sinh viên 16 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-17', 'Máy sinh viên 17 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-18', 'Máy sinh viên 18 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-19', 'Máy sinh viên 19 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-20', 'Máy sinh viên 20 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-21', 'Máy sinh viên 21 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-22', 'Máy sinh viên 22 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-23', 'Máy sinh viên 23 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-24', 'Máy sinh viên 24 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-25', 'Máy sinh viên 25 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-26', 'Máy sinh viên 26 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-27', 'Máy sinh viên 27 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-28', 'Máy sinh viên 28 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-29', 'Máy sinh viên 29 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-30', 'Máy sinh viên 30 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-31', 'Máy sinh viên 31 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-32', 'Máy sinh viên 32 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-33', 'Máy sinh viên 33 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-34', 'Máy sinh viên 34 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-35', 'Máy sinh viên 35 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-36', 'Máy sinh viên 36 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-37', 'Máy sinh viên 37 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-38', 'Máy sinh viên 38 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-39', 'Máy sinh viên 39 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B11', '2B11-SV-40', 'Máy sinh viên 40 phòng 2B11', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-GV-01', 'Máy chủ giám sát giảng viên phòng 2B21', 'computer', 'Intel Core i7, RAM 16GB, SSD 512GB, màn hình 24 inch', 'working', '2026-06-30 08:21:43', 'Máy giảng viên/giám sát phòng máy'),
  ('2B21', '2B21-SV-01', 'Máy sinh viên 01 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-02', 'Máy sinh viên 02 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-03', 'Máy sinh viên 03 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-04', 'Máy sinh viên 04 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-05', 'Máy sinh viên 05 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-06', 'Máy sinh viên 06 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-07', 'Máy sinh viên 07 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-08', 'Máy sinh viên 08 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-09', 'Máy sinh viên 09 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-10', 'Máy sinh viên 10 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-11', 'Máy sinh viên 11 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-12', 'Máy sinh viên 12 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-13', 'Máy sinh viên 13 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-14', 'Máy sinh viên 14 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-15', 'Máy sinh viên 15 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-16', 'Máy sinh viên 16 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-17', 'Máy sinh viên 17 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-18', 'Máy sinh viên 18 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-19', 'Máy sinh viên 19 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-20', 'Máy sinh viên 20 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-21', 'Máy sinh viên 21 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-22', 'Máy sinh viên 22 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-23', 'Máy sinh viên 23 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-24', 'Máy sinh viên 24 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-25', 'Máy sinh viên 25 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-26', 'Máy sinh viên 26 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-27', 'Máy sinh viên 27 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-28', 'Máy sinh viên 28 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-29', 'Máy sinh viên 29 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-30', 'Máy sinh viên 30 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-31', 'Máy sinh viên 31 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-32', 'Máy sinh viên 32 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-33', 'Máy sinh viên 33 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-34', 'Máy sinh viên 34 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-35', 'Máy sinh viên 35 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-36', 'Máy sinh viên 36 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-37', 'Máy sinh viên 37 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-38', 'Máy sinh viên 38 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-39', 'Máy sinh viên 39 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên'),
  ('2B21', '2B21-SV-40', 'Máy sinh viên 40 phòng 2B21', 'computer', 'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch', 'working', '2026-06-30 08:21:43', 'Máy thực hành sinh viên');

INSERT INTO `devices` (
  `room_id`, `device_code`, `device_name`, `device_type`, `spec_or_version`,
  `device_status`, `last_updated_at`, `notes`
)
SELECT
  `rooms`.`id`,
  `seed`.`device_code`,
  `seed`.`device_name`,
  `seed`.`device_type`,
  `seed`.`spec_or_version`,
  `seed`.`device_status`,
  `seed`.`last_updated_at`,
  `seed`.`notes`
FROM `tmp_device_seed` AS `seed`
JOIN `rooms`
  ON `rooms`.`room_code` = `seed`.`room_code`
ON DUPLICATE KEY UPDATE
  `device_name` = VALUES(`device_name`),
  `device_type` = VALUES(`device_type`),
  `spec_or_version` = VALUES(`spec_or_version`),
  `device_status` = VALUES(`device_status`),
  `last_updated_at` = VALUES(`last_updated_at`),
  `notes` = VALUES(`notes`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 7. Academic weeks
DROP TEMPORARY TABLE IF EXISTS `tmp_academic_week_seed`;
CREATE TEMPORARY TABLE `tmp_academic_week_seed` (
  `academic_year` varchar(20) NOT NULL,
  `semester_no` tinyint unsigned NOT NULL,
  `week_no` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL
);

INSERT INTO `tmp_academic_week_seed` (
  `academic_year`, `semester_no`, `week_no`, `start_date`, `end_date`
)
VALUES
  ('2026 - 2027', 1, 1, '2026-08-10', '2026-08-16'),
  ('2026 - 2027', 1, 2, '2026-08-17', '2026-08-23'),
  ('2026 - 2027', 1, 3, '2026-08-24', '2026-08-30'),
  ('2026 - 2027', 1, 4, '2026-08-31', '2026-09-06'),
  ('2026 - 2027', 1, 5, '2026-09-07', '2026-09-13'),
  ('2026 - 2027', 1, 6, '2026-09-14', '2026-09-20'),
  ('2026 - 2027', 1, 7, '2026-09-21', '2026-09-27'),
  ('2026 - 2027', 1, 8, '2026-09-28', '2026-10-04'),
  ('2026 - 2027', 1, 9, '2026-10-05', '2026-10-11'),
  ('2026 - 2027', 1, 10, '2026-10-12', '2026-10-18'),
  ('2026 - 2027', 1, 11, '2026-10-19', '2026-10-25'),
  ('2026 - 2027', 1, 12, '2026-10-26', '2026-11-01'),
  ('2026 - 2027', 1, 13, '2026-11-02', '2026-11-08'),
  ('2026 - 2027', 1, 14, '2026-11-09', '2026-11-15'),
  ('2026 - 2027', 1, 15, '2026-11-16', '2026-11-22'),
  ('2026 - 2027', 1, 16, '2026-11-23', '2026-11-29'),
  ('2026 - 2027', 1, 17, '2026-11-30', '2026-12-06'),
  ('2026 - 2027', 1, 18, '2026-12-07', '2026-12-13'),
  ('2026 - 2027', 1, 19, '2026-12-14', '2026-12-20'),
  ('2026 - 2027', 1, 20, '2026-12-21', '2026-12-27'),
  ('2026 - 2027', 1, 21, '2026-12-28', '2027-01-03'),
  ('2026 - 2027', 1, 22, '2027-01-04', '2027-01-10'),
  ('2026 - 2027', 2, 23, '2027-01-11', '2027-01-17'),
  ('2026 - 2027', 2, 24, '2027-01-18', '2027-01-24'),
  ('2026 - 2027', 2, 25, '2027-01-25', '2027-01-31'),
  ('2026 - 2027', 2, 26, '2027-02-01', '2027-02-07'),
  ('2026 - 2027', 2, 27, '2027-02-08', '2027-02-14'),
  ('2026 - 2027', 2, 28, '2027-02-15', '2027-02-21'),
  ('2026 - 2027', 2, 29, '2027-02-22', '2027-02-28'),
  ('2026 - 2027', 2, 30, '2027-03-01', '2027-03-07'),
  ('2026 - 2027', 2, 31, '2027-03-08', '2027-03-14'),
  ('2026 - 2027', 2, 32, '2027-03-15', '2027-03-21'),
  ('2026 - 2027', 2, 33, '2027-03-22', '2027-03-28'),
  ('2026 - 2027', 2, 34, '2027-03-29', '2027-04-04'),
  ('2026 - 2027', 2, 35, '2027-04-05', '2027-04-11'),
  ('2026 - 2027', 2, 36, '2027-04-12', '2027-04-18'),
  ('2026 - 2027', 2, 37, '2027-04-19', '2027-04-25'),
  ('2026 - 2027', 2, 38, '2027-04-26', '2027-05-02'),
  ('2026 - 2027', 2, 39, '2027-05-03', '2027-05-09'),
  ('2026 - 2027', 2, 40, '2027-05-10', '2027-05-16'),
  ('2026 - 2027', 2, 41, '2027-05-17', '2027-05-23'),
  ('2026 - 2027', 2, 42, '2027-05-24', '2027-05-30'),
  ('2026 - 2027', 2, 43, '2027-05-31', '2027-06-06'),
  ('2026 - 2027', 2, 44, '2027-06-07', '2027-06-13');

INSERT INTO `academic_weeks` (
  `semester_id`, `week_no`, `start_date`, `end_date`
)
SELECT
  `semesters`.`id`,
  `seed`.`week_no`,
  `seed`.`start_date`,
  `seed`.`end_date`
FROM `tmp_academic_week_seed` AS `seed`
JOIN `semesters`
  ON `semesters`.`academic_year` = `seed`.`academic_year`
 AND `semesters`.`semester_no` = `seed`.`semester_no`
ON DUPLICATE KEY UPDATE
  `start_date` = VALUES(`start_date`),
  `end_date` = VALUES(`end_date`);

-- 8. Calendar holidays
INSERT INTO `calendar_holidays` (
  `holiday_date`, `holiday_name`, `holiday_type`, `is_lab_scheduling_blocked`,
  `holiday_status`, `created_by_user_id`, `updated_by_user_id`, `notes`
)
VALUES
  ('2026-09-02', 'Quốc khánh', 'national', 1, 'active', NULL, NULL, 'Không xếp lịch thực hành trong ngày nghỉ lễ.'),
  ('2027-01-01', 'Tết Dương lịch', 'national', 1, 'active', NULL, NULL, 'Không xếp lịch thực hành trong ngày nghỉ lễ.'),
  ('2026-11-20', 'Ngày Nhà giáo Việt Nam', 'academic', 1, 'active', NULL, NULL, 'Ngày nghỉ học thuật demo.'),
  ('2026-12-31', 'Bảo trì phòng máy cuối năm', 'campus', 1, 'active', NULL, NULL, 'Chặn lịch thực hành để bảo trì hệ thống phòng máy.')
ON DUPLICATE KEY UPDATE
  `holiday_name` = VALUES(`holiday_name`),
  `holiday_type` = VALUES(`holiday_type`),
  `is_lab_scheduling_blocked` = VALUES(`is_lab_scheduling_blocked`),
  `holiday_status` = VALUES(`holiday_status`),
  `updated_by_user_id` = VALUES(`updated_by_user_id`),
  `notes` = VALUES(`notes`),
  `updated_at` = CURRENT_TIMESTAMP;

-- 9. Course sections
DROP TEMPORARY TABLE IF EXISTS `tmp_course_section_seed`;
CREATE TEMPORARY TABLE `tmp_course_section_seed` (
  `course_code` varchar(20) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `semester_no` tinyint unsigned NOT NULL,
  `group_no` varchar(20) NOT NULL,
  `registered_enrollment` int unsigned NOT NULL,
  `planned_enrollment` int unsigned DEFAULT NULL,
  `class_start_date` date NOT NULL,
  `class_end_date` date NOT NULL,
  `notes` varchar(255) DEFAULT NULL
);

INSERT INTO `tmp_course_section_seed` (
  `course_code`, `academic_year`, `semester_no`, `group_no`,
  `registered_enrollment`, `planned_enrollment`, `class_start_date`, `class_end_date`, `notes`
)
VALUES
  ('INT1154', '2026 - 2027', 1, '01', 57, 60, '2026-08-10', '2027-01-10', 'Tin học cơ sở 1 - nhóm 01'),
  ('INT1154', '2026 - 2027', 1, '02', 30, 60, '2026-08-17', '2027-01-10', 'Tin học cơ sở 1 - nhóm 02'),
  ('INT1340', '2026 - 2027', 1, '01', 45, 60, '2026-08-10', '2027-01-10', 'Nhập môn công nghệ phần mềm - nhóm 01'),
  ('INT1340', '2026 - 2027', 1, '02', 36, 60, '2026-08-17', '2027-01-10', 'Nhập môn công nghệ phần mềm - nhóm 02'),
  ('INT1341', '2026 - 2027', 1, '01', 42, 60, '2026-08-10', '2027-01-10', 'Nhập môn Trí tuệ nhân tạo - nhóm 01'),
  ('INT1341', '2026 - 2027', 1, '02', 34, 60, '2026-08-17', '2027-01-10', 'Nhập môn Trí tuệ nhân tạo - nhóm 02'),
  ('INT1344', '2026 - 2027', 1, '01', 45, 60, '2026-08-10', '2027-01-10', 'Mật mã học cơ sở - nhóm 01'),
  ('INT1344', '2026 - 2027', 1, '02', 38, 60, '2026-08-17', '2027-01-10', 'Mật mã học cơ sở - nhóm 02'),
  ('INT1484', '2026 - 2027', 1, '01', 35, 60, '2026-08-10', '2027-01-10', 'An toàn hệ điều hành - nhóm 01'),
  ('INT1472', '2026 - 2027', 1, '01', 52, 60, '2026-08-10', '2027-01-10', 'Cơ sở an toàn thông tin - nhóm 01'),
  ('INT1487', '2026 - 2027', 1, '01', 48, 60, '2026-08-10', '2027-01-10', 'Hệ điều hành Windows và Linux/Unix - nhóm 01'),
  ('INT1306', '2026 - 2027', 1, '01', 30, 60, '2026-08-10', '2027-01-10', 'Cấu trúc dữ liệu và giải thuật - nhóm 01'),
  ('INT1306', '2026 - 2027', 1, '02', 60, 60, '2026-08-10', '2027-01-10', 'Cấu trúc dữ liệu và giải thuật - nhóm 02'),
  ('INT1313', '2026 - 2027', 1, '01', 40, 60, '2026-08-10', '2027-01-10', 'Cơ sở dữ liệu - nhóm 01'),
  ('INT1313', '2026 - 2027', 1, '02', 50, 60, '2026-08-10', '2027-01-10', 'Cơ sở dữ liệu - nhóm 02'),
  ('ELE1433', '2026 - 2027', 1, '01', 38, 60, '2026-08-10', '2027-01-10', 'Kỹ thuật số - nhóm 01'),
  ('INT13162', '2026 - 2027', 2, '01', 30, 60, '2027-01-11', '2027-06-13', 'Lập trình với Python - nhóm 01'),
  ('INT13162', '2026 - 2027', 2, '02', 20, 60, '2027-01-11', '2027-06-13', 'Lập trình với Python - nhóm 02'),
  ('INT1319', '2026 - 2027', 2, '01', 60, 60, '2027-01-18', '2027-06-13', 'Hệ điều hành - nhóm 01'),
  ('INT1319', '2026 - 2027', 2, '02', 40, 60, '2027-01-11', '2027-06-13', 'Hệ điều hành - nhóm 02'),
  ('INT1339', '2026 - 2027', 2, '01', 50, 60, '2027-01-11', '2027-06-13', 'Ngôn ngữ lập trình C++ - nhóm 01'),
  ('INT1339', '2026 - 2027', 2, '02', 40, 60, '2027-01-11', '2027-06-13', 'Ngôn ngữ lập trình C++ - nhóm 02'),
  ('INT1332', '2026 - 2027', 2, '01', 45, 60, '2027-01-11', '2027-06-13', 'Lập trình hướng đối tượng - nhóm 01'),
  ('INT1332', '2026 - 2027', 2, '02', 60, 60, '2027-01-18', '2027-06-13', 'Lập trình hướng đối tượng - nhóm 02'),
  ('INT1336', '2026 - 2027', 2, '01', 58, 60, '2027-01-11', '2027-06-13', 'Mạng máy tính và Internet - nhóm 01'),
  ('INT1336', '2026 - 2027', 2, '02', 32, 60, '2027-01-18', '2027-06-13', 'Mạng máy tính và Internet - nhóm 02'),
  ('DAE1301', '2026 - 2027', 2, '01', 44, 60, '2027-01-11', '2027-06-13', 'Nhập môn Kỹ thuật dữ liệu - nhóm 01'),
  ('DAE1301', '2026 - 2027', 2, '02', 36, 60, '2027-01-18', '2027-06-13', 'Nhập môn Kỹ thuật dữ liệu - nhóm 02'),
  ('SEC1416', '2026 - 2027', 2, '01', 48, 60, '2027-01-11', '2027-06-13', 'Ứng dụng AI trong ATTT - nhóm 01'),
  ('SEC4347', '2026 - 2027', 2, '01', 30, 60, '2027-01-11', '2027-06-13', 'Hạ tầng khoá công khai PKI - nhóm 01'),
  ('SEC4348', '2026 - 2027', 2, '01', 30, 60, '2027-01-18', '2027-06-13', 'Học máy và ứng dụng trong ATTT - nhóm 01'),
  ('SEC4349', '2026 - 2027', 2, '01', 30, 60, '2027-01-18', '2027-06-13', 'DevOps và DevSecOps - nhóm 01');

INSERT INTO `course_sections` (
  `course_id`, `semester_id`, `group_no`, `registered_enrollment`, `planned_enrollment`,
  `class_start_date`, `class_end_date`, `section_status`, `notes`
)
SELECT
  `courses`.`id`,
  `semesters`.`id`,
  `seed`.`group_no`,
  `seed`.`registered_enrollment`,
  `seed`.`planned_enrollment`,
  `seed`.`class_start_date`,
  `seed`.`class_end_date`,
  'open',
  `seed`.`notes`
FROM `tmp_course_section_seed` AS `seed`
JOIN `courses`
  ON `courses`.`course_code` = `seed`.`course_code`
JOIN `semesters`
  ON `semesters`.`academic_year` = `seed`.`academic_year`
 AND `semesters`.`semester_no` = `seed`.`semester_no`
ON DUPLICATE KEY UPDATE
  `registered_enrollment` = VALUES(`registered_enrollment`),
  `planned_enrollment` = VALUES(`planned_enrollment`),
  `class_start_date` = VALUES(`class_start_date`),
  `class_end_date` = VALUES(`class_end_date`),
  `section_status` = VALUES(`section_status`),
  `notes` = VALUES(`notes`),
  `updated_at` = CURRENT_TIMESTAMP;

COMMIT;

-- Kiểm tra nhanh sau khi seed
SELECT 'users' AS `table_name`, COUNT(*) AS `total_rows` FROM `users`
UNION ALL SELECT 'semesters', COUNT(*) FROM `semesters`
UNION ALL SELECT 'courses', COUNT(*) FROM `courses`
UNION ALL SELECT 'time_slots', COUNT(*) FROM `time_slots`
UNION ALL SELECT 'rooms', COUNT(*) FROM `rooms`
UNION ALL SELECT 'devices', COUNT(*) FROM `devices`
UNION ALL SELECT 'academic_weeks', COUNT(*) FROM `academic_weeks`
UNION ALL SELECT 'calendar_holidays', COUNT(*) FROM `calendar_holidays`
UNION ALL SELECT 'course_sections', COUNT(*) FROM `course_sections`;

USE `lab_schedule_ptit_v2`;
SET NAMES utf8mb4;

START TRANSACTION;

-- Đảm bảo phòng 2B31 tồn tại và đúng số lượng 31 máy:
-- 30 máy sinh viên + 1 máy giảng viên/giám sát
INSERT INTO `rooms` (
  `room_code`,
  `total_computers`,
  `broken_computers`,
  `reserved_teacher_computers`,
  `has_projector`,
  `has_wifi`,
  `has_lan`,
  `room_status`,
  `primary_technician_user_id`,
  `last_status_updated_at`,
  `last_condition_report_at`,
  `notes`
)
VALUES
  ('2B31', 31, 0, 1, 1, 1, 1, 'available', NULL, CURRENT_TIMESTAMP, NULL, 'Phòng máy 2B31 - 30 máy sinh viên, 1 máy giảng viên')
ON DUPLICATE KEY UPDATE
  `total_computers` = VALUES(`total_computers`),
  `broken_computers` = VALUES(`broken_computers`),
  `reserved_teacher_computers` = VALUES(`reserved_teacher_computers`),
  `has_projector` = VALUES(`has_projector`),
  `has_wifi` = VALUES(`has_wifi`),
  `has_lan` = VALUES(`has_lan`),
  `room_status` = VALUES(`room_status`),
  `last_status_updated_at` = VALUES(`last_status_updated_at`),
  `notes` = VALUES(`notes`),
  `updated_at` = CURRENT_TIMESTAMP;

DROP TEMPORARY TABLE IF EXISTS `tmp_device_seed_2b31`;

CREATE TEMPORARY TABLE `tmp_device_seed_2b31` (
  `room_code` varchar(20) NOT NULL,
  `device_code` varchar(40) NOT NULL,
  `device_name` varchar(120) NOT NULL,
  `device_type` varchar(30) NOT NULL,
  `spec_or_version` varchar(255) DEFAULT NULL,
  `device_status` varchar(30) NOT NULL,
  `last_updated_at` datetime DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
);

-- Máy giảng viên / giám sát
INSERT INTO `tmp_device_seed_2b31` (
  `room_code`,
  `device_code`,
  `device_name`,
  `device_type`,
  `spec_or_version`,
  `device_status`,
  `last_updated_at`,
  `notes`
)
VALUES
  (
    '2B31',
    '2B31-GV-01',
    'Máy chủ giám sát giảng viên phòng 2B31',
    'computer',
    'Intel Core i7, RAM 16GB, SSD 512GB, màn hình 24 inch',
    'working',
    CURRENT_TIMESTAMP,
    'Máy giảng viên/giám sát phòng máy'
  );

-- 30 máy sinh viên: 2B31-SV-01 đến 2B31-SV-30
INSERT INTO `tmp_device_seed_2b31` (
  `room_code`,
  `device_code`,
  `device_name`,
  `device_type`,
  `spec_or_version`,
  `device_status`,
  `last_updated_at`,
  `notes`
)
SELECT
  '2B31' AS `room_code`,
  CONCAT('2B31-SV-', LPAD(`nums`.`n`, 2, '0')) AS `device_code`,
  CONCAT('Máy sinh viên ', LPAD(`nums`.`n`, 2, '0'), ' phòng 2B31') AS `device_name`,
  'computer' AS `device_type`,
  'Intel Core i5, RAM 8GB, SSD 256GB, màn hình 22 inch' AS `spec_or_version`,
  'working' AS `device_status`,
  CURRENT_TIMESTAMP AS `last_updated_at`,
  'Máy thực hành sinh viên' AS `notes`
FROM (
  SELECT (`tens`.`t` * 10 + `ones`.`o`) AS `n`
  FROM (
    SELECT 0 AS `t`
    UNION ALL SELECT 1
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
  ) AS `tens`
  CROSS JOIN (
    SELECT 0 AS `o`
    UNION ALL SELECT 1
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
  ) AS `ones`
) AS `nums`
WHERE `nums`.`n` BETWEEN 1 AND 30
ORDER BY `nums`.`n`;

-- Đẩy dữ liệu từ bảng tạm vào bảng devices
INSERT INTO `devices` (
  `room_id`,
  `device_code`,
  `device_name`,
  `device_type`,
  `spec_or_version`,
  `device_status`,
  `last_updated_at`,
  `notes`
)
SELECT
  `rooms`.`id`,
  `seed`.`device_code`,
  `seed`.`device_name`,
  `seed`.`device_type`,
  `seed`.`spec_or_version`,
  `seed`.`device_status`,
  `seed`.`last_updated_at`,
  `seed`.`notes`
FROM `tmp_device_seed_2b31` AS `seed`
JOIN `rooms`
  ON `rooms`.`room_code` = `seed`.`room_code`
ON DUPLICATE KEY UPDATE
  `device_name` = VALUES(`device_name`),
  `device_type` = VALUES(`device_type`),
  `spec_or_version` = VALUES(`spec_or_version`),
  `device_status` = VALUES(`device_status`),
  `last_updated_at` = VALUES(`last_updated_at`),
  `notes` = VALUES(`notes`),
  `updated_at` = CURRENT_TIMESTAMP;

-- Nếu trước đó đã lỡ chạy seed 40 máy sinh viên cho 2B31,
-- xoá riêng 10 máy dư để phòng 2B31 chỉ còn 30 máy sinh viên + 1 máy giảng viên.
DELETE `devices`
FROM `devices`
JOIN `rooms`
  ON `rooms`.`id` = `devices`.`room_id`
WHERE `rooms`.`room_code` = '2B31'
  AND `devices`.`device_code` IN (
    '2B31-SV-31',
    '2B31-SV-32',
    '2B31-SV-33',
    '2B31-SV-34',
    '2B31-SV-35',
    '2B31-SV-36',
    '2B31-SV-37',
    '2B31-SV-38',
    '2B31-SV-39',
    '2B31-SV-40'
  );

COMMIT;

-- Kiểm tra lại số thiết bị phòng 2B31
SELECT
  `rooms`.`room_code`,
  COUNT(`devices`.`id`) AS `total_devices`,
  SUM(CASE WHEN `devices`.`device_code` LIKE '%-GV-%' THEN 1 ELSE 0 END) AS `teacher_devices`,
  SUM(CASE WHEN `devices`.`device_code` LIKE '%-SV-%' THEN 1 ELSE 0 END) AS `student_devices`
FROM `rooms`
LEFT JOIN `devices`
  ON `devices`.`room_id` = `rooms`.`id`
WHERE `rooms`.`room_code` = '2B31'
GROUP BY `rooms`.`room_code`;
