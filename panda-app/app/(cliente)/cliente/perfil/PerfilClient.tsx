'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Perfil {
  nombre: string;
  telefono: string | null;
  email: string;
  calle: string;
  colonia: string;
  num_casa: number;
}

interface Props {
  idUser: number;
  perfil: Perfil;
}

type Tab = 'datos' | 'contrasena';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: '12px', border: '2px solid #EAE7E7',
  fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: '#2F2F2E',
  outline: 'none', background: '#fff', transition: 'border-color 0.2s',
};

export function PerfilClient({ idUser, perfil }: Props) {
  const supabase = createClient();

  const [tab,    setTab]    = useState<Tab>('datos');
  const [form,   setForm]   = useState({ ...perfil, telefono: perfil.telefono ?? '' });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Contraseña
  const [pwActual,    setPwActual]    = useState('');
  const [pwNueva,     setPwNueva]     = useState('');
  const [pwConfirmar, setPwConfirmar] = useState('');
  const [savingPw,    setSavingPw]    = useState(false);
  const [msgPw,       setMsgPw]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function setField(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: key === 'num_casa' ? (parseInt(value) || 0) : value }));
    setMsg(null);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.calle.trim() || !form.colonia.trim()) {
      setMsg({ type: 'err', text: 'Nombre, calle y colonia son obligatorios.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        nombre:   form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        calle:    form.calle.trim(),
        colonia:  form.colonia.trim(),
        num_casa: Number(form.num_casa),
      })
      .eq('id_user', idUser);
    setSaving(false);
    setMsg(error
      ? { type: 'err', text: 'Error al guardar. Intenta de nuevo.' }
      : { type: 'ok',  text: 'Perfil actualizado correctamente.' }
    );
  }

  async function handleCambiarPw(e: React.FormEvent) {
    e.preventDefault();
    setMsgPw(null);
    if (pwNueva.length < 6) {
      setMsgPw({ type: 'err', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (pwNueva !== pwConfirmar) {
      setMsgPw({ type: 'err', text: 'Las contraseñas no coinciden.' });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwNueva });
    setSavingPw(false);
    if (error) {
      setMsgPw({ type: 'err', text: 'No se pudo cambiar la contraseña. Intenta de nuevo.' });
    } else {
      setMsgPw({ type: 'ok', text: 'Contraseña actualizada correctamente.' });
      setPwActual(''); setPwNueva(''); setPwConfirmar('');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: '#FFEFED' }}>
              {form.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.7rem', color: '#B5161E', marginBottom: '2px' }}>
              Mi Perfil
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#5C5B5B' }}>{perfil.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#EAE7E7', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
          {(['datos', 'contrasena'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(null); setMsgPw(null); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: tab === t ? '#fff' : 'transparent',
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem',
                color: tab === t ? '#2F2F2E' : '#5C5B5B', cursor: 'pointer',
                boxShadow: tab === t ? '0 2px 8px rgba(47,47,46,0.08)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t === 'datos' ? 'Mis datos' : 'Contraseña'}
            </button>
          ))}
        </div>

        {/* TAB: Datos */}
        {tab === 'datos' && (
          <form onSubmit={handleGuardar}>
            <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '18px' }}>
                Información personal
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label="Nombre completo">
                  <input
                    type="text" value={form.nombre}
                    onChange={e => setField('nombre', e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                    required
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    type="tel" value={form.telefono}
                    onChange={e => setField('telefono', e.target.value)}
                    placeholder="10 dígitos"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email" value={form.email}
                    disabled
                    style={{ ...inputStyle, background: '#F3F0EF', color: '#AFADAC', cursor: 'not-allowed' }}
                  />
                </Field>
              </div>
            </section>

            <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '18px' }}>
                Dirección de entrega
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label="Calle">
                  <input
                    type="text" value={form.calle}
                    onChange={e => setField('calle', e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                    required
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                  <Field label="Colonia">
                    <input
                      type="text" value={form.colonia}
                      onChange={e => setField('colonia', e.target.value)}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#B5161E')}
                      onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                      required
                    />
                  </Field>
                  <Field label="Núm.">
                    <input
                      type="text" inputMode="numeric" value={form.num_casa}
                      onChange={e => setField('num_casa', e.target.value.replace(/\D/g, ''))}
                      style={{ ...inputStyle, width: '80px' }}
                      onFocus={e => (e.target.style.borderColor = '#B5161E')}
                      onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                      required
                    />
                  </Field>
                </div>
              </div>
            </section>

            {msg && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '0.85rem', fontWeight: 500,
                background: msg.type === 'ok' ? 'rgba(21,128,61,0.07)' : 'rgba(181,22,30,0.06)',
                border: `1.5px solid ${msg.type === 'ok' ? 'rgba(21,128,61,0.25)' : 'rgba(181,22,30,0.2)'}`,
                color: msg.type === 'ok' ? '#15803D' : '#B5161E',
              }}>
                {msg.text}
              </div>
            )}

            <button
              type="submit" disabled={saving}
              style={{ width: '100%', padding: '14px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {saving && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,239,237,0.4)', borderTopColor: '#FFEFED', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        )}

        {/* TAB: Contraseña */}
        {tab === 'contrasena' && (
          <form onSubmit={handleCambiarPw}>
            <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '18px' }}>
                Cambiar contraseña
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label="Contraseña nueva">
                  <input
                    type="password" value={pwNueva}
                    onChange={e => setPwNueva(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                    required
                  />
                </Field>
                <Field label="Confirmar contraseña nueva">
                  <input
                    type="password" value={pwConfirmar}
                    onChange={e => setPwConfirmar(e.target.value)}
                    placeholder="Repite la contraseña"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                    required
                  />
                </Field>
                {pwNueva && pwConfirmar && pwNueva !== pwConfirmar && (
                  <p style={{ fontSize: '0.8rem', color: '#B5161E', margin: 0 }}>Las contraseñas no coinciden.</p>
                )}
              </div>
            </section>

            {msgPw && (
              <div style={{ padding: '12px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '0.85rem', fontWeight: 500,
                background: msgPw.type === 'ok' ? 'rgba(21,128,61,0.07)' : 'rgba(181,22,30,0.06)',
                border: `1.5px solid ${msgPw.type === 'ok' ? 'rgba(21,128,61,0.25)' : 'rgba(181,22,30,0.2)'}`,
                color: msgPw.type === 'ok' ? '#15803D' : '#B5161E',
              }}>
                {msgPw.text}
              </div>
            )}

            <button
              type="submit" disabled={savingPw}
              style={{ width: '100%', padding: '14px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#B5161E,#FFB467)', color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: savingPw ? 'not-allowed' : 'pointer', opacity: savingPw ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {savingPw && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,239,237,0.4)', borderTopColor: '#FFEFED', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
              {savingPw ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
