'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function CancelarButton({ idPedido, estatusActual }: { idPedido: number; estatusActual: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cancelar() {
    setLoading(true);
    const { error: errUpd } = await supabase
      .from('pedido')
      .update({ estatus: 'CANCELLED' })
      .eq('id_pedido', idPedido);

    if (errUpd) {
      setLoading(false);
      alert('No se pudo cancelar el pedido. Intenta de nuevo.');
      return;
    }

    await supabase.from('event_log').insert({
      id_pedido:        idPedido,
      estatus_anterior: estatusActual,
      estatus_nuevo:    'CANCELLED',
      descripcion:      'Cancelado por el cliente',
    });

    router.refresh();
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        className="pedido-action-btn pedido-action-danger"
        onClick={() => setConfirmando(true)}
      >
        Cancelar pedido
      </button>
    );
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) setConfirmando(false); }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(47,47,46,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div style={{ background: '#fff', border: '2.5px solid #B5161E', borderRadius: '20px', padding: '28px 26px', maxWidth: '380px', width: '100%' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(181,22,30,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="#B5161E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.3rem', color: '#B5161E', marginBottom: '6px' }}>
          ¿Cancelar pedido?
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#5C5B5B', lineHeight: 1.6, marginBottom: '20px' }}>
          Esta acción no se puede deshacer. El pedido quedará marcado como cancelado.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => setConfirmando(false)}
            className="pedido-action-btn pedido-action-ghost"
            style={{ flex: 1 }}
          >
            Mantener
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={cancelar}
            className="pedido-action-btn"
            style={{ flex: 1, background: '#B5161E', color: '#FFEFED' }}
          >
            {loading ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}
