import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

function KpiCard({ label, value, sub, color, href }: {
  label: string; value: string | number; sub?: string;
  color: string; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px',
        padding: '22px 24px', cursor: 'pointer', transition: 'box-shadow 0.2s',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2.2rem', color, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: '#AFADAC', marginTop: '6px' }}>{sub}</div>}
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const supabase = await createClient();

  const [
    pedidosRes, pagosRes, inventarioRes, entregasRes,
  ] = await Promise.all([
    supabase.from('pedido').select('estatus'),
    supabase.from('pago').select('estatus'),
    supabase.from('inventario').select('stock_disponible'),
    supabase.from('entrega').select('confirmado').eq('confirmado', false),
  ]);

  const pedidos    = pedidosRes.data    ?? [];
  const pagos      = pagosRes.data      ?? [];
  const inventario = inventarioRes.data ?? [];
  const entregas   = entregasRes.data   ?? [];

  const total       = pedidos.length;
  const enProgreso  = pedidos.filter(p => p.estatus === 'IN_PROGRESS').length;
  const entregados  = pedidos.filter(p => p.estatus === 'DELIVERED').length;
  const cancelados  = pedidos.filter(p => p.estatus === 'CANCELLED').length;
  const pagosFail   = pagos.filter(p => p.estatus === 'FAILED').length;
  const agotados    = inventario.filter(i => i.stock_disponible === 0).length;
  const enRuta      = entregas.length;

  const recientesRes = await supabase
    .from('pedido')
    .select('id_pedido, estatus, total, fecha_registro, users(nombre)')
    .order('fecha_registro', { ascending: false })
    .limit(6);

  const recientes = recientesRes.data ?? [];

  const ESTATUS_COLOR: Record<string, string> = {
    CREATED: '#5C5B5B', IN_PROGRESS: '#1E40AF',
    DELIVERED: '#15803D', CANCELLED: '#B5161E', REFUNDED: '#B45309',
  };
  const ESTATUS_LABEL: Record<string, string> = {
    CREATED: 'Creado', IN_PROGRESS: 'En progreso',
    DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
  };
  const ESTATUS_BG: Record<string, string> = {
    CREATED: '#F3F0EF', IN_PROGRESS: 'rgba(30,64,175,0.08)',
    DELIVERED: 'rgba(21,128,61,0.08)', CANCELLED: 'rgba(181,22,30,0.08)', REFUNDED: 'rgba(180,83,9,0.08)',
  };

  return (
    <main style={{ padding: '32px 28px', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#5C5B5B' }}>Bienvenido, <strong>{user.nombre}</strong></p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        <KpiCard label="Pedidos totales"   value={total}      color="#B5161E"  href="/admin/pedidos" />
        <KpiCard label="En preparación"    value={enProgreso} sub="activos"    color="#1E40AF"  href="/admin/pedidos" />
        <KpiCard label="Entregados"        value={entregados} color="#15803D"  href="/admin/pedidos" />
        <KpiCard label="Cancelados"        value={cancelados} color="#B45309"  href="/admin/pedidos" />
        <KpiCard label="Pagos fallidos"    value={pagosFail}  sub="sin resolver" color={pagosFail > 0 ? '#B5161E' : '#15803D'} href="/admin/pagos" />
        <KpiCard label="Productos agotados" value={agotados}  sub="stock = 0"  color={agotados > 0 ? '#B5161E' : '#15803D'}  href="/admin/inventario" />
        <KpiCard label="Entregas en ruta"  value={enRuta}     sub="sin confirmar" color="#874E00" href="/admin/pedidos" />
      </div>

      {/* Pedidos recientes */}
      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #F3F0EF' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Pedidos recientes
          </div>
          <Link href="/admin/pedidos" style={{ fontSize: '0.8rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none' }}>Ver todos →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['#', 'Cliente', 'Total', 'Estado', 'Fecha', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recientes.map(p => {
                const cliente = Array.isArray(p.users) ? p.users[0] : p.users;
                return (
                  <tr key={p.id_pedido} style={{ borderTop: '1px solid #F3F0EF' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', color: '#B5161E', fontSize: '0.95rem' }}>#{p.id_pedido}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.88rem', color: '#2F2F2E', fontWeight: 500 }}>{cliente?.nombre ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFB467', fontSize: '0.9rem' }}>${Number(p.total).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: ESTATUS_COLOR[p.estatus], background: ESTATUS_BG[p.estatus] }}>
                        {ESTATUS_LABEL[p.estatus] ?? p.estatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#AFADAC', whiteSpace: 'nowrap' }}>
                      {new Date(p.fecha_registro).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/admin/pedidos/${p.id_pedido}`} style={{ fontSize: '0.78rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none' }}>Ver →</Link>
                    </td>
                  </tr>
                );
              })}
              {recientes.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#AFADAC', fontSize: '0.88rem' }}>Sin pedidos aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
