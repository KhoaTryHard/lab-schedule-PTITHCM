/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị nội dung mẫu cho trang cài đặt hệ thống.
 * Hàm trả về: JSX của trang /admin/settings.
 */
export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Cài đặt</h2>
      <p>
        Đây là nơi để cấu hình tham số hệ thống, quy tắc phân quyền và các thiết
        lập nền cho toàn bộ PTIT HCM Management System.
      </p>
    </section>
  );
}
