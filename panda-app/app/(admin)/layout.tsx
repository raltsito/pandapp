import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  return (
    <>
      <AdminSidebar nombre={user.nombre} />
      <div style={{ marginLeft: '220px', minHeight: '100vh', background: '#F9F6F5' }}
        className="admin-main-content">
        {children}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .admin-main-content { margin-left: 0 !important; padding-top: 60px; }
        }
      `}</style>
    </>
  );
}
