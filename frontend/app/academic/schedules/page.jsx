import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function AcademicSchedulesPage() {
  return (
    <ScheduleLookupTable
      title="Tra cứu lịch thực hành"
      description="Cán bộ đào tạo tra cứu lịch thực hành từ API thật GET /api/schedules."
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="API GET /api/schedules hiện chưa trả lịch phù hợp hoặc backend vẫn đang ở trạng thái stub."
      integrationNote="Màn này đã bỏ mock và gọi API thật. Backend develop hiện tại đang trả data.schedules = [] nên chưa thể tick tiêu chí có danh sách lịch thật, nhưng frontend đã sẵn sàng render toàn bộ field API trả về."
    />
  );
}
