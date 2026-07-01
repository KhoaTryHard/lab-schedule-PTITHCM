import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function LecturerSchedulePage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu giảng viên"
      roleVariant="lecturer"
      accentTone="blue"
      usePublishedEndpoint
      useAcademicWeeksEndpoint
      currentUserIdParamName="lecturer_user_id"
      emptyTitle="Chưa có lịch dạy thực hành"
      emptyDescription="Không có lịch dạy thực hành đã công bố trong tuần đang chọn."
    />
  );
}
