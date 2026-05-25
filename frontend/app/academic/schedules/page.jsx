import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function AcademicSchedulesPage() {
  return (
    <ScheduleLookupTable
      title="Tra cứu lịch thực hành"
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="Chưa có lịch thực hành phù hợp với bộ lọc hiện tại."
      enableWorkflowActions
      showScheduleRequestFilter
    />
  );
}
