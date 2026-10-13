import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminShell } from '@/components/admin/admin-shell';

/**
 * Layout de todas las páginas del panel (route group `(panel)`).
 * `/admin/login` queda fuera: no lleva sidebar ni guard.
 */
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
