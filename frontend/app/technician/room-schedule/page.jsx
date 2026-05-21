import ScheduleLookupTable from "../../../components/schedules/ScheduleLookupTable.jsx";

export default function TechnicianRoomSchedulePage() {
  return (
    <ScheduleLookupTable
      title="Lịch sử dụng phòng máy"
      description="Kỹ thuật viên theo dõi lịch sử dụng 3 phòng 2B11, 2B21, 2B31. Frontend gọi GET /api/schedules — hiển thị toàn bộ trạng thái để KTV nắm tình trạng phòng."
      fixedParams={{}}
      showStatusFilter={true}
      showRoomFilter={true}
      showLecturerFilter={false}
      emptyTitle="Chưa có lịch phòng máy"
      emptyDescription="Chưa có lịch thực hành nào trong hệ thống."
      integrationNote="Frontend gọi API thật GET /api/schedules. Backend develop hiện tại trả schedules rỗng nên chưa thể xác nhận dữ liệu lịch thật — sẽ hiển thị đầy đủ khi backend issue #14 (W3-04) hoàn thiện."
    />
  );
}
