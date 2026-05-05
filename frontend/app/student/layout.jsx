import AppShell from "../../components/layout/AppShell";
import RoleGuard from "../../components/layout/RoleGuard";

const studentNavItems = [
  {
    icon: "school",
    itemName: "Lịch sinh viên",
    href: "/student/my-schedule",
  },
];

/**
 * Hàm nhận vào: children là nội dung các trang con trong nhánh /student.
 * Hàm xử lý: kiểm tra quyền SV và bọc trang bằng AppShell.
 * Hàm trả về: JSX layout cho sinh viên.
 */
export default function StudentLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["SV"]}>
      <AppShell
        navItems={studentNavItems}
        brandTitle="Sinh viên"
        brandSubtitle="Tra cứu lịch thực hành"
        userName="Sinh viên"
        userRole="SV"
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
