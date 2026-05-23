'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { createClient } from '@/lib/supabase/client';

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '28px',
  padding: '36px 36px 32px',
  boxShadow: '0 32px 80px rgba(90,0,5,0.35), 0 0 0 1px rgba(255,239,237,0.25)',
  position: 'relative',
  overflow: 'hidden',
};

type FormState = {
  nombre: string;
  telefono: string;
  email: string;
  password: string;
  confirm: string;
  calle: string;
  colonia: string;
  num_casa: string;
};

const EMPTY: FormState = {
  nombre: '', telefono: '', email: '', password: '',
  confirm: '', calle: '', colonia: '', num_casa: '',
};

export default function RegisterPage() {
  const supabase = createClient();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const numCasa = parseInt(form.num_casa);
    if (isNaN(numCasa)) {
      setError('El número de casa debe ser un número válido.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.toLowerCase().trim(),
      password: form.password,
      options: {
        data: {
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
          calle: form.calle.trim(),
          colonia: form.colonia.trim(),
          num_casa: numCasa,
        },
      },
    });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Este email ya está registrado. ¿Olvidaste tu contraseña?'
          : 'Error al crear la cuenta. Intenta de nuevo.',
      );
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthBackground>
        <div className="auth-card-anim" style={CARD_STYLE}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(135deg, #B5161E 0%, #FFB467 100%)',
            borderRadius: '28px 28px 0 0',
          }} />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '80px', height: '80px',
              background: 'linear-gradient(135deg, #B5161E, #FFB467)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'card-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
                <path d="M8 20l8 8 16-16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
              color: '#B5161E', marginBottom: '8px',
            }}>
              ¡Cuenta creada!
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#5C5B5B', marginBottom: '28px' }}>
              Tu cuenta PanDa ha sido creada con éxito. Ya puedes iniciar sesión.
            </p>
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button className="auth-btn-primary">Iniciar sesión</button>
            </Link>
          </div>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div className="auth-card-anim" style={CARD_STYLE}>
        {/* Top stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(135deg, #B5161E 0%, #FFB467 100%)',
          borderRadius: '28px 28px 0 0',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <img
            src="/assets/logo.png"
            alt="PanDa"
            style={{
              width: '80px', height: '80px', objectFit: 'contain',
              filter: 'drop-shadow(0 4px 12px rgba(181,22,30,0.25))',
              animation: 'logo-bounce 3s ease-in-out infinite',
            }}
          />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
          color: '#B5161E', textAlign: 'center', marginBottom: '20px', lineHeight: 1.1,
        }}>
          ¡Regístrate!
        </h1>

        {error && (
          <div style={{
            background: 'rgba(181,22,30,0.06)',
            borderLeft: '3px solid #B5161E',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '0.82rem',
            color: '#2F2F2E',
            marginBottom: '16px',
            animation: 'fade-in-up 0.3s ease both',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Scrollable fields */}
          <div style={{
            maxHeight: '48vh',
            overflowY: 'auto',
            paddingRight: '4px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#B5161E transparent',
          }}>
            {[
              { key: 'nombre',   type: 'text',     placeholder: 'Nombre completo' },
              { key: 'telefono', type: 'tel',      placeholder: 'Teléfono' },
              { key: 'email',    type: 'email',    placeholder: 'Email' },
              { key: 'password', type: 'password', placeholder: 'Contraseña' },
              { key: 'confirm',  type: 'password', placeholder: 'Confirmar contraseña' },
              { key: 'calle',    type: 'text',     placeholder: 'Calle' },
              { key: 'colonia',  type: 'text',     placeholder: 'Colonia' },
              { key: 'num_casa', type: 'text',     placeholder: 'Número de casa' },
            ].map(({ key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <input
                  className="auth-input"
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof FormState]}
                  onChange={field(key as keyof FormState)}
                  required
                  autoComplete={key === 'email' ? 'email' : key === 'password' ? 'new-password' : 'off'}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              className="auth-btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setForm(EMPTY)}
            >
              Limpiar form.
            </button>
            <button
              type="submit"
              className="auth-btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading
                ? <><span className="auth-spinner" />Creando…</>
                : 'Crear cuenta'}
            </button>
          </div>
        </form>

        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button type="button" className="auth-back-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ya tengo cuenta
          </button>
        </Link>
      </div>
    </AuthBackground>
  );
}
