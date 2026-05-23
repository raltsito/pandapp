import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { CartProvider } from '@/components/cart/CartContext';
import { Navbar } from '@/components/navbar/Navbar';

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  return (
    <CartProvider>
      <Navbar userName={user.nombre} />
      <div style={{ paddingTop: '88px' }}>
        {children}
      </div>
    </CartProvider>
  );
}
