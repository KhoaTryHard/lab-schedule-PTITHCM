import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function AdminSchedulesPage() {
  return (
    <ScheduleLookupTable
      title="Tra cứu lịch thực hành toàn hệ thống"
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="Chưa có lịch thực hành phù hợp với bộ lọc hiện tại."
      showScheduleRequestFilter
    />
  );
}
