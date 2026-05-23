import { createClient } from '@/lib/supabase/server';
import { CatalogoGrid } from '@/components/catalogo/CatalogoGrid';

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: productos, error } = await supabase
    .from('producto')
    .select('id_producto, nombre, descripcion, precio_base, foto_url, activo')
    .eq('activo', true)
    .order('id_producto');

  const { data: inventario } = await supabase
    .from('inventario')
    .select('id_producto, stock_disponible');

  if (error) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', color: '#B5161E', fontFamily: 'var(--font-body)' }}>
        Error al cargar productos. Intenta de nuevo.
      </div>
    );
  }

  const stockMap: Record<number, number> = {};
  (inventario ?? []).forEach(i => { stockMap[i.id_producto] = i.stock_disponible; });

  const data = (productos ?? []).map(p => ({
    id_producto:      p.id_producto,
    nombre:           p.nombre,
    descripcion:      p.descripcion,
    precio_base:      Number(p.precio_base),
    foto_url:         p.foto_url,
    stock_disponible: stockMap[p.id_producto] ?? 0,
  }));

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5' }}>
      <CatalogoGrid productos={data} />
    </main>
  );
}
