import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";

export default function StudentSchedulePage() {
  return (
    <WeeklyScheduleTable
      title="Thời khóa biểu sinh viên"
      description="Lịch thực hành đã công bố của sinh viên hiện tại."
      roleVariant="student"
      accentTone="blue"
      fixedParams={{ status: "published" }}
      currentUserIdParamName="student_user_id"
      clientSideRequiredStatus="published"
      emptyTitle="Chưa có lịch thực hành đã công bố"
      emptyDescription="Không có lịch thực hành đã công bố của sinh viên trong tuần đang chọn."
    />
  );
}
