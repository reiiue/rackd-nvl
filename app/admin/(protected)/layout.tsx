import AdminGuard from "@/components/AdminGuard";
import AdminHeader from "@/components/AdminHeader";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminHeader />
      {children}
    </AdminGuard>
  );
}