import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function StudentSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch thực hành của sinh viên"
      description="Sinh viên chỉ xem lịch thực hành đã công bố. Frontend gọi GET /api/schedules với status=published và student_user_id của tài khoản hiện tại."
      fixedParams={{ status: "published" }}
      currentUserIdParamName="student_user_id"
      clientSideRequiredStatus="published"
      showStatusFilter={false}
      showCourseSectionFilter={false}
      showLecturerFilter={false}
      emptyTitle="Chưa có lịch thực hành đã công bố"
      emptyDescription="Chưa có lịch thực hành phù hợp với bộ lọc hiện tại."
      integrationNote="Frontend đã gửi status=published và student_user_id theo tài khoản đang đăng nhập. Ngoài ra, UI có lớp lọc an toàn client-side để chỉ render lịch published nếu API trả dư dữ liệu. Backend develop hiện tại chưa implement scope theo SV nên chưa thể xác nhận dữ liệu trả về đã đúng riêng sinh viên."
    />
  );
}
