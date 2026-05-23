import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CancelarButton } from './CancelarButton';

interface Props {
  params: Promise<{ id: string }>;
}

/* ── Mapas de estatus ──────────────────────────────────────── */

const PEDIDO_LABEL: Record<string, string> = {
  CREATED:     'Creado',
  IN_PROGRESS: 'En preparación',
  DELIVERED:   'Entregado',
  CANCELLED:   'Cancelado',
  REFUNDED:    'Reembolsado',
};

const PEDIDO_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  CREATED:     { text: '#5C5B5B', bg: '#F3F0EF',                border: '#AFADAC' },
  IN_PROGRESS: { text: '#1E40AF', bg: 'rgba(30,64,175,0.08)',   border: '#1E40AF' },
  DELIVERED:   { text: '#15803D', bg: 'rgba(21,128,61,0.08)',   border: '#15803D' },
  CANCELLED:   { text: '#B5161E', bg: 'rgba(181,22,30,0.08)',   border: '#B5161E' },
  REFUNDED:    { text: '#B45309', bg: 'rgba(180,83,9,0.08)',    border: '#B45309' },
};

const PAGO_LABEL: Record<string, string> = {
  INITIATED: 'Iniciado',
  PENDING:   'Pendiente',
  PAID:      'Confirmado',
  FAILED:    'Rechazado',
  REFUNDED:  'Reembolsado',
};

const PAGO_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  INITIATED: { text: '#5C5B5B', bg: '#F3F0EF',                border: '#AFADAC' },
  PENDING:   { text: '#B45309', bg: 'rgba(180,83,9,0.08)',    border: '#B45309' },
  PAID:      { text: '#15803D', bg: 'rgba(21,128,61,0.08)',   border: '#15803D' },
  FAILED:    { text: '#B5161E', bg: 'rgba(181,22,30,0.08)',   border: '#B5161E' },
  REFUNDED:  { text: '#B45309', bg: 'rgba(180,83,9,0.08)',    border: '#B45309' },
};

/* ── Helpers ───────────────────────────────────────────────── */

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });
}

function eventoLabel(estatusNuevo: string, descripcion: string | null): string {
  if (descripcion) return descripcion;
  return `Pedido ${PEDIDO_LABEL[estatusNuevo]?.toLowerCase() ?? estatusNuevo}`;
}

/* ── Stepper ───────────────────────────────────────────────── */

const STEPS = [
  { label: 'Confirmado' },
  { label: 'Empacado'   },
  { label: 'En camino'  },
  { label: 'Entregado'  },
];

function getCurrentStep(estatus: string, pagoPaid: boolean, hasEntrega: boolean): number {
  if (estatus === 'DELIVERED') return 3;
  if (hasEntrega && estatus === 'IN_PROGRESS') return 2;
  if (estatus === 'IN_PROGRESS') return 1;
  if (pagoPaid) return 0;
  return -1;
}

/* ── Stepper component ────────────────────────────────────── */

