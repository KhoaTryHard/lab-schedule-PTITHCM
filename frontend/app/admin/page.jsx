/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị màn hình tổng quan mẫu cho vai trò quản trị viên.
 * Hàm trả về: JSX của khu vực nội dung chính trong trang /admin.
 */
export default function AdminPage() {
  return (
    <div className="page">
      <div className="grid grid-2">
        <section className="card">
          <h2>Tình hình hệ thống</h2>
          <p>
            Theo dõi nhanh tài khoản, phòng máy và các cấu hình quan trọng của
            hệ thống quản lý lịch thực hành PTIT HCM.
          </p>
        </section>

        <section className="card">
          <h2>Việc cần xử lý</h2>
          <p>
            Kiểm tra yêu cầu cấp quyền mới, đồng bộ dữ liệu nền và rà soát các
            thay đổi ảnh hưởng đến lịch thực hành.
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Gợi ý sử dụng layout</h2>
        <p>
          Từ bây giờ các trang con trong nhánh <strong>/admin</strong> sẽ tự
          nhận sidebar và top bar. Khi bạn tạo thêm một trang mới cho quản trị
          viên, chỉ cần đặt file trong thư mục <strong>app/admin</strong>.
        </p>
      </section>
    </div>
  );
}
