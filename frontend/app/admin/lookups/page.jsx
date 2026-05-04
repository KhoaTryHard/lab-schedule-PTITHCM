/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị nội dung mẫu cho trang tra cứu quản trị viên.
 * Hàm trả về: JSX của trang /admin/lookups.
 */
export default function LookupsPage() {
  return (
    <section className="card">
      <h2>Tra cứu</h2>
      <p>
        Trang này có thể dùng để tra cứu nhanh người dùng, phòng máy, thiết bị
        hoặc lịch thực hành khi quản trị viên cần kiểm tra phát sinh.
      </p>
    </section>
  );
}
