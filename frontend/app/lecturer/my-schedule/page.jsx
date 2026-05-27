import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function LecturerSchedulePage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu giảng viên"
      description="Lịch dạy thực hành đã công bố của giảng viên hiện tại."
      roleVariant="lecturer"
      accentTone="blue"
      usePublishedEndpoint
      currentUserIdParamName="lecturer_user_id"
      emptyTitle="Chưa có lịch dạy thực hành"
      emptyDescription="Không có lịch dạy thực hành đã công bố trong tuần đang chọn."
    />
  );
}