function Stepper({ currentStep }: { currentStep: number }) {
  const fillPercent = currentStep < 0 ? 0 : (currentStep / (STEPS.length - 1)) * 100;

  return (
    <div className="stepper-track">
      {/* Línea base */}
      <div className="stepper-line" style={{ left: '12.5%', right: '12.5%' }}>
        <div className="stepper-line-fill" style={{ width: `${fillPercent}%` }} />
      </div>

      {STEPS.map((step, i) => {
        const cls = i < currentStep ? 'done' : i === currentStep ? 'active' : '';
        return (
          <div key={step.label} className={`stepper-step ${cls}`}>
            <div className="stepper-pin" />
            <span className="stepper-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default async function PedidoDetallePage({ params }: Props) {
  const { id } = await params;
  const idNum = parseInt(id);
  if (isNaN(idNum)) notFound();

  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from('pedido')
    .select('id_pedido, fecha_registro, fecha_entrega, total, estatus')
    .eq('id_pedido', idNum)
    .eq('id_user', user.idUser)
    .single();

  if (!pedido) notFound();

  const [detallesRes, pagoRes, eventsRes, entregaRes, perfilRes] = await Promise.all([
    supabase
      .from('detalle_pedido')
      .select('id_detalle, cantidad, subtotal, producto(nombre, foto_url)')
      .eq('id_pedido', idNum),
    supabase
      .from('pago')
      .select('estatus, monto, error_code, error_mensaje, fecha')
      .eq('id_pedido', idNum)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('event_log')
      .select('estatus_anterior, estatus_nuevo, fecha, descripcion')
      .eq('id_pedido', idNum)
      .order('fecha', { ascending: true }),
    supabase
      .from('entrega')
      .select('codigo_confirmacion, confirmado, id_repartidor')
      .eq('id_pedido', idNum)
      .maybeSingle(),
    supabase
      .from('users')
      .select('calle, colonia, num_casa, nombre')
      .eq('id_user', user.idUser)
      .single(),
  ]);

  type DetalleRow = { id_detalle: number; cantidad: number; subtotal: number; producto: { nombre: string; foto_url: string | null } | { nombre: string; foto_url: string | null }[] | null };
  const detalles = (detallesRes.data ?? []) as DetalleRow[];
  const pago     = pagoRes.data;
  const events   = eventsRes.data ?? [];
  const entrega  = entregaRes.data;
  const perfil   = perfilRes.data;

  const total          = Number(pedido.total);
  const pagoPaid       = pago?.estatus === 'PAID';
  const hasEntrega     = !!entrega?.id_repartidor;
  const currentStep    = getCurrentStep(pedido.estatus, pagoPaid, hasEntrega);
  const especialEstado = pedido.estatus === 'CANCELLED' || pedido.estatus === 'REFUNDED';
  const pagoColor      = pago ? PAGO_COLOR[pago.estatus] : null;
  const pedidoColor    = PEDIDO_COLOR[pedido.estatus];

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px 0' }}>

        {/* Volver */}
        <Link
          href="/cliente/pedidos"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#5C5B5B', textDecoration: 'none', marginBottom: '20px' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver a Mis Pedidos
        </Link>

        {/* Banner cancelado/reembolsado */}
        {especialEstado && (
          <div style={{ marginBottom: '24px', padding: '14px 18px', background: pedidoColor.bg, border: `1.5px solid ${pedidoColor.border}`, borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0z" stroke={pedidoColor.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: pedidoColor.text }}>
                Este pedido fue {PEDIDO_LABEL[pedido.estatus].toLowerCase()}.
              </span>
            </div>
          </div>
        )}

        {/* HERO */}
        <header style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>
            Pedido número
          </div>
          <h1 className="pedido-hero-num">
            #{pedido.id_pedido}
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#5C5B5B', marginTop: '12px' }}>
            Realizado el <strong style={{ color: '#2F2F2E' }}>{formatFecha(pedido.fecha_registro)}</strong>
            {' · '}
            {formatHora(pedido.fecha_registro)}
          </p>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}>
            <span className="status-chip" style={{ color: pedidoColor.text, background: pedidoColor.bg, borderColor: pedidoColor.border }}>
              <span className="chip-dot" style={{ background: pedidoColor.text }} />
              Pedido: {PEDIDO_LABEL[pedido.estatus]}
            </span>
            {pago && pagoColor && (
              <span className="status-chip" style={{ color: pagoColor.text, background: pagoColor.bg, borderColor: pagoColor.border }}>
                <span className="chip-dot" style={{ background: pagoColor.text }} />
                Pago: {PAGO_LABEL[pago.estatus] ?? pago.estatus}
              </span>
            )}
          </div>
        </header>

        {/* SEGUIMIENTO — Stepper */}
        {!especialEstado && (
          <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px 24px 22px', marginBottom: '20px' }}>
            <div className="section-eyebrow">Seguimiento</div>
            <Stepper currentStep={currentStep} />
            {hasEntrega && entrega?.codigo_confirmacion && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: '#5C5B5B', marginBottom: '8px' }}>
                  Código de confirmación de entrega
                </p>
                <div className="codigo-confirmacion">{entrega.codigo_confirmacion}</div>
                <p style={{ fontSize: '0.75rem', color: '#AFADAC', marginTop: '8px' }}>
                  Compártelo solo con el repartidor al recibir.
                </p>
              </div>
            )}
          </section>
        )}

        {/* PRODUCTOS */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px 24px 18px', marginBottom: '20px' }}>
          <div className="section-eyebrow">Productos</div>
          <div>
            {detalles.map(d => {
              const prod = Array.isArray(d.producto) ? d.producto[0] : d.producto;
              return (
                <div key={d.id_detalle} className="pedido-item">
                  <div className="pedido-item-img">
                    {prod?.foto_url
                      ? <img src={prod.foto_url} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'rgba(255,239,237,0.9)' }}>{prod?.nombre.charAt(0) ?? '?'}</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1rem', color: '#B5161E', marginBottom: '2px' }}>
                      {prod?.nombre ?? 'Producto'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#AFADAC' }}>
                      Cantidad: {d.cantidad}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.1rem', color: '#FFB467' }}>
                    ${Number(d.subtotal).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px dashed #EAE7E7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
              <span style={{ color: '#2F2F2E' }}>Total</span>
              <span style={{ color: '#B5161E', fontStyle: 'italic' }}>${total.toFixed(2)} MXN</span>
            </div>
          </div>
        </section>

        {/* ENTREGA */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px 24px 22px', marginBottom: '20px' }}>
          <div className="section-eyebrow">Entrega</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#2F2F2E' }}>{perfil?.nombre ?? user.nombre}</div>
              <div style={{ fontSize: '0.86rem', color: '#5C5B5B', marginTop: '2px' }}>
                {perfil?.calle ? `${perfil.calle} #${perfil.num_casa}, ${perfil.colonia}` : 'Dirección no disponible'}
              </div>
              {pedido.fecha_entrega && (
                <div style={{ fontSize: '0.82rem', color: '#AFADAC', marginTop: '6px' }}>
                  Estimado: {formatFecha(pedido.fecha_entrega)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* HISTORIAL */}
        {events.length > 0 && (
          <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px 24px 12px', marginBottom: '20px' }}>
            <div className="section-eyebrow">Historial</div>
            <div className="event-timeline">
              {[...events].reverse().map((ev, i) => (
                <div key={i} className={`event-row${i === 0 ? ' last' : ''}`}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2F2F2E', marginBottom: '2px' }}>
                    {eventoLabel(ev.estatus_nuevo, ev.descripcion)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#AFADAC' }}>
                    {formatFecha(ev.fecha)} · {formatHora(ev.fecha)}
                  </div>
                </div>
              ))}
              {/* Evento inicial sintético */}
              <div className="event-row" style={{ paddingBottom: '6px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2F2F2E', marginBottom: '2px' }}>
                  Pedido creado
                </div>
                <div style={{ fontSize: '0.78rem', color: '#AFADAC' }}>
                  {formatFecha(pedido.fecha_registro)} · {formatHora(pedido.fecha_registro)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PAGO INFO si hay error */}
        {pago?.estatus === 'FAILED' && pago.error_mensaje && (
          <section style={{ background: 'rgba(181,22,30,0.04)', border: '1.5px solid rgba(181,22,30,0.25)', borderRadius: '20px', padding: '20px 22px', marginBottom: '20px' }}>
            <div className="section-eyebrow" style={{ color: '#B5161E' }}>Detalle del pago fallido</div>
            <p style={{ fontSize: '0.88rem', color: '#5C5B5B', lineHeight: 1.6 }}>
              <strong style={{ color: '#B5161E' }}>{pago.error_code}</strong> — {pago.error_mensaje}
            </p>
          </section>
        )}

        {/* ACCIONES */}
        <div
          className="pedido-actions-row"
          style={{ display: 'flex', gap: '10px', marginTop: '28px' }}
        >
          <Link href="/cliente/soporte" className="pedido-action-btn pedido-action-ghost" style={{ flex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Contactar soporte
          </Link>

          {pedido.estatus === 'CREATED' && (
            <CancelarButton idPedido={pedido.id_pedido} estatusActual={pedido.estatus} />
          )}
        </div>

      </div>
    </main>
  );
}
