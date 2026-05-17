import RoleLayout from "../../components/layout/RoleLayout";

export default function AcademicLayout({ children }) {
  return (
    <RoleLayout roleCode="CBDT" allowedRoles={["QTV", "CBDT"]}>
      {children}
    </RoleLayout>
  );
}
