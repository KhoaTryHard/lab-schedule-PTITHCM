/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị nội dung mẫu cho trang thống kê và báo cáo.
 * Hàm trả về: JSX của trang /admin/reports.
 */
export default function ReportsPage() {
  return (
    <section className="card">
      <h2>Thống kê &amp; báo cáo</h2>
      <p>
        Bạn có thể đặt biểu đồ, báo cáo tình trạng phòng máy, tần suất sử dụng
        và các chỉ số phục vụ quản trị vận hành tại khu vực này.
      </p>
    </section>
  );
}
