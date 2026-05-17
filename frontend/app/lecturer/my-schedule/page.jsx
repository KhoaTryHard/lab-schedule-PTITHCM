import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function LecturerSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch dạy thực hành của giảng viên"
      description="Giảng viên xem lịch dạy thực hành đã công bố. Frontend gọi GET /api/schedules với status=published và lecturer_user_id của tài khoản hiện tại."
      fixedParams={{ status: "published" }}
      currentUserIdParamName="lecturer_user_id"
      clientSideRequiredStatus="published"
      showStatusFilter={false}
      showCourseSectionFilter={false}
      showLecturerFilter={false}
      emptyTitle="Chưa có lịch dạy thực hành"
      emptyDescription="API chưa trả lịch published của giảng viên hoặc backend vẫn chưa filter theo lecturer_user_id."
      integrationNote="Frontend đã gửi status=published và lecturer_user_id theo tài khoản đang đăng nhập. Ngoài ra, UI có lớp lọc an toàn client-side để chỉ render lịch published nếu API trả dư dữ liệu. Backend develop hiện tại chưa implement role scope cho GV nên chưa thể xác nhận dữ liệu trả về đã đúng riêng giảng viên."
    />
  );
}
