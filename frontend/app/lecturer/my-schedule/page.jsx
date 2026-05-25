import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function LecturerSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch dạy thực hành của giảng viên"
      usePublishedEndpoint
      currentUserIdParamName="lecturer_user_id"
      showStatusFilter={false}
      showCourseSectionFilter={false}
      showLecturerFilter={false}
      showScheduleRequestFilter
      emptyTitle="Chưa có lịch dạy thực hành"
      emptyDescription="Chưa có lịch dạy thực hành đã công bố phù hợp với bộ lọc hiện tại."
    />
  );
}
