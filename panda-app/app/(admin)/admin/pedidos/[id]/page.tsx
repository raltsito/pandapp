import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PedidoAcciones } from './PedidoAcciones';

interface Props { params: Promise<{ id: string }> }

const PEDIDO_LABEL: Record<string, string> = {
  CREATED: 'Creado', IN_PROGRESS: 'En preparación',
  DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};
const PEDIDO_COLOR: Record<string, { text: string; bg: string }> = {
  CREATED:     { text: '#5C5B5B', bg: '#F3F0EF' },
  IN_PROGRESS: { text: '#1E40AF', bg: 'rgba(30,64,175,0.08)' },
  DELIVERED:   { text: '#15803D', bg: 'rgba(21,128,61,0.08)' },
  CANCELLED:   { text: '#B5161E', bg: 'rgba(181,22,30,0.08)' },
  REFUNDED:    { text: '#B45309', bg: 'rgba(180,83,9,0.08)' },
};
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

export default async function AdminPedidoDetallePage({ params }: Props) {
  const { id } = await params;
  const idNum = parseInt(id);
  if (isNaN(idNum)) notFound();

  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from('pedido')
    .select('id_pedido, estatus, total, fecha_registro, fecha_entrega, id_user, users(nombre, email, telefono, calle, colonia, num_casa)')
    .eq('id_pedido', idNum)
    .single();

  if (!pedido) notFound();

  const [detallesRes, pagoRes, eventsRes, entregaRes, repartidoresRes] = await Promise.all([
    supabase.from('detalle_pedido').select('id_detalle, cantidad, subtotal, producto(nombre, foto_url)').eq('id_pedido', idNum),
    supabase.from('pago').select('estatus, monto, error_code, error_mensaje, fecha, id_gateway').eq('id_pedido', idNum).order('fecha', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('event_log').select('estatus_anterior, estatus_nuevo, fecha, descripcion').eq('id_pedido', idNum).order('fecha', { ascending: true }),
    supabase.from('entrega').select('id_entrega, codigo_confirmacion, confirmado, id_repartidor').eq('id_pedido', idNum).maybeSingle(),
    supabase.from('repartidor').select('id_repartidor, users(nombre)').eq('estatus', 'activo'),
  ]);

  type DetalleRow = { id_detalle: number; cantidad: number; subtotal: number; producto: { nombre: string; foto_url: string | null } | { nombre: string; foto_url: string | null }[] | null };
  const detalles     = (detallesRes.data ?? []) as DetalleRow[];
  const pago         = pagoRes.data;
  const events       = eventsRes.data ?? [];
  const entrega      = entregaRes.data;
  const repartidores = (repartidoresRes.data ?? []) as { id_repartidor: number; users: { nombre: string } | { nombre: string }[] | null }[];

  const cliente     = Array.isArray(pedido.users) ? pedido.users[0] : pedido.users;
  const pedidoColor = PEDIDO_COLOR[pedido.estatus] ?? PEDIDO_COLOR.CREATED;
  const pagoColor   = pago ? (PAGO_COLOR[pago.estatus] ?? PAGO_COLOR.INITIATED) : null;

  function fmtFecha(iso: string) {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  function fmtHora(iso: string) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <main style={{ padding: '28px', fontFamily: 'var(--font-body)', maxWidth: '900px' }}>
      <Link href="/admin/pedidos"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#5C5B5B', textDecoration: 'none', marginBottom: '20px' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Volver a Pedidos
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2rem', color: '#B5161E', marginBottom: '8px' }}>
            Pedido #{pedido.id_pedido}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700, color: pedidoColor.text, background: pedidoColor.bg }}>
              Pedido: {PEDIDO_LABEL[pedido.estatus]}
            </span>
            {pago && pagoColor && (
              <span style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700, color: pagoColor.text, background: pagoColor.bg }}>
                Pago: {PAGO_LABEL[pago.estatus] ?? pago.estatus}
              </span>
            )}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.6rem', color: '#FFB467' }}>
          ${Number(pedido.total).toFixed(2)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Cliente */}
          <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Cliente</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2F2F2E', marginBottom: '4px' }}>{cliente?.nombre}</div>
            <div style={{ fontSize: '0.82rem', color: '#5C5B5B', marginBottom: '2px' }}>{cliente?.email}</div>
            {cliente?.telefono && <div style={{ fontSize: '0.82rem', color: '#5C5B5B', marginBottom: '8px' }}>{cliente.telefono}</div>}
            <div style={{ fontSize: '0.82rem', color: '#AFADAC' }}>
              {cliente?.calle} #{cliente?.num_casa}, {cliente?.colonia}
            </div>
          </section>

          {/* Productos */}
          <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Productos</div>
            {detalles.map(d => {
              const prod = Array.isArray(d.producto) ? d.producto[0] : d.producto;
              return (
                <div key={d.id_detalle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F0EF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {prod?.foto_url
                        ? <img src={prod.foto_url} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: 'rgba(255,239,237,0.9)' }}>{prod?.nombre.charAt(0)}</span>
                      }
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#2F2F2E' }}>{prod?.nombre} ×{d.cantidad}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFB467', fontSize: '0.9rem' }}>${Number(d.subtotal).toFixed(2)}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem' }}>
              <span style={{ color: '#2F2F2E' }}>Total</span>
              <span style={{ color: '#B5161E' }}>${Number(pedido.total).toFixed(2)}</span>
            </div>
          </section>

          {/* Pago */}
          {pago && (
            <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>Pago</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#AFADAC' }}>Estado</span>
                  <span style={{ fontWeight: 700, color: pagoColor?.text }}>{PAGO_LABEL[pago.estatus] ?? pago.estatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#AFADAC' }}>Monto</span>
                  <span style={{ fontWeight: 600, color: '#2F2F2E' }}>${Number(pago.monto).toFixed(2)}</span>
                </div>
                {pago.id_gateway && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#AFADAC' }}>Gateway ID</span>
                    <span style={{ fontWeight: 500, color: '#2F2F2E', fontSize: '0.78rem' }}>{pago.id_gateway}</span>
                  </div>
                )}
                {pago.error_code && (
                  <div style={{ marginTop: '8px', padding: '10px 12px', background: 'rgba(181,22,30,0.05)', border: '1.5px solid rgba(181,22,30,0.15)', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#B5161E', fontSize: '0.82rem' }}>{pago.error_code}</div>
                    {pago.error_mensaje && <div style={{ color: '#5C5B5B', fontSize: '0.78rem', marginTop: '2px' }}>{pago.error_mensaje}</div>}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#AFADAC' }}>Fecha</span>
                  <span style={{ color: '#5C5B5B', fontSize: '0.78rem' }}>{fmtFecha(pago.fecha)}</span>
                </div>
              </div>
            </section>
          )}

          {/* Timeline */}
          {events.length > 0 && (
            <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Historial</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[...events].reverse().map((ev, i, arr) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: i < arr.length - 1 ? '16px' : '0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === 0 ? '#B5161E' : '#EAE7E7', border: i === 0 ? 'none' : '2px solid #AFADAC' }} />
                      {i < arr.length - 1 && <div style={{ width: '2px', flex: 1, background: '#EAE7E7', marginTop: '4px' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: i === 0 ? '#2F2F2E' : '#5C5B5B', marginBottom: '2px' }}>
                        {ev.descripcion ?? `${PEDIDO_LABEL[ev.estatus_anterior] ?? ev.estatus_anterior} → ${PEDIDO_LABEL[ev.estatus_nuevo] ?? ev.estatus_nuevo}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#AFADAC' }}>{fmtFecha(ev.fecha)} · {fmtHora(ev.fecha)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Columna derecha — Acciones */}
        <PedidoAcciones
          idPedido={pedido.id_pedido}
          estatusActual={pedido.estatus}
          entrega={entrega ? { id_entrega: entrega.id_entrega, id_repartidor: entrega.id_repartidor, codigo_confirmacion: entrega.codigo_confirmacion, confirmado: entrega.confirmado } : null}
          repartidores={repartidores.map(r => ({ id_repartidor: r.id_repartidor, nombre: (Array.isArray(r.users) ? r.users[0] : r.users)?.nombre ?? 'Sin nombre' }))}
          pagoEstatus={pago?.estatus ?? null}
        />
      </div>
    </main>
  );
}
