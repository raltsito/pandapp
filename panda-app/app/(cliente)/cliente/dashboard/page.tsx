import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  ShoppingBag,
  ClipboardList,
  ShoppingCart,
  HeadphonesIcon,
  Truck,
  AlertCircle,
  ChevronRight,
  Package,
} from 'lucide-react';

/* ── Constantes de estatus ───────────────────────────────────── */
const ESTATUS_LABEL: Record<string, string> = {
  CREATED:     'Creado',
  IN_PROGRESS: 'En progreso',
  DELIVERED:   'Entregado',
  CANCELLED:   'Cancelado',
  REFUNDED:    'Reembolsado',
};
const ESTATUS_COLOR: Record<string, { text: string; bg: string }> = {
  CREATED:     { text: '#5C5B5B', bg: '#F3F0EF' },
  IN_PROGRESS: { text: '#1E40AF', bg: 'rgba(30,64,175,0.09)' },
  DELIVERED:   { text: '#15803D', bg: 'rgba(21,128,61,0.09)' },
  CANCELLED:   { text: '#B5161E', bg: 'rgba(181,22,30,0.09)' },
  REFUNDED:    { text: '#B45309', bg: 'rgba(180,83,9,0.09)' },
};

/* ── Accesos rápidos ─────────────────────────────────────────── */
const ACCESOS = [
  {
    href:  '/cliente/catalogo',
    label: 'Catálogo',
    desc:  'Explora nuestros pasteles artesanales',
    icon:  ShoppingBag,
    grad:  'linear-gradient(135deg,#B5161E,#FFB467)',
  },
  {
    href:  '/cliente/pedidos',
    label: 'Mis Pedidos',
    desc:  'Revisa el historial y estado',
    icon:  ClipboardList,
    grad:  'linear-gradient(135deg,#874E00,#FFB467)',
  },
  {
    href:  '/cliente/carrito',
    label: 'Carrito',
    desc:  'Continúa tu compra',
    icon:  ShoppingCart,
    grad:  'linear-gradient(135deg,#705900,#FFB467)',
  },
  {
    href:  '/cliente/soporte',
    label: 'Soporte',
    desc:  'Necesitas ayuda con un pedido',
    icon:  HeadphonesIcon,
    grad:  'linear-gradient(135deg,#5C5B5B,#AFADAC)',
  },
];

/* ── Helpers ────────────────────────────────────────────────── */
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function horaDeExpiracion(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const min = Math.floor(ms / 60000);
  return min < 1 ? 'menos de 1 min' : `${min} min`;
}

