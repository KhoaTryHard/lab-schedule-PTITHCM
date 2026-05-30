import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function AcademicSchedulesPage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu dạng tuần"
      description="Lịch thực hành lấy từ API thật, có thao tác duyệt và công bố cho cán bộ đào tạo."
      roleVariant="academic"
      accentTone="red"
      enableWorkflowActions
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="Không có lịch thực hành phù hợp trong tuần đang chọn."
    />
  );
}
