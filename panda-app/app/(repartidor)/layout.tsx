import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { RepartidorNav } from '@/components/repartidor/RepartidorNav';

export default async function RepartidorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'REPARTIDOR') redirect('/login');

  return (
    <>
      <RepartidorNav nombre={user.nombre} />
      <div style={{ paddingTop: '72px', minHeight: '100vh', background: '#F9F6F5' }}>
        {children}
      </div>
    </>
  );
}
