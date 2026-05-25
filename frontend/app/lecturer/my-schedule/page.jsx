import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

const LECTURER_VISIBLE_COLUMNS = [
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
  "status",
  "created_at",
  "updated_at",
  "planned_size",
  "team_no",
];

export default function LecturerSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch dạy thực hành của giảng viên"
      usePublishedEndpoint
      currentUserIdParamName="lecturer_user_id"
      visibleColumnKeys={LECTURER_VISIBLE_COLUMNS}
      showStatusFilter={false}
      showCourseSectionFilter={false}
      showLecturerFilter={false}
      showScheduleRequestFilter={false}
      emptyTitle="Chưa có lịch dạy thực hành"
      emptyDescription="Chưa có lịch dạy thực hành đã công bố phù hợp với bộ lọc hiện tại."
    />
  );
}
