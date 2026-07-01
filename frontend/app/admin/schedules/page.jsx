import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function AdminSchedulesPage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu toàn hệ thống"
      roleVariant="admin"
      accentTone="red"
      useAcademicWeeksEndpoint
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="Không có lịch thực hành phù hợp trong tuần đang chọn."
    />
  );
}
