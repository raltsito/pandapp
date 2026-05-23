'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  idPedido: number;
  idEntrega: number;
  codigoEsperado: string;
  yaConfirmado: boolean;
  estatusActual: string;
}

export function ValidarEntrega({ idPedido, idEntrega, codigoEsperado, yaConfirmado, estatusActual }: Props) {
  const supabase = createClient();
  const router   = useRouter();

  const [codigo,   setCodigo]   = useState('');
  const [estado,   setEstado]   = useState<'idle' | 'ok' | 'err'>(yaConfirmado ? 'ok' : 'idle');
  const [loading,  setLoading]  = useState(false);
  const [intento,  setIntento]  = useState(0);

  if (estatusActual === 'CANCELLED') {
    return (
      <div style={{ background: 'rgba(181,22,30,0.05)', border: '1.5px solid rgba(181,22,30,0.2)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: '#B5161E', fontSize: '0.9rem' }}>Este pedido fue cancelado.</p>
      </div>
    );
  }

  if (estado === 'ok' || yaConfirmado) {
    return (
      <div style={{ background: 'rgba(21,128,61,0.05)', border: '1.5px solid rgba(21,128,61,0.25)', borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', background: '#15803D', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#15803D', marginBottom: '6px' }}>¡Entrega confirmada!</p>
        <p style={{ fontSize: '0.85rem', color: '#5C5B5B', marginBottom: '20px' }}>El pedido ha sido marcado como entregado.</p>
        <a href="/repartidor/entregas" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '50px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
          Volver a entregas
        </a>
      </div>
    );
  }

  async function handleValidar(e: React.FormEvent) {
    e.preventDefault();
    const input = codigo.trim().toUpperCase();

    if (input !== codigoEsperado.toUpperCase()) {
      setIntento(n => n + 1);
      setEstado('err');
      setCodigo('');
      return;
    }

    setLoading(true);
    await Promise.all([
      supabase.from('entrega').update({ confirmado: true }).eq('id_entrega', idEntrega),
      supabase.from('pedido').update({ estatus: 'DELIVERED' }).eq('id_pedido', idPedido),
      supabase.from('event_log').insert({
        id_pedido:        idPedido,
        estatus_anterior: estatusActual,
        estatus_nuevo:    'DELIVERED',
        descripcion:      'Entrega confirmada por repartidor',
      }),
    ]);
    setLoading(false);
    setEstado('ok');
    router.refresh();
  }

  return (
    <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px 22px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>
        Confirmar entrega
      </div>
      <p style={{ fontSize: '0.88rem', color: '#5C5B5B', marginBottom: '20px', lineHeight: 1.6 }}>
        Pide al cliente que te muestre su código de confirmación e ingrésalo aquí.
      </p>

      <form onSubmit={handleValidar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <input
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase().slice(0, 6)); setEstado('idle'); }}
            placeholder="XXXXXX"
            maxLength={6}
            autoComplete="off"
            style={{
              width: '100%', padding: '14px 18px', borderRadius: '14px', boxSizing: 'border-box',
              border: `2px solid ${estado === 'err' ? '#B5161E' : '#EAE7E7'}`,
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
              letterSpacing: '0.25em', textAlign: 'center', outline: 'none',
              color: '#2F2F2E', transition: 'border-color 0.2s',
              textTransform: 'uppercase',
            }}
            onFocus={e => { if (estado !== 'err') e.target.style.borderColor = '#B5161E'; }}
            onBlur={e => { if (estado !== 'err') e.target.style.borderColor = '#EAE7E7'; }}
          />
          {estado === 'err' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '10px 14px', background: 'rgba(181,22,30,0.06)', border: '1.5px solid rgba(181,22,30,0.2)', borderRadius: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#B5161E" strokeWidth="1.8"/>
                <path d="M12 8v5M12 16h.01" stroke="#B5161E" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '0.82rem', color: '#B5161E', fontWeight: 600 }}>
                Código incorrecto. {intento >= 3 ? 'Verifica con el cliente.' : 'Intenta de nuevo.'}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || codigo.length < 6}
          style={{
            padding: '14px', borderRadius: '50px', border: 'none',
            background: codigo.length === 6 ? 'linear-gradient(135deg,#B5161E,#FFB467)' : '#EAE7E7',
            color: codigo.length === 6 ? '#FFEFED' : '#AFADAC',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
            cursor: loading || codigo.length < 6 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {loading && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,239,237,0.4)', borderTopColor: '#FFEFED', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
          {loading ? 'Verificando...' : 'Confirmar entrega'}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
