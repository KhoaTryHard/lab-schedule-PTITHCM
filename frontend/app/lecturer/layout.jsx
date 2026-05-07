import AppShell from "../../components/layout/AppShell";
import RoleGuard from "../../components/layout/RoleGuard";

const lecturerNavItems = [
  {
    icon: "search",
    itemName: "Lịch giảng viên",
    href: "/lecturer/my-schedule",
  },
];

/**
 * Hàm nhận vào: children là nội dung các trang con trong nhánh /lecturer.
 * Hàm xử lý: kiểm tra quyền GV và bọc trang bằng AppShell.
 * Hàm trả về: JSX layout cho giảng viên.
 */
export default function LecturerLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["GV"]}>
      <AppShell
        navItems={lecturerNavItems}
        brandTitle="Giảng viên"
        brandSubtitle="Theo dõi lịch giảng dạy"
        userName="Giảng viên"
        userRole="GV"
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
