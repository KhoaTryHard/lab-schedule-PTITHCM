import AppShell from "../../components/layout/AppShell";
import RoleGuard from "../../components/layout/RoleGuard";

const technicianNavItems = [
  {
    icon: "equipment",
    itemName: "Lịch sử dụng phòng",
    href: "/technician/room-schedule",
  },
];

/**
 * Hàm nhận vào: children là nội dung các trang con trong nhánh /technician.
 * Hàm xử lý: kiểm tra quyền KTV và bọc trang bằng AppShell.
 * Hàm trả về: JSX layout cho kỹ thuật viên.
 */
export default function TechnicianLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["KTV"]}>
      <AppShell
        navItems={technicianNavItems}
        brandTitle="Kỹ thuật viên"
        brandSubtitle="Theo dõi phòng máy"
        userName="Kỹ thuật viên"
        userRole="KTV"
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
