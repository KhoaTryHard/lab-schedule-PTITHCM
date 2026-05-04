/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: hiển thị nội dung mẫu cho trang quản lý dữ liệu đào tạo.
 * Hàm trả về: JSX của trang /admin/trainingData.
 */
export default function TrainingDataPage() {
  return (
    <section className="card">
      <h2>Quản lý dữ liệu đào tạo</h2>
      <p>
        Đây là khu vực dành cho học phần, lớp học phần, chương trình đào tạo và
        dữ liệu phục vụ xếp lịch thực hành. Tạm thời trang đang ở dạng khung để
        bạn mở rộng tiếp.
      </p>
    </section>
  );
}
