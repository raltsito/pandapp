'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { createClient } from '@/lib/supabase/client';

type Screen = 'login' | 'forgot' | 'reset-sent';

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.97)',
  borderRadius: '28px',
  padding: '40px 36px 36px',
  boxShadow: '0 32px 80px rgba(90,0,5,0.35), 0 0 0 1px rgba(255,239,237,0.25)',
  position: 'relative',
  overflow: 'hidden',
};

function TopStripe() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
      background: 'linear-gradient(135deg, #B5161E 0%, #FFB467 100%)',
      borderRadius: '28px 28px 0 0',
    }} />
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
      <img
        src="/assets/logo.png"
        alt="PanDa"
        style={{
          width: '90px', height: '90px', objectFit: 'contain',
          filter: 'drop-shadow(0 4px 12px rgba(181,22,30,0.25))',
          animation: 'logo-bounce 3s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
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
      {msg}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="auth-back-link">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Volver al inicio de sesión
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function goTo(s: Screen) {
    setError('');
    setScreen(s);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Read from FormData so browser-autofilled values are captured even if
    // React state didn't update via onChange (common with saved passwords).
    const fd = new FormData(e.currentTarget);
    const emailVal  = (fd.get('email')    as string || email).toLowerCase().trim();
    const passVal   = (fd.get('password') as string || password);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password: passVal,
    });
    if (error) {
      setLoading(false);
      const msg = error.message;
      setError(
        msg.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : msg.includes('Email not confirmed')
          ? 'Email no confirmado. Confirma tu cuenta desde el dashboard de Supabase o desactiva "Confirm email" en Authentication → Providers → Email.'
          : msg,
      );
      return;
    }
    // Keep loading=true during redirect so the spinner stays visible.
    router.push('/');
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}/auth/callback` },
    );
    setLoading(false);
    if (error) {
      setError('No se pudo enviar el correo. Verifica el email ingresado.');
      return;
    }
    setScreen('reset-sent');
  }

  return (
    <AuthBackground>
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(249,246,245,0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '4px solid rgba(181,22,30,0.15)',
            borderTopColor: '#B5161E',
            animation: 'spin 0.75s linear infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontWeight: 600,
            fontSize: '0.95rem', color: '#B5161E',
          }}>Ingresando…</span>
        </div>
      )}
      <div className="auth-card-anim" style={CARD_STYLE}>
        <TopStripe />
        <Logo />

        {error && <ErrorBanner msg={error} />}

        {/* ── LOGIN ── */}
        {screen === 'login' && (
          <form onSubmit={handleLogin} className="auth-screen-anim">
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
              color: '#B5161E', textAlign: 'center', marginBottom: '28px', lineHeight: 1.1,
            }}>
              ¡Bienvenido!
            </h1>

            <div style={{ marginBottom: '14px' }}>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Ingresa tu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '4px' }}>
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="button"
              onClick={() => goTo('forgot')}
              style={{
                fontSize: '0.82rem', color: '#B5161E', fontStyle: 'italic', fontWeight: 600,
                cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0 6px',
                display: 'block', fontFamily: 'var(--font-body)',
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Link href="/register" style={{ flex: 1, textDecoration: 'none' }}>
                <button type="button" className="auth-btn-secondary">
                  Regístrate
                </button>
              </Link>
              <button type="submit" className="auth-btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" />Ingresando…</>
                  : 'Inicia sesión'}
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT ── */}
        {screen === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-screen-anim">
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800,
              color: '#B5161E', textAlign: 'center', marginBottom: '28px', lineHeight: 1.1,
            }}>
              Recupera tu<br />contraseña
            </h1>

            <div style={{ marginBottom: '14px' }}>
              <input
                className="auth-input"
                type="email"
                placeholder="Ingresa tu email registrado"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading
                ? <><span className="auth-spinner" />Enviando…</>
                : 'Enviar enlace'}
            </button>

            <BackButton onClick={() => goTo('login')} />
          </form>
        )}

        {/* ── RESET SENT ── */}
        {screen === 'reset-sent' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }} className="auth-screen-anim">
            <div style={{
              width: '80px', height: '80px',
              background: 'linear-gradient(135deg, #C94A1A, #FFB467)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'card-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
                <rect x="6" y="10" width="28" height="20" rx="3" stroke="white" strokeWidth="2.2" />
                <path d="M6 14l14 9 14-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem',
              color: '#B5161E', marginBottom: '8px',
            }}>
              ¡Correo enviado!
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#5C5B5B' }}>
              Revisa tu bandeja de entrada para restablecer tu contraseña.
            </p>
            <BackButton onClick={() => goTo('login')} />
          </div>
        )}
      </div>
    </AuthBackground>
  );
}
