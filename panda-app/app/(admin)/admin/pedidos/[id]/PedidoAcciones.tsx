'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ESTATUS_SIGUIENTES: Record<string, string[]> = {
  CREATED:     ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DELIVERED',   'CANCELLED'],
  DELIVERED:   ['REFUNDED'],
  CANCELLED:   [],
  REFUNDED:    [],
};

const ESTATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'Empacado', DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface Props {
  idPedido: number;
  estatusActual: string;
  pagoEstatus: string | null;
  entrega: { id_entrega: number; id_repartidor: number | null; codigo_confirmacion: string | null; confirmado: boolean } | null;
  repartidores: { id_repartidor: number; nombre: string }[];
}

export function PedidoAcciones({ idPedido, estatusActual, pagoEstatus, entrega, repartidores }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const [loading,        setLoading]        = useState(false);
  const [msg,            setMsg]            = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [repartidorSel,  setRepartidorSel]  = useState<number | ''>(entrega?.id_repartidor ?? '');

  const siguientes = ESTATUS_SIGUIENTES[estatusActual] ?? [];

  async function cambiarEstatus(nuevoEstatus: string) {
    if (!confirm(`¿Cambiar estado a "${ESTATUS_LABEL[nuevoEstatus]}"?`)) return;
    setLoading(true); setMsg(null);
    const { error } = await supabase
      .from('pedido')
      .update({ estatus: nuevoEstatus })
      .eq('id_pedido', idPedido);
    if (!error) {
      await supabase.from('event_log').insert({
        id_pedido: idPedido,
        estatus_anterior: estatusActual,
        estatus_nuevo: nuevoEstatus,
        descripcion: `Estado cambiado por admin`,
      });
    }
    setLoading(false);
    if (error) { setMsg({ type: 'err', text: 'Error al cambiar estado.' }); return; }
    setMsg({ type: 'ok', text: `Estado actualizado a "${ESTATUS_LABEL[nuevoEstatus]}".` });
    router.refresh();
  }

  async function asignarRepartidor() {
    if (!repartidorSel) { setMsg({ type: 'err', text: 'Selecciona un repartidor.' }); return; }
    setLoading(true); setMsg(null);
    const codigo = randomCode();
    if (entrega) {
      await supabase.from('entrega').update({ id_repartidor: repartidorSel, codigo_confirmacion: codigo, confirmado: false }).eq('id_entrega', entrega.id_entrega);
    } else {
      await supabase.from('entrega').insert({ id_pedido: idPedido, id_repartidor: repartidorSel, codigo_confirmacion: codigo, confirmado: false });
    }
    await supabase.from('event_log').insert({
      id_pedido: idPedido,
      estatus_anterior: estatusActual,
      estatus_nuevo: estatusActual,
      descripcion: `Repartidor asignado — código ${codigo}`,
    });
    setLoading(false);
    setMsg({ type: 'ok', text: `Repartidor asignado. Código: ${codigo}` });
    router.refresh();
  }

  async function reembolsar() {
    if (!confirm('¿Confirmas el reembolso? Esto cambiará el estado del pedido a REFUNDED.')) return;
    setLoading(true); setMsg(null);
    await supabase.from('pedido').update({ estatus: 'REFUNDED' }).eq('id_pedido', idPedido);
    await supabase.from('pago').update({ estatus: 'REFUNDED' }).eq('id_pedido', idPedido);
    await supabase.from('event_log').insert({
      id_pedido: idPedido,
      estatus_anterior: estatusActual,
      estatus_nuevo: 'REFUNDED',
      descripcion: 'Reembolso procesado por admin',
    });
    setLoading(false);
    setMsg({ type: 'ok', text: 'Reembolso procesado.' });
    router.refresh();
  }

  const btnBase: React.CSSProperties = {
    width: '100%', padding: '11px 16px', borderRadius: '12px', border: 'none',
    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem',
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
    transition: 'opacity 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Cambiar estado */}
      {siguientes.length > 0 && (
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
            Cambiar estado
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {siguientes.map(s => (
              <button
                key={s}
                onClick={() => cambiarEstatus(s)}
                disabled={loading}
                style={{
                  ...btnBase,
                  background: s === 'CANCELLED' || s === 'REFUNDED' ? '#FEF2F2' : s === 'DELIVERED' ? 'rgba(21,128,61,0.08)' : 'rgba(30,64,175,0.08)',
                  color: s === 'CANCELLED' || s === 'REFUNDED' ? '#B5161E' : s === 'DELIVERED' ? '#15803D' : '#1E40AF',
                }}
              >
                → {ESTATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Asignar repartidor */}
      {(estatusActual === 'IN_PROGRESS' || estatusActual === 'CREATED') && (
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
            Repartidor
          </div>
          {entrega?.id_repartidor && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'rgba(21,128,61,0.06)', border: '1.5px solid rgba(21,128,61,0.2)', borderRadius: '10px', fontSize: '0.82rem' }}>
              <span style={{ color: '#AFADAC' }}>Asignado: </span>
              <strong style={{ color: '#15803D' }}>
                {repartidores.find(r => r.id_repartidor === entrega.id_repartidor)?.nombre ?? `Rep #${entrega.id_repartidor}`}
              </strong>
              {entrega.codigo_confirmacion && (
                <div style={{ marginTop: '4px', color: '#5C5B5B' }}>Código: <strong>{entrega.codigo_confirmacion}</strong></div>
              )}
            </div>
          )}
          <select
            value={repartidorSel}
            onChange={e => setRepartidorSel(e.target.value === '' ? '' : Number(e.target.value))}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid #EAE7E7', fontFamily: 'var(--font-body)', fontSize: '0.85rem', marginBottom: '10px', outline: 'none' }}
          >
            <option value="">— Seleccionar repartidor —</option>
            {repartidores.map(r => (
              <option key={r.id_repartidor} value={r.id_repartidor}>{r.nombre}</option>
            ))}
          </select>
          {repartidores.length === 0 && (
            <p style={{ fontSize: '0.78rem', color: '#AFADAC', marginBottom: '8px' }}>No hay repartidores activos registrados.</p>
          )}
          <button onClick={asignarRepartidor} disabled={loading || !repartidorSel} style={{ ...btnBase, background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED' }}>
            {entrega?.id_repartidor ? 'Reasignar repartidor' : 'Asignar repartidor'}
          </button>
        </section>
      )}

      {/* Reembolso */}
      {(pagoEstatus === 'PAID' && estatusActual !== 'REFUNDED') && (
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px' }}>
            Reembolso
          </div>
          <button onClick={reembolsar} disabled={loading} style={{ ...btnBase, background: '#FEF2F2', color: '#B5161E' }}>
            Procesar reembolso
          </button>
        </section>
      )}

      {/* Feedback */}
      {msg && (
        <div style={{
          padding: '12px 14px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 500,
          background: msg.type === 'ok' ? 'rgba(21,128,61,0.07)' : 'rgba(181,22,30,0.06)',
          border: `1.5px solid ${msg.type === 'ok' ? 'rgba(21,128,61,0.25)' : 'rgba(181,22,30,0.2)'}`,
          color: msg.type === 'ok' ? '#15803D' : '#B5161E',
        }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
