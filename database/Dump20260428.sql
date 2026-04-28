CREATE DATABASE  IF NOT EXISTS `lab_schedule_ptit_v2` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `lab_schedule_ptit_v2`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: lab_schedule_ptit_v2
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

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
  `is_lab_scheduling_blocked` tinyint(1) NOT NULL DEFAULT '1',
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
-- Table structure for table `course_section_cohorts`
--

DROP TABLE IF EXISTS `course_section_cohorts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_section_cohorts` (
  `course_section_id` int unsigned NOT NULL,
  `cohort_id` int unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_section_id`,`cohort_id`),
  KEY `fk_course_section_cohorts_cohort` (`cohort_id`),
  CONSTRAINT `fk_course_section_cohorts_cohort` FOREIGN KEY (`cohort_id`) REFERENCES `student_cohorts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_course_section_cohorts_section` FOREIGN KEY (`course_section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lop hanh chinh nao cung hoc trong nhom hoc phan nao';
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
-- Table structure for table `course_software_requirements`
--

DROP TABLE IF EXISTS `course_software_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_software_requirements` (
  `course_id` int unsigned NOT NULL,
  `software_id` int unsigned NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`course_id`,`software_id`),
  KEY `fk_course_software_requirements_software` (`software_id`),
  CONSTRAINT `fk_course_software_requirements_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_course_software_requirements_software` FOREIGN KEY (`software_id`) REFERENCES `software_packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hoc phan yeu cau phan mem nao de thuc hanh';
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
  `is_lab_required` tinyint(1) GENERATED ALWAYS AS ((case when (`lab_periods` > 0) then 1 else 0 end)) STORED,
  `course_status` enum('active','inactive','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_courses_code` (`course_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hoc phan goc, vi du INT1340';
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
  `device_type` enum('computer','projector','network','software','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'computer',
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
-- Table structure for table `lecturer_profiles`
--

DROP TABLE IF EXISTS `lecturer_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecturer_profiles` (
  `user_id` int unsigned NOT NULL,
  `lecturer_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academic_rank` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expertise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_lecturer_profiles_code` (`lecturer_code`),
  CONSTRAINT `fk_lecturer_profiles_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ho so rieng cua giang vien';
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
  `issue_type` enum('computer','network','projector','power','software','other') COLLATE utf8mb4_unicode_ci NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phan anh su co phong may / thiet bi / phan mem';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room_software_installations`
--

DROP TABLE IF EXISTS `room_software_installations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_software_installations` (
  `room_id` int unsigned NOT NULL,
  `software_id` int unsigned NOT NULL,
  `installed_version` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `installed_on` date DEFAULT NULL,
  PRIMARY KEY (`room_id`,`software_id`),
  KEY `fk_room_software_installations_software` (`software_id`),
  CONSTRAINT `fk_room_software_installations_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_room_software_installations_software` FOREIGN KEY (`software_id`) REFERENCES `software_packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phong nao da cai phan mem nao';
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
  `has_projector` tinyint(1) NOT NULL DEFAULT '0',
  `has_wifi` tinyint(1) NOT NULL DEFAULT '0',
  `has_lan` tinyint(1) NOT NULL DEFAULT '0',
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
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_semesters_year_no` (`academic_year`,`semester_no`),
  CONSTRAINT `chk_semesters_date_range` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hoc ky, vi du Hoc ky 2 - Nam hoc 2025-2026';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `software_packages`
--

DROP TABLE IF EXISTS `software_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `software_packages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `software_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `software_version` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_software_packages_name_version` (`software_name`,`software_version`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh muc phan mem';
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
-- Table structure for table `student_feedback`
--

DROP TABLE IF EXISTS `student_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_feedback` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `student_user_id` int unsigned NOT NULL,
  `lab_schedule_entry_id` int unsigned NOT NULL,
  `feedback_type` enum('schedule_error','room_error','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'schedule_error',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_info` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feedback_status` enum('submitted','under_review','responded','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `handled_by_user_id` int unsigned DEFAULT NULL,
  `handled_at` datetime DEFAULT NULL,
  `response_text` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_student_feedback_entry` (`lab_schedule_entry_id`),
  KEY `fk_student_feedback_handled_by` (`handled_by_user_id`),
  KEY `fk_student_feedback_student` (`student_user_id`),
  CONSTRAINT `fk_student_feedback_entry` FOREIGN KEY (`lab_schedule_entry_id`) REFERENCES `lab_schedule_entries` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_student_feedback_handled_by` FOREIGN KEY (`handled_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_student_feedback_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sinh vien phan anh sai sot lich / phong hoc';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_profiles`
--

DROP TABLE IF EXISTS `student_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_profiles` (
  `user_id` int unsigned NOT NULL,
  `student_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cohort_id` int unsigned NOT NULL,
  `intake_year` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `training_program` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_status` enum('studying','paused','graduated','dropped_out') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'studying',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_student_profiles_student_code` (`student_code`),
  KEY `fk_student_profiles_cohort` (`cohort_id`),
  CONSTRAINT `fk_student_profiles_cohorts` FOREIGN KEY (`cohort_id`) REFERENCES `student_cohorts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_student_profiles_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ho so rieng cua sinh vien';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `technician_profiles`
--

DROP TABLE IF EXISTS `technician_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `technician_profiles` (
  `user_id` int unsigned NOT NULL,
  `technician_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expertise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_technician_profiles_code` (`technician_code`),
  CONSTRAINT `fk_technician_profiles_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ho so rieng cua ky thuat vien';
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
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_time_slots_period_range` (`start_period`,`end_period`),
  CONSTRAINT `chk_time_slots_period_range` CHECK ((`end_period` >= `start_period`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Khung tiet thuc te, vi du Tiet 1-4, Tiet 7-10';
/*!40101 SET character_set_client = @saved_cs_client */;

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
-- Temporary view structure for view `vw_active_calendar_holidays`
--

DROP TABLE IF EXISTS `vw_active_calendar_holidays`;
/*!50001 DROP VIEW IF EXISTS `vw_active_calendar_holidays`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_active_calendar_holidays` AS SELECT 
 1 AS `id`,
 1 AS `holiday_date`,
 1 AS `holiday_name`,
 1 AS `holiday_type`,
 1 AS `is_lab_scheduling_blocked`,
 1 AS `notes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_active_room_blocks`
--

DROP TABLE IF EXISTS `vw_active_room_blocks`;
/*!50001 DROP VIEW IF EXISTS `vw_active_room_blocks`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_active_room_blocks` AS SELECT 
 1 AS `id`,
 1 AS `room_id`,
 1 AS `room_code`,
 1 AS `block_type`,
 1 AS `block_title`,
 1 AS `day_of_week`,
 1 AS `time_slot_id`,
 1 AS `slot_label`,
 1 AS `start_date`,
 1 AS `end_date`,
 1 AS `block_status`,
 1 AS `requested_by_user_id`,
 1 AS `requested_by_name`,
 1 AS `reviewed_by_user_id`,
 1 AS `reviewed_by_name`,
 1 AS `reviewed_at`,
 1 AS `review_notes`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_course_section_student_counts`
--

DROP TABLE IF EXISTS `vw_course_section_student_counts`;
/*!50001 DROP VIEW IF EXISTS `vw_course_section_student_counts`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_course_section_student_counts` AS SELECT 
 1 AS `course_section_id`,
 1 AS `registered_student_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_practice_team_student_counts`
--

DROP TABLE IF EXISTS `vw_practice_team_student_counts`;
/*!50001 DROP VIEW IF EXISTS `vw_practice_team_student_counts`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_practice_team_student_counts` AS SELECT 
 1 AS `practice_team_id`,
 1 AS `team_student_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_room_capacity`
--

DROP TABLE IF EXISTS `vw_room_capacity`;
/*!50001 DROP VIEW IF EXISTS `vw_room_capacity`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_room_capacity` AS SELECT 
 1 AS `id`,
 1 AS `room_code`,
 1 AS `total_computers`,
 1 AS `broken_computers`,
 1 AS `reserved_teacher_computers`,
 1 AS `usable_student_computers`,
 1 AS `has_projector`,
 1 AS `room_status`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_room_pc_inventory`
--

DROP TABLE IF EXISTS `vw_room_pc_inventory`;
/*!50001 DROP VIEW IF EXISTS `vw_room_pc_inventory`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_room_pc_inventory` AS SELECT 
 1 AS `room_code`,
 1 AS `total_computers`,
 1 AS `broken_computers`,
 1 AS `reserved_teacher_computers`,
 1 AS `usable_student_computers`,
 1 AS `total_pc_devices`,
 1 AS `working_pc_devices`,
 1 AS `non_working_pc_devices`*/;
SET character_set_client = @saved_cs_client;

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
-- Dumping events for database 'lab_schedule_ptit_v2'
--

--
-- Dumping routines for database 'lab_schedule_ptit_v2'
--

--
-- Final view structure for view `vw_active_calendar_holidays`
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
-- Final view structure for view `vw_active_room_blocks`
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
-- Final view structure for view `vw_course_section_student_counts`
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
-- Final view structure for view `vw_practice_team_student_counts`
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
-- Final view structure for view `vw_room_capacity`
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
-- Final view structure for view `vw_room_pc_inventory`
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

-- Dump completed on 2026-04-28 15:12:52
