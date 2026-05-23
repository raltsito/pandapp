'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Item {
  id_inventario: number;
  id_producto: number;
  nombre: string;
  activo: boolean;
  stock_disponible: number;
  stock_reservado: number;
}

const UMBRAL = 5;

export function InventarioClient({ items }: { items: Item[] }) {
  const supabase = createClient();
  const router   = useRouter();

  const [editId,   setEditId]   = useState<number | null>(null);
  const [editVal,  setEditVal]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ id: number; type: 'ok' | 'err'; text: string } | null>(null);

  function startEdit(item: Item) {
    setEditId(item.id_inventario);
    setEditVal(String(item.stock_disponible));
    setMsg(null);
  }

  async function saveEdit(id: number) {
    const val = parseInt(editVal);
    if (isNaN(val) || val < 0) { setMsg({ id, type: 'err', text: 'Valor inválido.' }); return; }
    setSaving(true);
    const { error } = await supabase.from('inventario').update({ stock_disponible: val }).eq('id_inventario', id);
    setSaving(false);
    setEditId(null);
    setMsg({ id, type: error ? 'err' : 'ok', text: error ? 'Error al guardar.' : 'Stock actualizado.' });
    router.refresh();
  }

  const agotados = items.filter(i => i.stock_disponible === 0).length;
  const bajos    = items.filter(i => i.stock_disponible > 0 && i.stock_disponible <= UMBRAL).length;

  return (
    <main style={{ padding: '32px 28px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E' }}>
          Inventario
        </h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {agotados > 0 && (
            <div style={{ padding: '8px 14px', borderRadius: '12px', background: 'rgba(181,22,30,0.07)', border: '1.5px solid rgba(181,22,30,0.2)', fontSize: '0.82rem', fontWeight: 700, color: '#B5161E' }}>
              {agotados} agotado{agotados > 1 ? 's' : ''}
            </div>
          )}
          {bajos > 0 && (
            <div style={{ padding: '8px 14px', borderRadius: '12px', background: 'rgba(180,83,9,0.07)', border: '1.5px solid rgba(180,83,9,0.2)', fontSize: '0.82rem', fontWeight: 700, color: '#B45309' }}>
              {bajos} con stock bajo
            </div>
          )}
        </div>
      </div>

      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Producto', 'Disponible', 'Reservado', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const agotado = item.stock_disponible === 0;
                const bajo    = item.stock_disponible > 0 && item.stock_disponible <= UMBRAL;
                const editing = editId === item.id_inventario;

                return (
                  <tr key={item.id_inventario} style={{ borderTop: '1px solid #F3F0EF', background: agotado ? 'rgba(181,22,30,0.02)' : 'transparent' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2F2F2E' }}>{item.nombre}</div>
                      {!item.activo && <div style={{ fontSize: '0.72rem', color: '#AFADAC', marginTop: '2px' }}>Inactivo</div>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {editing ? (
                        <input
                          type="text" inputMode="numeric"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                          style={{ width: '70px', padding: '6px 10px', borderRadius: '8px', border: '2px solid #B5161E', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none' }}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id_inventario); if (e.key === 'Escape') setEditId(null); }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.1rem', color: agotado ? '#B5161E' : bajo ? '#B45309' : '#15803D' }}>
                          {item.stock_disponible}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#AFADAC', fontSize: '1rem' }}>
                      {item.stock_reservado}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {agotado ? (
                        <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: '#B5161E', background: 'rgba(181,22,30,0.08)' }}>Agotado</span>
                      ) : bajo ? (
                        <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: '#B45309', background: 'rgba(180,83,9,0.08)' }}>Stock bajo</span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: '#15803D', background: 'rgba(21,128,61,0.08)' }}>OK</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {editing ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => saveEdit(item.id_inventario)} disabled={saving}
                            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#B5161E', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                            Guardar
                          </button>
                          <button onClick={() => setEditId(null)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#EAE7E7', color: '#5C5B5B', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(item)}
                          style={{ padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #EAE7E7', background: '#fff', color: '#5C5B5B', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          Editar
                        </button>
                      )}
                      {msg?.id === item.id_inventario && (
                        <div style={{ fontSize: '0.72rem', marginTop: '4px', color: msg.type === 'ok' ? '#15803D' : '#B5161E', fontWeight: 600 }}>
                          {msg.text}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