/* ── Página ─────────────────────────────────────────────────── */
export default async function ClienteDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  const supabase = await createClient();

  /* Últimos 5 pedidos */
  const { data: pedidos } = await supabase
    .from('pedido')
    .select('id_pedido, fecha_registro, total, estatus')
    .eq('id_user', user.idUser)
    .order('fecha_registro', { ascending: false })
    .limit(5);

  /* Pedidos IN_PROGRESS — para alertas de entrega */
  const inProgressIds = (pedidos ?? [])
    .filter(p => p.estatus === 'IN_PROGRESS')
    .map(p => p.id_pedido);

  /* Alertas: entregas pendientes de confirmación */
  let entregasPendientes: { id_pedido: number }[] = [];
  if (inProgressIds.length > 0) {
    const { data } = await supabase
      .from('entrega')
      .select('id_pedido')
      .in('id_pedido', inProgressIds)
      .eq('confirmado', false);
    entregasPendientes = data ?? [];
  }

  /* Alertas: reservas de inventario activas a punto de expirar */
  const createdIds = (pedidos ?? [])
    .filter(p => p.estatus === 'CREATED')
    .map(p => p.id_pedido);

  let reservasActivas: { id_pedido: number; expiracion: string }[] = [];
  if (createdIds.length > 0) {
    const { data } = await supabase
      .from('reserva_inventario')
      .select('id_pedido, expiracion')
      .in('id_pedido', createdIds)
      .eq('activa', true)
      .gt('expiracion', new Date().toISOString());
    reservasActivas = data ?? [];
  }

  const totalPedidos   = pedidos?.length ?? 0;
  const pedidosActivos = (pedidos ?? []).filter(p =>
    p.estatus === 'CREATED' || p.estatus === 'IN_PROGRESS'
  ).length;

  const firstName = user.nombre.split(' ')[0];

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F9F6F5',
      fontFamily: 'var(--font-body)',
      paddingBottom: '60px',
    }}>
      <style>{`
        .acceso-card {
          background: #fff;
          border-radius: 1.5rem;
          padding: 22px 18px;
          box-shadow: 0 20px 40px rgba(47,47,46,0.06);
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          display: block;
        }
        .acceso-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 28px 48px rgba(47,47,46,0.10);
        }
        .pedido-row {
          background: #fff;
          border-radius: 1.5rem;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 20px 40px rgba(47,47,46,0.06);
          gap: 12px;
          transition: transform 0.15s ease;
        }
        .pedido-row:hover {
          transform: translateY(-2px);
        }
      `}</style>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '36px 20px 0' }}>

        {/* ── Greeting ─────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.85rem', color: '#AFADAC', fontWeight: 500, marginBottom: '4px' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '2.4rem', color: '#2F2F2E', lineHeight: 1.1, marginBottom: '4px',
          }}>
            Hola, <span style={{ color: '#B5161E' }}>{firstName}</span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#5C5B5B' }}>
            Bienvenido de nuevo a PanDa Pastelería
          </p>
        </div>

        {/* ── KPI chips ─────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <div style={chipStyle}>
            <Package size={16} color="#B5161E" />
            <span style={{ fontWeight: 700, color: '#2F2F2E' }}>{totalPedidos}</span>
            <span style={{ color: '#5C5B5B', fontSize: '0.82rem' }}>pedidos totales</span>
          </div>
          <div style={chipStyle}>
            <Truck size={16} color="#1E40AF" />
            <span style={{ fontWeight: 700, color: '#2F2F2E' }}>{pedidosActivos}</span>
            <span style={{ color: '#5C5B5B', fontSize: '0.82rem' }}>activos ahora</span>
          </div>
        </div>

        {/* ── Alertas ───────────────────────────────────────── */}
        {(entregasPendientes.length > 0 || reservasActivas.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>

            {entregasPendientes.map(e => (
              <Link
                key={e.id_pedido}
                href={`/cliente/pedidos/${e.id_pedido}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={alertCard('#1E40AF', 'rgba(30,64,175,0.07)')}>
                  <Truck size={18} color="#1E40AF" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#1E40AF' }}>Tu pedido #{e.id_pedido} está en camino</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#5C5B5B' }}>
                      Toca para ver el código de confirmación y seguimiento
                    </p>
                  </div>
                  <ChevronRight size={16} color="#1E40AF" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            ))}

            {reservasActivas.map(r => {
              const tiempo = horaDeExpiracion(r.expiracion);
              if (!tiempo) return null;
              return (
                <Link
                  key={r.id_pedido}
                  href={`/cliente/checkout`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={alertCard('#B45309', 'rgba(180,83,9,0.07)')}>
                    <AlertCircle size={18} color="#B45309" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: '#B45309' }}>
                        Reserva por expirar — {tiempo}
                      </strong>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#5C5B5B' }}>
                        Completa el pago del pedido #{r.id_pedido} antes de que se libere tu reserva
                      </p>
                    </div>
                    <ChevronRight size={16} color="#B45309" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Accesos rápidos ───────────────────────────────── */}
        <h2 style={sectionTitle}>Accesos rápidos</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '40px',
        }}>
          {ACCESOS.map(({ href, label, desc, icon: Icon, grad }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div className="acceso-card">
                <div style={{
                  width: '44px', height: '44px',
                  background: grad,
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <Icon size={20} color="#FFEFED" />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#2F2F2E', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#AFADAC', lineHeight: 1.4 }}>
                  {desc}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Pedidos recientes ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Pedidos recientes</h2>
          <Link href="/cliente/pedidos" style={{ fontSize: '0.85rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none' }}>
            Ver todos
          </Link>
        </div>

        {(!pedidos || pedidos.length === 0) ? (
          <div style={{
            background: '#fff',
            borderRadius: '1.5rem',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(47,47,46,0.06)',
          }}>
            <div style={{
              width: '56px', height: '56px',
              background: '#F3F0EF',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <ShoppingBag size={24} color="#AFADAC" />
            </div>
            <p style={{ color: '#AFADAC', fontSize: '0.95rem', marginBottom: '20px' }}>
              Aún no has hecho ningún pedido
            </p>
            <Link href="/cliente/catalogo" style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: 'linear-gradient(135deg,#B5161E,#FFB467)',
              color: '#FFEFED',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}>
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pedidos.map(p => {
              const ec = ESTATUS_COLOR[p.estatus] ?? { text: '#5C5B5B', bg: '#F3F0EF' };
              return (
                <Link key={p.id_pedido} href={`/cliente/pedidos/${p.id_pedido}`} style={{ textDecoration: 'none' }}>
                  <div className="pedido-row">
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: '#2F2F2E', marginBottom: '3px' }}>
                        Pedido #{p.id_pedido}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#AFADAC' }}>
                        {formatFecha(p.fecha_registro)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1rem', color: '#FFB467' }}>
                        ${Number(p.total).toFixed(2)}
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: '50px',
                        fontSize: '0.75rem', fontWeight: 700,
                        color: ec.text, background: ec.bg,
                        whiteSpace: 'nowrap',
                      }}>
                        {ESTATUS_LABEL[p.estatus] ?? p.estatus}
                      </span>
                      <ChevronRight size={15} color="#AFADAC" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Estilos inline reutilizables ───────────────────────────── */
const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: '#fff',
  borderRadius: '50px',
  padding: '8px 16px',
  boxShadow: '0 20px 40px rgba(47,47,46,0.06)',
  fontSize: '0.85rem',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1.2rem',
  color: '#2F2F2E',
  marginBottom: '16px',
};

function alertCard(color: string, bg: string): React.CSSProperties {
  return {
    background: bg,
    border: `1.5px solid ${color}22`,
    borderRadius: '1rem',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  };
}
