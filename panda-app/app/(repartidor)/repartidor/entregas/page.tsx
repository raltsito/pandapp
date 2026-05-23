import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

interface Props {
  searchParams: Promise<{ filtro?: string }>;
}

export default async function EntregasPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user || user.role !== 'REPARTIDOR') redirect('/login');

  const { filtro } = await searchParams;
  const supabase   = await createClient();

  const { data: repData } = await supabase
    .from('repartidor')
    .select('id_repartidor')
    .eq('id_user', user.idUser)
    .single();

  if (!repData) redirect('/login');

  const { data: entregas } = await supabase
    .from('entrega')
    .select('id_entrega, confirmado, id_pedido, pedido(estatus, total, fecha_registro, users(nombre, telefono, calle, colonia, num_casa))')
    .eq('id_repartidor', repData.id_repartidor)
    .order('id_entrega', { ascending: false });

  type EntregaRow = {
    id_entrega: number; confirmado: boolean; id_pedido: number;
    pedido: { estatus: string; total: number; fecha_registro: string; users: { nombre: string; telefono: string | null; calle: string; colonia: string; num_casa: number } | null } | null;
  };

  const lista = (entregas ?? [] as unknown[]) as EntregaRow[];
  const filtradas = lista.filter(e => {
    if (!filtro || filtro === 'todos') return true;
    if (filtro === 'pendientes') return !e.confirmado && e.pedido?.estatus !== 'CANCELLED';
    if (filtro === 'entregados') return e.confirmado;
    return true;
  });

  const counts = {
    todos:      lista.length,
    pendientes: lista.filter(e => !e.confirmado && e.pedido?.estatus !== 'CANCELLED').length,
    entregados: lista.filter(e => e.confirmado).length,
  };

  const FILTROS = [
    { key: 'todos',      label: 'Todas' },
    { key: 'pendientes', label: 'Pendientes' },
    { key: 'entregados', label: 'Entregadas' },
  ];

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E', marginBottom: '24px' }}>
        Mis Entregas
      </h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {FILTROS.map(f => {
          const active = (filtro ?? 'todos') === f.key;
          return (
            <Link key={f.key} href={`/repartidor/entregas?filtro=${f.key}`}
              style={{ padding: '7px 14px', borderRadius: '50px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, background: active ? '#B5161E' : '#EAE7E7', color: active ? '#FFEFED' : '#5C5B5B' }}>
              {f.label} ({counts[f.key as keyof typeof counts]})
            </Link>
          );
        })}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#AFADAC', fontSize: '0.9rem' }}>No hay entregas en esta categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtradas.map(e => {
            const p   = e.pedido;
            const cli = p?.users;
            return (
              <Link key={e.id_entrega} href={`/repartidor/entregas/${e.id_pedido}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', borderRadius: '18px', padding: '18px 20px',
                  border: `1.5px solid ${e.confirmado ? 'rgba(21,128,61,0.25)' : '#EAE7E7'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', color: '#B5161E', fontSize: '1rem' }}>
                        Pedido #{e.id_pedido}
                      </span>
                      <span style={{
                        padding: '3px 9px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700,
                        color: e.confirmado ? '#15803D' : '#1E40AF',
                        background: e.confirmado ? 'rgba(21,128,61,0.08)' : 'rgba(30,64,175,0.08)',
                      }}>
                        {e.confirmado ? 'Entregado' : 'Pendiente'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2F2F2E', marginBottom: '3px' }}>{cli?.nombre ?? '—'}</div>
                    {cli?.telefono && (
                      <div style={{ fontSize: '0.78rem', color: '#5C5B5B', marginBottom: '3px' }}>📞 {cli.telefono}</div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: '#AFADAC' }}>
                      {cli ? `${cli.calle} #${cli.num_casa}, ${cli.colonia}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#FFB467', fontSize: '1rem', marginBottom: '6px' }}>
                      ${Number(p?.total ?? 0).toFixed(2)}
                    </div>
                    {!e.confirmado && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B5161E', background: 'rgba(181,22,30,0.07)', padding: '4px 10px', borderRadius: '8px' }}>
                        Validar →
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
