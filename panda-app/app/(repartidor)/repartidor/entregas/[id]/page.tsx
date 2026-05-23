import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ValidarEntrega } from './ValidarEntrega';

interface Props { params: Promise<{ id: string }> }

export default async function EntregaDetallePage({ params }: Props) {
  const { id } = await params;
  const idPedido = parseInt(id);
  if (isNaN(idPedido)) notFound();

  const user = await getSessionUser();
  if (!user || user.role !== 'REPARTIDOR') redirect('/login');

  const supabase = await createClient();

  const { data: repData } = await supabase
    .from('repartidor')
    .select('id_repartidor')
    .eq('id_user', user.idUser)
    .single();
  if (!repData) redirect('/login');

  const { data: entrega } = await supabase
    .from('entrega')
    .select('id_entrega, codigo_confirmacion, confirmado')
    .eq('id_pedido', idPedido)
    .eq('id_repartidor', repData.id_repartidor)
    .single();

  if (!entrega) notFound();

  const [pedidoRes, detallesRes] = await Promise.all([
    supabase
      .from('pedido')
      .select('id_pedido, estatus, total, fecha_registro, users(nombre, telefono, email, calle, colonia, num_casa)')
      .eq('id_pedido', idPedido)
      .single(),
    supabase
      .from('detalle_pedido')
      .select('cantidad, subtotal, producto(nombre)')
      .eq('id_pedido', idPedido),
  ]);

  if (!pedidoRes.data) notFound();

  const pedido   = pedidoRes.data;
  const detalles = detallesRes.data ?? [];
  const cliente  = Array.isArray(pedido.users) ? pedido.users[0] : pedido.users;

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px', fontFamily: 'var(--font-body)' }}>
      <Link href="/repartidor/entregas"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#5C5B5B', textDecoration: 'none', marginBottom: '22px' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Mis Entregas
      </Link>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.9rem', color: '#B5161E', marginBottom: '22px' }}>
        Pedido #{idPedido}
      </h1>

      {/* Cliente */}
      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px', marginBottom: '14px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Cliente</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2F2F2E', marginBottom: '4px' }}>{cliente?.nombre}</div>
        {cliente?.telefono && (
          <a href={`tel:${cliente.telefono}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none', marginBottom: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {cliente.telefono}
          </a>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#B5161E"/>
          </svg>
          <div style={{ fontSize: '0.88rem', color: '#2F2F2E', lineHeight: 1.5 }}>
            {cliente ? `${cliente.calle} #${cliente.num_casa}, ${cliente.colonia}` : '—'}
          </div>
        </div>
      </section>

      {/* Productos */}
      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px', marginBottom: '14px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Productos</div>
        {detalles.map((d, i) => {
          const prod = Array.isArray(d.producto) ? d.producto[0] : d.producto;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < detalles.length - 1 ? '1px solid #F3F0EF' : 'none' }}>
              <span style={{ fontSize: '0.88rem', color: '#2F2F2E' }}>{prod?.nombre} ×{d.cantidad}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFB467', fontSize: '0.9rem' }}>${Number(d.subtotal).toFixed(2)}</span>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem' }}>
          <span style={{ color: '#2F2F2E' }}>Total</span>
          <span style={{ color: '#B5161E' }}>${Number(pedido.total).toFixed(2)}</span>
        </div>
      </section>

      {/* Validación */}
      <ValidarEntrega
        idPedido={idPedido}
        idEntrega={entrega.id_entrega}
        codigoEsperado={entrega.codigo_confirmacion ?? ''}
        yaConfirmado={entrega.confirmado}
        estatusActual={pedido.estatus}
      />
    </main>
  );
}
