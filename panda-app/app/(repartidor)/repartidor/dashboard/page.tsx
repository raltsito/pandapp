import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function RepartidorDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== 'REPARTIDOR') redirect('/login');

  const supabase = await createClient();

  const { data: repData } = await supabase
    .from('repartidor')
    .select('id_repartidor')
    .eq('id_user', user.idUser)
    .single();

  if (!repData) redirect('/login');
  const idRepartidor = repData.id_repartidor;

  const { data: entregas } = await supabase
    .from('entrega')
    .select('id_entrega, confirmado, id_pedido, pedido(estatus, total, fecha_registro, users(nombre, calle, colonia, num_casa))')
    .eq('id_repartidor', idRepartidor);

  const lista = (entregas ?? [] as unknown[]) as {
    id_entrega: number;
    confirmado: boolean;
    id_pedido: number;
    pedido: { estatus: string; total: number; fecha_registro: string; users: { nombre: string; calle: string; colonia: string; num_casa: number } | null } | null;
  }[];

  const pendientes   = lista.filter(e => !e.confirmado && e.pedido?.estatus !== 'CANCELLED');
  const entregadosHoy = lista.filter(e => {
    if (!e.confirmado) return false;
    const hoy = new Date().toDateString();
    return e.pedido ? new Date(e.pedido.fecha_registro).toDateString() === hoy : false;
  });

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E', marginBottom: '6px' }}>
        Bienvenido, {user.nombre.split(' ')[0]}
      </h1>
      <p style={{ fontSize: '0.88rem', color: '#5C5B5B', marginBottom: '28px' }}>
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '22px 24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Pendientes</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2.4rem', color: pendientes.length > 0 ? '#B5161E' : '#15803D', lineHeight: 1 }}>{pendientes.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#AFADAC', marginTop: '4px' }}>por entregar</div>
        </div>
        <div style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '22px 24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Hoy</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2.4rem', color: '#15803D', lineHeight: 1 }}>{entregadosHoy.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#AFADAC', marginTop: '4px' }}>entregados</div>
        </div>
      </div>

      {/* Pendientes */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#2F2F2E' }}>Por entregar</h2>
          <Link href="/repartidor/entregas" style={{ fontSize: '0.8rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
        </div>

        {pendientes.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <p style={{ color: '#AFADAC', fontSize: '0.9rem' }}>No tienes entregas pendientes. ¡Buen trabajo!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendientes.slice(0, 3).map(e => {
              const p    = e.pedido;
              const cli  = p?.users;
              return (
                <Link key={e.id_entrega} href={`/repartidor/entregas/${e.id_pedido}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '16px', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', color: '#B5161E', fontSize: '0.95rem', marginBottom: '3px' }}>Pedido #{e.id_pedido}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2F2F2E' }}>{cli?.nombre ?? '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#AFADAC', marginTop: '2px' }}>{cli ? `${cli.calle} #${cli.num_casa}, ${cli.colonia}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#FFB467', fontSize: '1rem' }}>${Number(p?.total ?? 0).toFixed(2)}</div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: '6px' }}>
                        <path d="M6 3l5 5-5 5" stroke="#AFADAC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
            {pendientes.length > 3 && (
              <Link href="/repartidor/entregas" style={{ textAlign: 'center', padding: '12px', borderRadius: '12px', background: '#EAE7E7', color: '#5C5B5B', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                Ver {pendientes.length - 3} más
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Entregados hoy */}
      {entregadosHoy.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#2F2F2E', marginBottom: '14px' }}>Entregados hoy</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {entregadosHoy.map(e => {
              const cli = e.pedido?.users;
              return (
                <div key={e.id_entrega} style={{ background: 'rgba(21,128,61,0.04)', border: '1.5px solid rgba(21,128,61,0.2)', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', color: '#15803D', fontSize: '0.9rem' }}>Pedido #{e.id_pedido}</div>
                    <div style={{ fontSize: '0.82rem', color: '#5C5B5B' }}>{cli?.nombre ?? '—'}</div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="rgba(21,128,61,0.1)" stroke="#15803D" strokeWidth="1.5"/>
                    <path d="M7 12l4 4 6-7" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
