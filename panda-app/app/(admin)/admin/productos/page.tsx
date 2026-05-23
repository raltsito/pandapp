import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ProductosClient } from './ProductosClient';

export default async function AdminProductosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const supabase = await createClient();
  const { data } = await supabase
    .from('producto')
    .select('id_producto, nombre, descripcion, precio_base, activo, foto_url')
    .order('id_producto');

  return <ProductosClient productos={data ?? []} />;
}
