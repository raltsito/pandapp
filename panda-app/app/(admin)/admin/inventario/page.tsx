import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { InventarioClient } from './InventarioClient';

export default async function AdminInventarioPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const supabase = await createClient();
  const { data } = await supabase
    .from('inventario')
    .select('id_inventario, stock_disponible, stock_reservado, producto(id_producto, nombre, activo)')
    .order('id_inventario');

  type Row = {
    id_inventario: number;
    stock_disponible: number;
    stock_reservado: number;
    producto: { id_producto: number; nombre: string; activo: boolean } | { id_producto: number; nombre: string; activo: boolean }[] | null;
  };

  const rows = (data ?? []) as Row[];
  const items = rows.map(r => {
    const prod = Array.isArray(r.producto) ? r.producto[0] : r.producto;
    return {
      id_inventario:   r.id_inventario,
      stock_disponible: r.stock_disponible,
      stock_reservado:  r.stock_reservado,
      id_producto:     prod?.id_producto ?? 0,
      nombre:          prod?.nombre ?? '—',
      activo:          prod?.activo ?? false,
    };
  });

  return <InventarioClient items={items} />;
}
