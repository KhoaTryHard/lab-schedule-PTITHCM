import DataTable from "../../../components/common/DataTable";

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: tạo dữ liệu mẫu cho bảng quản lý thiết bị và phòng máy.
 * Hàm trả về: JSX hiển thị danh sách phòng máy đang thuộc phạm vi MVP.
 */
export default function RoomsPage() {
  const rows = ROOM_SCOPE.map((roomCode, index) => ({
    id: index + 1,
    roomCode,
    status: "Sẵn sàng",
    scope: "Phạm vi MVP",
  }));

  return (
    <section className="card">
      <h2>Quản lý thiết bị và phòng máy</h2>
      <p>
        Khu vực này đang đại diện cho nhóm chức năng quản lý thiết bị của quản
        trị viên. Hiện tại hệ thống đang theo dõi 3 phòng máy trong phạm vi
        MVP.
      </p>
      <DataTable
        columns={[
          { key: "roomCode", label: "Phòng máy" },
          { key: "status", label: "Trạng thái" },
          { key: "scope", label: "Phạm vi" },
        ]}
        rows={rows}
      />
    </section>
  );
}
