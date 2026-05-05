import AppShell from "../../components/layout/AppShell";
import RoleGuard from "../../components/layout/RoleGuard";

const academicNavItems = [
  {
    icon: "person",
    itemName: "Yêu cầu xếp lịch",
    href: "/academic/schedule-requests",
  },
  {
    icon: "chart",
    itemName: "Xếp lịch tự động",
    href: "/academic/auto-arrange",
  },
  {
    icon: "school",
    itemName: "Lịch thực hành",
    href: "/academic/schedules",
  },
];

/**
 * Hàm nhận vào: children là nội dung các trang con trong nhánh /academic.
 * Hàm xử lý: kiểm tra quyền CBDT và bọc trang bằng AppShell.
 * Hàm trả về: JSX layout cho cán bộ đào tạo.
 */
export default function AcademicLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["CBDT"]}>
      <AppShell
        navItems={academicNavItems}
        brandTitle="Cán bộ đào tạo"
        brandSubtitle="Điều phối lịch thực hành"
        userName="Cán bộ đào tạo"
        userRole="CBDT"
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
