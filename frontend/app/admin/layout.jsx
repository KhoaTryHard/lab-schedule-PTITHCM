import AppShell from "../../components/layout/AppShell";
import RoleGuard from "../../components/layout/RoleGuard";

// Mảng menu của vai trò quản trị viên dùng để render sidebar bên trái.
const adminNavItems = [
  { icon: "dashboard", itemName: "Tổng quan", href: "/admin" },
  { icon: "person", itemName: "Quản lý tài khoản", href: "/admin/accounts" },
  { icon: "equipment", itemName: "Quản lý thiết bị", href: "/admin/rooms" },
  {
    icon: "school",
    itemName: "Quản lý dữ liệu đào tạo",
    href: "/admin/trainingData",
  },
  { icon: "search", itemName: "Tra cứu", href: "/admin/lookups" },
  {
    icon: "chart",
    itemName: "Thống kê & báo cáo",
    href: "/admin/reports",
  },
  { icon: "settings", itemName: "Cài đặt", href: "/admin/settings" },
];

/**
 * Hàm nhận vào: children là toàn bộ nội dung của các trang con trong nhánh /admin.
 * Hàm xử lý: kiểm tra quyền QTV rồi bọc trang quản trị bằng AppShell.
 * Hàm trả về: JSX của layout quản trị viên dùng chung.
 */
export default function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["QTV"]}>
      <AppShell
        navItems={adminNavItems}
        brandTitle="Quản trị viên"
        brandSubtitle="Quản trị hệ thống"
        userName="Admin PTIT HCM"
        userRole="Quản trị hệ thống"
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
