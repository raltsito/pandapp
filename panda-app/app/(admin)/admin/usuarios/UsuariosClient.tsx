'use client';

import { useState } from 'react';
import { crearUsuario, actualizarUsuario, cambiarRolUsuario } from './actions';

interface Usuario {
  id_user: number;
  nombre: string;
  email: string;
  telefono: string | null;
  calle: string;
  colonia: string;
  num_casa: number;
  fecha_registro: string;
  roles: string[];
  es_repartidor: boolean;
}

const ROL_COLOR: Record<string, { text: string; bg: string }> = {
  ADMIN:      { text: '#B5161E', bg: 'rgba(181,22,30,0.08)' },
  REPARTIDOR: { text: '#1E40AF', bg: 'rgba(30,64,175,0.08)' },
  CLIENTE:    { text: '#15803D', bg: 'rgba(21,128,61,0.08)' },
};

const ROLES = ['CLIENTE', 'REPARTIDOR', 'ADMIN'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '11px',
  border: '2px solid #EAE7E7', fontFamily: 'var(--font-body)',
  fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
};

const EMPTY_FORM = { nombre: '', email: '', password: '', telefono: '', calle: '', colonia: '', num_casa: '', rol: 'CLIENTE' };

type Modal = { type: 'crear' } | { type: 'editar'; usuario: Usuario } | { type: 'rol'; usuario: Usuario } | null;

