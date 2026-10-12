'use client';

import { AdminAuthGuard } from '@/components/admin/auth-guard';
import { AdminSidebar } from '@/components/admin/sidebar';
import { LabForm } from '@/components/admin/lab-form';

export default function AdminLabNewPage() {
  return (
    <AdminAuthGuard>
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        <LabForm />
      </main>
    </AdminAuthGuard>
  );
}
