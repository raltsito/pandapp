import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const ESTATUS_LABEL: Record<string, string> = {
  CREATED: 'Creado', IN_PROGRESS: 'En progreso',
  DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};
const ESTATUS_COLOR: Record<string, string> = {
  CREATED: '#5C5B5B', IN_PROGRESS: '#1E40AF',
  DELIVERED: '#15803D', CANCELLED: '#B5161E', REFUNDED: '#B45309',
};
const ESTATUS_BG: Record<string, string> = {
  CREATED: '#F3F0EF', IN_PROGRESS: 'rgba(30,64,175,0.08)',
  DELIVERED: 'rgba(21,128,61,0.08)', CANCELLED: 'rgba(181,22,30,0.08)', REFUNDED: 'rgba(180,83,9,0.08)',
};

interface Props {
  searchParams: Promise<{ estatus?: string; q?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const { estatus, q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('pedido')
    .select('id_pedido, fecha_registro, total, estatus, users(nombre, email)')
    .order('fecha_registro', { ascending: false });

  if (estatus && estatus !== 'TODOS') query = query.eq('estatus', estatus);

  const { data: pedidos } = await query;

  const filtered = (pedidos ?? []).filter(p => {
    if (!q) return true;
    const term = q.toLowerCase();
    const cliente = Array.isArray(p.users) ? p.users[0] : p.users;
    return (
      String(p.id_pedido).includes(term) ||
      cliente?.nombre?.toLowerCase().includes(term) ||
      cliente?.email?.toLowerCase().includes(term)
    );
  });

  const counts = (pedidos ?? []).reduce((acc, p) => {
    acc[p.estatus] = (acc[p.estatus] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const FILTROS = ['TODOS', 'CREATED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  return (
    <main style={{ padding: '32px 28px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E', marginBottom: '24px' }}>
        Pedidos
      </h1>

      {/* Filtros por estatus */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {FILTROS.map(f => {
          const active = (estatus ?? 'TODOS') === f;
          const count  = f === 'TODOS' ? (pedidos ?? []).length : (counts[f] ?? 0);
          return (
            <Link key={f}
              href={`/admin/pedidos?estatus=${f}${q ? `&q=${q}` : ''}`}
              style={{
                padding: '6px 14px', borderRadius: '50px', textDecoration: 'none',
                fontSize: '0.78rem', fontWeight: 700,
                background: active ? '#B5161E' : '#EAE7E7',
                color: active ? '#FFEFED' : '#5C5B5B',
                transition: 'all 0.15s',
              }}
            >
              {f === 'TODOS' ? 'Todos' : ESTATUS_LABEL[f]} ({count})
            </Link>
          );
        })}
      </div>

      {/* Buscador */}
      <form method="GET" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {estatus && <input type="hidden" name="estatus" value={estatus} />}
        <input
          name="q" defaultValue={q}
          placeholder="Buscar por # pedido, nombre o email..."
          style={{
            flex: 1, padding: '11px 16px', borderRadius: '12px',
            border: '2px solid #EAE7E7', fontFamily: 'var(--font-body)',
            fontSize: '0.9rem', outline: 'none', maxWidth: '400px',
          }}
        />
        <button type="submit" style={{ padding: '11px 20px', borderRadius: '12px', border: 'none', background: '#B5161E', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'var(--font-body)' }}>
          Buscar
        </button>
        {q && (
          <Link href={`/admin/pedidos${estatus ? `?estatus=${estatus}` : ''}`}
            style={{ padding: '11px 16px', borderRadius: '12px', background: '#EAE7E7', color: '#5C5B5B', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla */}
      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['#', 'Cliente', 'Total', 'Estado', 'Fecha', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cliente = Array.isArray(p.users) ? p.users[0] : p.users;
                return (
                  <tr key={p.id_pedido} style={{ borderTop: '1px solid #F3F0EF' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', color: '#B5161E' }}>#{p.id_pedido}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2F2F2E' }}>{cliente?.nombre ?? '—'}</div>
                      <div style={{ fontSize: '0.76rem', color: '#AFADAC' }}>{cliente?.email ?? ''}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFB467' }}>${Number(p.total).toFixed(2)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: ESTATUS_COLOR[p.estatus], background: ESTATUS_BG[p.estatus] }}>
                        {ESTATUS_LABEL[p.estatus] ?? p.estatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#AFADAC', whiteSpace: 'nowrap' }}>
                      {new Date(p.fecha_registro).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/admin/pedidos/${p.id_pedido}`} style={{ fontSize: '0.8rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver →</Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#AFADAC', fontSize: '0.9rem' }}>No se encontraron pedidos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
