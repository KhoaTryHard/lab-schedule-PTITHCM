import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function StudentSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch thực hành của sinh viên"
      usePublishedEndpoint
      showStatusFilter={false}
      showCourseSectionFilter={false}
      showLecturerFilter={false}
      showScheduleRequestFilter
      emptyTitle="Chưa có lịch thực hành đã công bố"
      emptyDescription="Chưa có lịch thực hành đã công bố phù hợp với bộ lọc hiện tại."
    />
  );
}
