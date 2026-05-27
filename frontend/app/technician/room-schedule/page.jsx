import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function TechnicianRoomSchedulePage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu sử dụng phòng máy"
      description="Lịch sử dụng phòng máy đã công bố, hiển thị theo tuần cho kỹ thuật viên."
      roleVariant="technician"
      accentTone="blue"
      usePublishedEndpoint
      emptyTitle="Chưa có lịch phòng máy"
      emptyDescription="Không có lịch thực hành đã công bố cho phòng máy trong tuần đang chọn."
    />
  );
}
