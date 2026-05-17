import {
  AcademicIcon,
  AdminIcon,
  LecturerIcon,
  StudentIcon,
  TechnicianIcon,
  UsersIcon,
  renderLineIcon,
  renderReportIcon,
  renderRoomIcon,
  renderSidebarIcon,
  renderTrainingIcon,
} from "./icons/systemIcon.jsx";

export {
  AcademicIcon,
  AdminIcon,
  LecturerIcon,
  StudentIcon,
  TechnicianIcon,
  UsersIcon,
  renderLineIcon,
  renderReportIcon,
  renderRoomIcon,
  renderSidebarIcon,
  renderTrainingIcon,
};

export const IconUsers = UsersIcon;
export const IconAdmin = AdminIcon;
export const IconAcademic = AcademicIcon;
export const IconLecturer = LecturerIcon;
export const IconTechnician = TechnicianIcon;
export const IconStudent = StudentIcon;

export function IconDashboard() {
  return renderSidebarIcon("dashboard");
}

export function IconUser() {
  return renderSidebarIcon("person");
}

export function IconEquipment() {
  return renderSidebarIcon("equipment");
}

export function IconSchool() {
  return renderSidebarIcon("school");
}

export function IconSearch() {
  return renderSidebarIcon("search");
}

export function IconChart() {
  return renderSidebarIcon("chart");
}

export function IconSettings() {
  return renderSidebarIcon("settings");
}

export function IconRoom({ className = "", size = 24 }) {
  return renderRoomIcon("room", className, size);
}

export function IconComputer({ className = "", size = 24 }) {
  return renderRoomIcon("computer", className, size);
}

export function IconDevice({ className = "", size = 24 }) {
  return renderRoomIcon("device", className, size);
}

export function IconSoftware({ className = "", size = 24 }) {
  return renderRoomIcon("software", className, size);
}

export function IconCalendar({ className = "", size = 24 }) {
  return renderTrainingIcon("semester", className, size);
}

export function IconClock({ className = "", size = 24 }) {
  return renderTrainingIcon("slot", className, size);
}

export function IconCourse({ className = "", size = 24 }) {
  return renderTrainingIcon("course", className, size);
}

export function IconSection({ className = "", size = 24 }) {
  return renderTrainingIcon("section", className, size);
}

export function IconReport({ className = "", size = 24 }) {
  return renderReportIcon("usage", className, size);
}

export function IconWarning() {
  return renderLineIcon("warning");
}
