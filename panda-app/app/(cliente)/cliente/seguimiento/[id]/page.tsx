import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

const ESTATUS_PEDIDO: Record<string, { label: string; color: string; bg: string }> = {
  CREATED:     { label: 'Creado',        color: '#5C5B5B', bg: '#F3F0EF' },
  IN_PROGRESS: { label: 'En preparación', color: '#1E40AF', bg: 'rgba(30,64,175,0.08)' },
  DELIVERED:   { label: 'Entregado',     color: '#15803D', bg: 'rgba(21,128,61,0.08)' },
  CANCELLED:   { label: 'Cancelado',     color: '#B5161E', bg: 'rgba(181,22,30,0.08)' },
  REFUNDED:    { label: 'Reembolsado',   color: '#B45309', bg: 'rgba(180,83,9,0.08)' },
};

const STEPS = ['Confirmado', 'Empacado', 'En camino', 'Entregado'];

function getStep(estatus: string, hasRepartidor: boolean): number {
  if (estatus === 'DELIVERED') return 3;
  if (hasRepartidor && estatus === 'IN_PROGRESS') return 2;
  if (estatus === 'IN_PROGRESS') return 1;
  return 0;
}

export default async function SeguimientoPage({ params }: Props) {
  const { id } = await params;
  const idNum = parseInt(id);
  if (isNaN(idNum)) notFound();

  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from('pedido')
    .select('id_pedido, estatus, fecha_registro, total')
    .eq('id_pedido', idNum)
    .eq('id_user', user.idUser)
    .single();

  if (!pedido) notFound();

  const [entregaRes, detallesRes] = await Promise.all([
    supabase
      .from('entrega')
      .select('codigo_confirmacion, confirmado, id_repartidor')
      .eq('id_pedido', idNum)
      .maybeSingle(),
    supabase
      .from('detalle_pedido')
      .select('cantidad, subtotal, producto(nombre)')
      .eq('id_pedido', idNum),
  ]);

  const entrega     = entregaRes.data;
  const detalles    = detallesRes.data ?? [];
  const hasRepartidor = !!entrega?.id_repartidor;
  const currentStep   = getStep(pedido.estatus, hasRepartidor);
  const info          = ESTATUS_PEDIDO[pedido.estatus] ?? ESTATUS_PEDIDO.CREATED;
  const fillPct       = (currentStep / (STEPS.length - 1)) * 100;

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 20px 0' }}>

        <Link href={`/cliente/pedidos/${idNum}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#5C5B5B', textDecoration: 'none', marginBottom: '24px' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ver detalle del pedido
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>
            Seguimiento
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2rem', color: '#B5161E', marginBottom: '10px' }}>
            Pedido #{pedido.id_pedido}
          </h1>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '50px', fontSize: '0.82rem', fontWeight: 700, color: info.color, background: info.bg }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: info.color, display: 'inline-block' }} />
            {info.label}
          </span>
        </div>

        {/* Stepper */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '28px 28px 24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '28px' }}>
            Estado de entrega
          </div>

          {pedido.estatus === 'CANCELLED' || pedido.estatus === 'REFUNDED' ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#B5161E' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Este pedido fue {info.label.toLowerCase()}.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Línea base */}
              <div style={{ position: 'absolute', top: '18px', left: '12.5%', right: '12.5%', height: '3px', background: '#EAE7E7', borderRadius: '4px', zIndex: 0 }}>
                <div style={{ height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #B5161E, #FFB467)', width: `${fillPct}%`, transition: 'width 0.5s ease' }} />
              </div>
              {STEPS.map((label, i) => {
                const done   = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: done ? 'linear-gradient(135deg,#B5161E,#FFB467)' : active ? '#fff' : '#F3F0EF',
                      border: active ? '2.5px solid #B5161E' : done ? 'none' : '2.5px solid #EAE7E7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.4s',
                    }}>
                      {done && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {active && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#B5161E' }} />}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: done || active ? '#2F2F2E' : '#AFADAC', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Código de confirmación */}
        {entrega?.codigo_confirmacion && pedido.estatus !== 'DELIVERED' && (
          <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '28px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>
              Código de confirmación
            </div>
            <div style={{
              display: 'inline-flex', gap: '10px', marginBottom: '16px',
            }}>
              {entrega.codigo_confirmacion.split('').map((char: string, i: number) => (
                <div key={i} style={{
                  width: '44px', height: '54px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(181,22,30,0.06), rgba(255,180,67,0.06))',
                  border: '1.5px solid rgba(181,22,30,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem',
                  color: '#B5161E', letterSpacing: 0,
                }}>
                  {char}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#5C5B5B', marginBottom: '16px', lineHeight: 1.6 }}>
              Muéstrale este código al repartidor cuando entregue tu pedido.
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(entrega!.codigo_confirmacion!)}
              style={{ background: 'none', border: '1.5px solid #EAE7E7', borderRadius: '50px', padding: '8px 20px', fontSize: '0.82rem', fontWeight: 600, color: '#5C5B5B', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Copiar código
            </button>
          </section>
        )}

        {/* Entregado */}
        {pedido.estatus === 'DELIVERED' && (
          <section style={{ background: 'rgba(21,128,61,0.05)', border: '1.5px solid rgba(21,128,61,0.25)', borderRadius: '20px', padding: '28px', marginBottom: '16px', textAlign: 'center' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 14px', display: 'block' }}>
              <circle cx="12" cy="12" r="10" fill="rgba(21,128,61,0.1)" stroke="#15803D" strokeWidth="1.8"/>
              <path d="M7 12l4 4 6-7" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#15803D', marginBottom: '6px' }}>¡Pedido entregado!</p>
            <p style={{ fontSize: '0.85rem', color: '#5C5B5B' }}>Gracias por tu compra en PanDa.</p>
          </section>
        )}

        {/* Resumen */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px 28px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '14px' }}>
            Resumen
          </div>
          {detalles.map((d, i) => {
            const prod = Array.isArray(d.producto) ? d.producto[0] : d.producto;
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F0EF', fontSize: '0.88rem' }}>
                <span style={{ color: '#2F2F2E' }}>{prod?.nombre ?? 'Producto'} ×{d.cantidad}</span>
                <span style={{ fontWeight: 700, color: '#FFB467' }}>${Number(d.subtotal).toFixed(2)}</span>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem' }}>
            <span style={{ color: '#2F2F2E' }}>Total</span>
            <span style={{ color: '#B5161E' }}>${Number(pedido.total).toFixed(2)} MXN</span>
          </div>
        </section>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/cliente/soporte"
            style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: '50px', background: '#EAE7E7', color: '#2F2F2E', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
            Contactar soporte
          </Link>
          <Link href="/cliente/pedidos"
            style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: '50px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
            Mis pedidos
          </Link>
        </div>

      </div>
    </main>
  );
}
