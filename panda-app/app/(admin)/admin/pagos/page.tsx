import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const PAGO_LABEL: Record<string, string> = {
  INITIATED: 'Iniciado', PENDING: 'Pendiente', PAID: 'Pagado', FAILED: 'Rechazado', REFUNDED: 'Reembolsado',
};
const PAGO_COLOR: Record<string, { text: string; bg: string }> = {
  INITIATED: { text: '#5C5B5B', bg: '#F3F0EF' },
  PENDING:   { text: '#B45309', bg: 'rgba(180,83,9,0.08)' },
  PAID:      { text: '#15803D', bg: 'rgba(21,128,61,0.08)' },
  FAILED:    { text: '#B5161E', bg: 'rgba(181,22,30,0.08)' },
  REFUNDED:  { text: '#B45309', bg: 'rgba(180,83,9,0.08)' },
};

interface Props {
  searchParams: Promise<{ estatus?: string }>;
}

export default async function AdminPagosPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const { estatus } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('pago')
    .select('id_pago, estatus, monto, error_code, error_mensaje, id_gateway, fecha, id_pedido, pedido(id_pedido, users(nombre))')
    .order('fecha', { ascending: false });

  if (estatus && estatus !== 'TODOS') query = query.eq('estatus', estatus);

  const { data: pagos } = await query;
  const lista = pagos ?? [];

  const counts = lista.reduce((acc, p) => { acc[p.estatus] = (acc[p.estatus] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const FILTROS = ['TODOS', 'PAID', 'FAILED', 'PENDING', 'REFUNDED', 'INITIATED'];

  return (
    <main style={{ padding: '32px 28px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E', marginBottom: '24px' }}>
        Pagos
      </h1>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {FILTROS.map(f => {
          const active = (estatus ?? 'TODOS') === f;
          const count  = f === 'TODOS' ? lista.length : (counts[f] ?? 0);
          return (
            <Link key={f} href={`/admin/pagos?estatus=${f}`}
              style={{ padding: '6px 14px', borderRadius: '50px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, background: active ? '#B5161E' : '#EAE7E7', color: active ? '#FFEFED' : '#5C5B5B' }}>
              {f === 'TODOS' ? 'Todos' : PAGO_LABEL[f]} ({count})
            </Link>
          );
        })}
      </div>

      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['ID Pago', 'Pedido', 'Cliente', 'Monto', 'Estado', 'Error', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(p => {
                const pedObj  = Array.isArray(p.pedido) ? p.pedido[0] : p.pedido;
                const cliente = pedObj ? (Array.isArray(pedObj.users) ? pedObj.users[0] : pedObj.users) : null;
                const color   = PAGO_COLOR[p.estatus] ?? PAGO_COLOR.INITIATED;
                return (
                  <tr key={p.id_pago} style={{ borderTop: '1px solid #F3F0EF' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#AFADAC', fontFamily: 'monospace' }}>#{p.id_pago}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/admin/pedidos/${p.id_pedido}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', color: '#B5161E', textDecoration: 'none', fontSize: '0.9rem' }}>
                        #{p.id_pedido}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#2F2F2E' }}>{cliente?.nombre ?? '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFB467' }}>${Number(p.monto).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: color.text, background: color.bg }}>
                        {PAGO_LABEL[p.estatus] ?? p.estatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.error_code ? (
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#B5161E', background: 'rgba(181,22,30,0.06)', padding: '3px 8px', borderRadius: '6px' }}>
                          {p.error_code}
                        </span>
                      ) : <span style={{ color: '#AFADAC', fontSize: '0.78rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#AFADAC', whiteSpace: 'nowrap' }}>
                      {new Date(p.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#AFADAC', fontSize: '0.9rem' }}>No hay pagos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
