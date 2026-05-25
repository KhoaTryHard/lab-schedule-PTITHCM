import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

const STUDENT_VISIBLE_COLUMNS = [
  "course_code",
  "course_name",
  "group_no",
  "practice_team",
  "lecturer",
  "room_code",
  "day_of_week",
  "time_slot",
  "start_date",
  "end_date",
  "created_at",
  "updated_at",
  "planned_size",
  "team_no",
];

export default function StudentSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch thực hành của sinh viên"
      usePublishedEndpoint
      visibleColumnKeys={STUDENT_VISIBLE_COLUMNS}
      showStatusFilter={false}
      showCourseSectionFilter={false}
      showLecturerFilter={false}
      showScheduleRequestFilter={false}
      emptyTitle="Chưa có lịch thực hành đã công bố"
      emptyDescription="Chưa có lịch thực hành đã công bố phù hợp với bộ lọc hiện tại."
    />
  );
}