export function UsuariosClient({ usuarios }: { usuarios: Usuario[] }) {
  const [q,       setQ]       = useState('');
  const [modal,   setModal]   = useState<Modal>(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const [rolSel,  setRolSel]  = useState('');

  const filtrados = usuarios.filter(u => {
    if (!q) return true;
    const t = q.toLowerCase();
    return u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
  });

  function openCrear() {
    setForm(EMPTY_FORM); setErr(''); setOk(''); setModal({ type: 'crear' });
  }
  function openEditar(u: Usuario) {
    setForm({ nombre: u.nombre, email: u.email, password: '', telefono: u.telefono ?? '', calle: u.calle, colonia: u.colonia, num_casa: String(u.num_casa), rol: u.roles[0] ?? 'CLIENTE' });
    setErr(''); setOk(''); setModal({ type: 'editar', usuario: u });
  }
  function openRol(u: Usuario) {
    const PRIORITY = ['ADMIN', 'REPARTIDOR', 'CLIENTE'];
    const current = PRIORITY.find(r => u.roles.includes(r)) ?? 'CLIENTE';
    setRolSel(current); setErr(''); setOk(''); setModal({ type: 'rol', usuario: u });
  }
  function close() { setModal(null); setErr(''); setOk(''); }
  function sf(k: keyof typeof EMPTY_FORM, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim() || !form.calle.trim() || !form.colonia.trim()) {
      setErr('Todos los campos obligatorios deben completarse.'); return;
    }
    if (form.password.length < 6) { setErr('La contraseña debe tener mínimo 6 caracteres.'); return; }
    setSaving(true); setErr('');
    const res = await crearUsuario({ ...form, num_casa: parseInt(form.num_casa) || 1 });
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    setOk('Usuario creado correctamente.'); setTimeout(close, 1500);
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (modal?.type !== 'editar') return;
    if (!form.nombre.trim() || !form.calle.trim() || !form.colonia.trim()) {
      setErr('Nombre, calle y colonia son obligatorios.'); return;
    }
    setSaving(true); setErr('');
    const res = await actualizarUsuario(modal.usuario.id_user, { nombre: form.nombre, telefono: form.telefono, calle: form.calle, colonia: form.colonia, num_casa: parseInt(form.num_casa) || 1 });
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    setOk('Usuario actualizado.'); setTimeout(close, 1200);
  }

  async function handleRol(e: React.FormEvent) {
    e.preventDefault();
    if (modal?.type !== 'rol') return;
    setSaving(true); setErr('');
    const res = await cambiarRolUsuario(modal.usuario.id_user, modal.usuario.roles, rolSel);
    setSaving(false);
    if (res.error) { setErr(res.error); return; }
    setOk('Rol actualizado.'); setTimeout(close, 1200);
  }

  const isOpen = modal !== null;

  return (
    <main style={{ padding: '32px 28px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.8rem', color: '#B5161E' }}>Usuarios</h1>
        <button onClick={openCrear}
          style={{ padding: '10px 22px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          + Nuevo usuario
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre o email..."
          style={{ ...inputStyle, maxWidth: '380px' }}
          onFocus={e => (e.target.style.borderColor = '#B5161E')}
          onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
        />
      </div>

      <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Usuario', 'Roles', 'Teléfono', 'Registro', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id_user} style={{ borderTop: '1px solid #F3F0EF' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: '#FFEFED' }}>{u.nombre.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2F2F2E' }}>{u.nombre}</div>
                        <div style={{ fontSize: '0.76rem', color: '#AFADAC' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {u.roles.map(r => {
                        const c = ROL_COLOR[r] ?? { text: '#5C5B5B', bg: '#F3F0EF' };
                        return <span key={r} style={{ padding: '3px 9px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, color: c.text, background: c.bg }}>{r}</span>;
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#5C5B5B' }}>{u.telefono ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: '#AFADAC', whiteSpace: 'nowrap' }}>
                    {new Date(u.fecha_registro).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => openEditar(u)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #EAE7E7', background: '#fff', color: '#2F2F2E', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        Editar
                      </button>
                      <button onClick={() => openRol(u)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'rgba(181,22,30,0.07)', color: '#B5161E', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        Rol
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#AFADAC', fontSize: '0.9rem' }}>No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Modal ── */}
      {isOpen && (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(47,47,46,0.45)', zIndex: 60 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '460px',
            zIndex: 61, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 32px 80px rgba(47,47,46,0.2)',
          }}>

            {/* ── CREAR ── */}
            {modal?.type === 'crear' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.4rem', color: '#B5161E', marginBottom: '24px' }}>Nuevo usuario</h2>
                <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  {[
                    { label: 'Nombre completo *', key: 'nombre', type: 'text' },
                    { label: 'Email *',           key: 'email', type: 'email' },
                    { label: 'Contraseña *',      key: 'password', type: 'password' },
                    { label: 'Teléfono',          key: 'telefono', type: 'tel' },
                    { label: 'Calle *',           key: 'calle', type: 'text' },
                    { label: 'Colonia *',         key: 'colonia', type: 'text' },
                    { label: 'Número *',          key: 'num_casa', type: 'text' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>{label}</label>
                      <input type={type} value={form[key as keyof typeof form]}
                        onChange={e => sf(key as keyof typeof EMPTY_FORM, key === 'num_casa' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        style={inputStyle} required={label.includes('*')}
                        onFocus={e => (e.target.style.borderColor = '#B5161E')}
                        onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>Rol inicial</label>
                    <select value={form.rol} onChange={e => sf('rol', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <Feedback err={err} ok={ok} />
                  <ModalBtns onClose={close} saving={saving} label="Crear usuario" />
                </form>
              </>
            )}

            {/* ── EDITAR ── */}
            {modal?.type === 'editar' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.4rem', color: '#B5161E', marginBottom: '6px' }}>Editar usuario</h2>
                <p style={{ fontSize: '0.82rem', color: '#AFADAC', marginBottom: '20px' }}>{modal.usuario.email}</p>
                <form onSubmit={handleEditar} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  {[
                    { label: 'Nombre completo *', key: 'nombre', type: 'text' },
                    { label: 'Teléfono',          key: 'telefono', type: 'tel' },
                    { label: 'Calle *',           key: 'calle', type: 'text' },
                    { label: 'Colonia *',         key: 'colonia', type: 'text' },
                    { label: 'Número *',          key: 'num_casa', type: 'text' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>{label}</label>
                      <input type={type} value={form[key as keyof typeof form]}
                        onChange={e => sf(key as keyof typeof EMPTY_FORM, key === 'num_casa' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        style={inputStyle} required={label.includes('*')}
                        onFocus={e => (e.target.style.borderColor = '#B5161E')}
                        onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                      />
                    </div>
                  ))}
                  <Feedback err={err} ok={ok} />
                  <ModalBtns onClose={close} saving={saving} label="Guardar cambios" />
                </form>
              </>
            )}

            {/* ── ROL ── */}
            {modal?.type === 'rol' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.4rem', color: '#B5161E', marginBottom: '6px' }}>Cambiar rol</h2>
                <p style={{ fontSize: '0.82rem', color: '#AFADAC', marginBottom: '20px' }}>{modal.usuario.nombre}</p>
                <form onSubmit={handleRol} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ROLES.map(r => {
                      const c = ROL_COLOR[r] ?? { text: '#5C5B5B', bg: '#F3F0EF' };
                      const selected = rolSel === r;
                      return (
                        <button key={r} type="button" onClick={() => setRolSel(r)}
                          style={{
                            padding: '13px 16px', borderRadius: '14px', border: `2px solid ${selected ? c.text : '#EAE7E7'}`,
                            background: selected ? c.bg : '#fff', cursor: 'pointer', textAlign: 'left',
                            fontFamily: 'var(--font-body)', fontWeight: selected ? 700 : 500,
                            fontSize: '0.9rem', color: selected ? c.text : '#5C5B5B', transition: 'all 0.15s',
                          }}>
                          {r}
                          {r === 'REPARTIDOR' && <span style={{ fontSize: '0.75rem', color: '#AFADAC', marginLeft: '8px' }}>— se crea entrada en repartidores</span>}
                        </button>
                      );
                    })}
                  </div>
                  <Feedback err={err} ok={ok} />
                  <ModalBtns onClose={close} saving={saving} label="Aplicar rol" />
                </form>
              </>
            )}

          </div>
        </>
      )}
    </main>
  );
}

function Feedback({ err, ok }: { err: string; ok: string }) {
  if (!err && !ok) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 500,
      background: ok ? 'rgba(21,128,61,0.07)' : 'rgba(181,22,30,0.06)',
      border: `1.5px solid ${ok ? 'rgba(21,128,61,0.25)' : 'rgba(181,22,30,0.2)'}`,
      color: ok ? '#15803D' : '#B5161E',
    }}>
      {ok || err}
    </div>
  );
}

function ModalBtns({ onClose, saving, label }: { onClose: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
      <button type="button" onClick={onClose}
        style={{ flex: 1, padding: '12px', borderRadius: '50px', border: '1.5px solid #EAE7E7', background: '#fff', color: '#5C5B5B', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        Cancelar
      </button>
      <button type="submit" disabled={saving}
        style={{ flex: 2, padding: '12px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', fontWeight: 700, fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {saving && <span style={{ width: '13px', height: '13px', border: '2px solid rgba(255,239,237,0.4)', borderTopColor: '#FFEFED', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
        {saving ? 'Guardando...' : label}
      </button>
    </div>
  );
}
