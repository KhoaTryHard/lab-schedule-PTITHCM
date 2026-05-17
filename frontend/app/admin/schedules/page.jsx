import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function AdminSchedulesPage() {
  return (
    <ScheduleLookupTable
      title="Tra cứu lịch thực hành toàn hệ thống"
      description="Quản trị viên theo dõi toàn bộ lịch thực hành từ API thật GET /api/schedules."
      emptyTitle="Chưa có lịch thực hành"
      emptyDescription="API GET /api/schedules hiện chưa trả lịch hoặc backend vẫn đang ở trạng thái stub."
      integrationNote="Route này tách riêng khỏi /admin/lookups để tránh dùng màn mock làm minh chứng. Màn hiện tại gọi API thật GET /api/schedules và render toàn bộ field API trả về nếu backend có dữ liệu."
    />
  );
}
