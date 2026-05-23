'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  activo: boolean;
  foto_url: string | null;
}

const EMPTY: Omit<Producto, 'id_producto'> = { nombre: '', descripcion: '', precio_base: 0, activo: true, foto_url: '' };

export function ProductosClient({ productos: init }: { productos: Producto[] }) {
  const supabase = createClient();
  const router   = useRouter();

  const [modal,   setModal]   = useState<'crear' | 'editar' | null>(null);
  const [form,    setForm]    = useState<Omit<Producto, 'id_producto'>>(EMPTY);
  const [editId,  setEditId]  = useState<number | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [filter,  setFilter]  = useState<'todos' | 'activo' | 'inactivo'>('todos');

  const visibles = init.filter(p =>
    filter === 'todos' ? true : filter === 'activo' ? p.activo : !p.activo
  );

  function openCrear() { setForm(EMPTY); setEditId(null); setModal('crear'); setMsg(''); }
  function openEditar(p: Producto) {
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', precio_base: p.precio_base, activo: p.activo, foto_url: p.foto_url ?? '' });
    setEditId(p.id_producto); setModal('editar'); setMsg('');
  }
  function closeModal() { setModal(null); setMsg(''); }

  function setField(k: keyof typeof form, v: string | boolean | number) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setMsg('El nombre es obligatorio.'); return; }
    if (form.precio_base <= 0) { setMsg('El precio debe ser mayor a 0.'); return; }
    setSaving(true);
    const payload = {
      nombre:      form.nombre.trim(),
      descripcion: form.descripcion?.trim() || null,
      precio_base: Number(form.precio_base),
      activo:      form.activo,
      foto_url:    form.foto_url?.trim() || null,
    };
    let error;
    if (modal === 'crear') {
      const res = await supabase.from('producto').insert(payload).select('id_producto').single();
      error = res.error;
      // Crear entrada de inventario
      if (!error && res.data) {
        await supabase.from('inventario').insert({ id_producto: res.data.id_producto, stock_disponible: 0, stock_reservado: 0 });
      }
    } else {
      ({ error } = await supabase.from('producto').update(payload).eq('id_producto', editId!));
    }
    setSaving(false);
    if (error) { setMsg('Error al guardar. Intenta de nuevo.'); return; }
    closeModal();
    router.refresh();
  }

  async function toggleActivo(p: Producto) {
    await supabase.from('producto').update({ activo: !p.activo }).eq('id_producto', p.id_producto);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '12px', border: '2px solid #EAE7E7',
    fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <main style={{ padding: '32px 28px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E' }}>Productos</h1>
        <button onClick={openCrear}
          style={{ padding: '10px 22px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          + Nuevo producto
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['todos', 'activo', 'inactivo'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: '50px', border: 'none', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: filter === f ? '#B5161E' : '#EAE7E7', color: filter === f ? '#FFEFED' : '#5C5B5B', fontFamily: 'var(--font-body)' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'todos' ? init.length : f === 'activo' ? init.filter(p => p.activo).length : init.filter(p => !p.activo).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {visibles.map(p => (
          <div key={p.id_producto} style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', overflow: 'hidden', opacity: p.activo ? 1 : 0.6 }}>
            <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {p.foto_url
                ? <img src={p.foto_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.5rem', color: 'rgba(255,239,237,0.7)' }}>{p.nombre.charAt(0)}</span>
              }
              {!p.activo && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(47,47,46,0.7)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: '50px' }}>
                  Inactivo
                </div>
              )}
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1rem', color: '#2F2F2E', marginBottom: '4px' }}>{p.nombre}</div>
              {p.descripcion && <div style={{ fontSize: '0.78rem', color: '#5C5B5B', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.descripcion}</div>}
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#FFB467', fontSize: '1.1rem', marginBottom: '14px' }}>${Number(p.precio_base).toFixed(2)}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => openEditar(p)}
                  style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1.5px solid #EAE7E7', background: '#fff', color: '#2F2F2E', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Editar
                </button>
                <button onClick={() => toggleActivo(p)}
                  style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: p.activo ? 'rgba(181,22,30,0.08)' : 'rgba(21,128,61,0.08)', color: p.activo ? '#B5161E' : '#15803D', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {p.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {visibles.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#AFADAC', fontSize: '0.9rem' }}>No hay productos en esta categoría.</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <>
          <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(47,47,46,0.4)', zIndex: 60 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '480px',
            zIndex: 61, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(47,47,46,0.2)',
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.4rem', color: '#B5161E', marginBottom: '24px' }}>
              {modal === 'crear' ? 'Nuevo producto' : 'Editar producto'}
            </h2>
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>Nombre *</label>
                <input value={form.nombre} onChange={e => setField('nombre', e.target.value)} style={inputStyle} required
                  onFocus={e => (e.target.style.borderColor = '#B5161E')} onBlur={e => (e.target.style.borderColor = '#EAE7E7')} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>Descripción</label>
                <textarea value={form.descripcion ?? ''} onChange={e => setField('descripcion', e.target.value)} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#B5161E')} onBlur={e => (e.target.style.borderColor = '#EAE7E7')} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>Precio base *</label>
                <input type="text" inputMode="decimal" value={form.precio_base}
                  onChange={e => setField('precio_base', parseFloat(e.target.value) || 0)}
                  style={inputStyle} required
                  onFocus={e => (e.target.style.borderColor = '#B5161E')} onBlur={e => (e.target.style.borderColor = '#EAE7E7')} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>URL de foto</label>
                <input value={form.foto_url ?? ''} onChange={e => setField('foto_url', e.target.value)}
                  placeholder="https://..." style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#B5161E')} onBlur={e => (e.target.style.borderColor = '#EAE7E7')} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#2F2F2E' }}>
                <input type="checkbox" checked={form.activo} onChange={e => setField('activo', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#B5161E' }} />
                Producto activo (visible en catálogo)
              </label>

              {msg && <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(181,22,30,0.06)', color: '#B5161E', fontSize: '0.82rem', fontWeight: 500 }}>{msg}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={closeModal}
                  style={{ flex: 1, padding: '12px', borderRadius: '50px', border: '1.5px solid #EAE7E7', background: '#fff', color: '#5C5B5B', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)' }}>
                  {saving ? 'Guardando...' : modal === 'crear' ? 'Crear producto' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </main>
  );
}
