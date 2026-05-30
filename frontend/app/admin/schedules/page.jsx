import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function AdminSchedulesPage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu toàn hệ thống"
      description="Admin xem lịch thực hành toàn hệ thống theo tuần. Không hiển thị nút thao tác."
      roleVariant="admin"
      accentTone="red"
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="Không có lịch thực hành phù hợp trong tuần đang chọn."
    />
  );
}
