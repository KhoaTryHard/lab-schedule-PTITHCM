import RoleLayout from "../../components/layout/RoleLayout";

/**
 * Hàm nhận vào: children là toàn bộ nội dung các trang con trong /admin.
 * Hàm xử lý: nạp CSS riêng cho khu vực admin và bọc nội dung bằng RoleLayout QTV.
 * Hàm trả về: JSX layout quản trị viên có sidebar, topbar và route guard.
 */
export default function AdminLayout({ children }) {
  return <RoleLayout roleCode="QTV">{children}</RoleLayout>;
}
