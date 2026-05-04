/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị nội dung mẫu cho trang quản lý tài khoản của quản trị viên.
 * Hàm trả về: JSX của trang /admin/accounts.
 */
export default function AccountsPage() {
  return (
    <section className="card">
      <h2>Quản lý tài khoản</h2>
      <p>
        Trang này dùng để quản trị tài khoản, phân quyền và theo dõi trạng thái
        người dùng trong hệ thống. Bạn có thể bổ sung bảng danh sách tài khoản
        tại đây sau.
      </p>
    </section>
  );
}
