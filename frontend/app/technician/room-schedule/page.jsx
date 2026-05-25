import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

const TECHNICIAN_VISIBLE_COLUMNS = [
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

export default function TechnicianRoomSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch sử dụng phòng máy"
      usePublishedEndpoint
      visibleColumnKeys={TECHNICIAN_VISIBLE_COLUMNS}
      showStatusFilter={false}
      showLecturerFilter={false}
      showScheduleRequestFilter={false}
      emptyTitle="Chưa có lịch phòng máy"
      emptyDescription="Chưa có lịch thực hành đã công bố cho phòng máy."
    />
  );
}
