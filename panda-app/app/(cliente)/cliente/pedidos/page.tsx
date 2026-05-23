import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const ESTATUS_LABEL: Record<string, string> = {
  CREATED:     'Confirmado',
  IN_PROGRESS: 'Empacado',
  DELIVERED:   'Entregado',
  CANCELLED:   'Cancelado',
  REFUNDED:    'Reembolsado',
};

const ESTATUS_COLOR: Record<string, string> = {
  CREATED:     '#5C5B5B',
  IN_PROGRESS: '#1E40AF',
  DELIVERED:   '#15803D',
  CANCELLED:   '#B5161E',
  REFUNDED:    '#B45309',
};

const ESTATUS_BG: Record<string, string> = {
  CREATED:     '#F3F0EF',
  IN_PROGRESS: 'rgba(30,64,175,0.08)',
  DELIVERED:   'rgba(21,128,61,0.08)',
  CANCELLED:   'rgba(181,22,30,0.08)',
  REFUNDED:    'rgba(180,83,9,0.08)',
};

export default async function PedidosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  const supabase = await createClient();
  const { data: pedidos } = await supabase
    .from('pedido')
    .select('id_pedido, fecha_registro, total, estatus')
    .eq('id_user', user.idUser)
    .order('fecha_registro', { ascending: false });

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px 0' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2.2rem', color: '#B5161E', marginBottom: '28px' }}>
          Mis Pedidos
        </h1>

        {(!pedidos || pedidos.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#AFADAC', fontSize: '1rem', marginBottom: '20px' }}>Aún no tienes pedidos.</p>
            <Link href="/cliente/catalogo" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pedidos.map(p => (
              <Link
                key={p.id_pedido}
                href={`/cliente/pedidos/${p.id_pedido}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="pedido-card">
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#2F2F2E', marginBottom: '4px' }}>
                      Pedido #{p.id_pedido}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#AFADAC' }}>
                      {new Date(p.fecha_registro).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.05rem', color: '#FFB467' }}>
                      ${Number(p.total).toFixed(2)}
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700,
                      color: ESTATUS_COLOR[p.estatus] ?? '#5C5B5B',
                      background: ESTATUS_BG[p.estatus] ?? '#F3F0EF',
                      whiteSpace: 'nowrap',
                    }}>
                      {ESTATUS_LABEL[p.estatus] ?? p.estatus}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="#AFADAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
