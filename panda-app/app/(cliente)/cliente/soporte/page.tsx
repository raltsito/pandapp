'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Pedido {
  id_pedido: number;
  estatus: string;
  fecha_registro: string;
  total: number;
}

interface Evento {
  estatus_nuevo: string;
  descripcion: string | null;
  fecha: string;
}

const ESTATUS_LABEL: Record<string, string> = {
  CREATED: 'Creado', IN_PROGRESS: 'En preparación',
  DELIVERED: 'Entregado', CANCELLED: 'Cancelado', REFUNDED: 'Reembolsado',
};

const ESTATUS_COLOR: Record<string, string> = {
  CREATED: '#5C5B5B', IN_PROGRESS: '#1E40AF',
  DELIVERED: '#15803D', CANCELLED: '#B5161E', REFUNDED: '#B45309',
};

export default function SoportePage() {
  const supabase = createClient();

  const [pedidos,      setPedidos]      = useState<Pedido[]>([]);
  const [selectedId,   setSelectedId]   = useState<number | ''>('');
  const [eventos,      setEventos]      = useState<Evento[]>([]);
  const [mensaje,      setMensaje]      = useState('');
  const [enviado,      setEnviado]      = useState(false);
  const [enviando,     setEnviando]     = useState(false);
  const [loadingEvts,  setLoadingEvts]  = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: userData } = await supabase.from('users').select('id_user').eq('auth_id', user.id).single();
      if (!userData) return;
      const { data } = await supabase
        .from('pedido')
        .select('id_pedido, estatus, fecha_registro, total')
        .eq('id_user', userData.id_user)
        .order('fecha_registro', { ascending: false });
      setPedidos(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (selectedId === '') { setEventos([]); return; }
    setLoadingEvts(true);
    supabase
      .from('event_log')
      .select('estatus_nuevo, descripcion, fecha')
      .eq('id_pedido', selectedId)
      .order('fecha', { ascending: false })
      .then(({ data }) => {
        setEventos(data ?? []);
        setLoadingEvts(false);
      });
  }, [selectedId]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setEnviando(true);
    // Simula el envío (no hay tabla de tickets en el schema)
    await new Promise(r => setTimeout(r, 1200));
    setEnviando(false);
    setEnviado(true);
    setMensaje('');
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 20px 0' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2rem', color: '#B5161E', marginBottom: '6px' }}>
          Soporte
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#5C5B5B', marginBottom: '28px' }}>
          ¿Tienes un problema con tu pedido? Selecciónalo y cuéntanos.
        </p>

        {/* Selector de pedido */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
            Pedido relacionado
          </div>
          <select
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value === '' ? '' : Number(e.target.value)); setEnviado(false); }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: '2px solid #EAE7E7', fontFamily: 'var(--font-body)',
              fontSize: '0.9rem', color: selectedId === '' ? '#AFADAC' : '#2F2F2E',
              background: '#fff', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">— Selecciona un pedido —</option>
            {pedidos.map(p => (
              <option key={p.id_pedido} value={p.id_pedido}>
                Pedido #{p.id_pedido} · {ESTATUS_LABEL[p.estatus] ?? p.estatus} · ${Number(p.total).toFixed(2)}
              </option>
            ))}
          </select>

          {selectedId !== '' && (
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <Link href={`/cliente/pedidos/${selectedId}`}
                style={{ fontSize: '0.8rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none' }}>
                Ver detalle →
              </Link>
            </div>
          )}
        </section>

        {/* Historial de eventos del pedido */}
        {selectedId !== '' && (
          <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '14px' }}>
              Historial del pedido
            </div>
            {loadingEvts ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#AFADAC', fontSize: '0.85rem' }}>Cargando...</div>
            ) : eventos.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#AFADAC', textAlign: 'center', padding: '16px 0' }}>Sin eventos registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {eventos.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', paddingBottom: i < eventos.length - 1 ? '16px' : '0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === 0 ? '#B5161E' : '#EAE7E7', border: i === 0 ? 'none' : '2px solid #AFADAC', flexShrink: 0 }} />
                      {i < eventos.length - 1 && <div style={{ width: '2px', flex: 1, background: '#EAE7E7', marginTop: '4px' }} />}
                    </div>
                    <div style={{ paddingBottom: i < eventos.length - 1 ? '0' : '0' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: i === 0 ? '#2F2F2E' : '#5C5B5B', marginBottom: '2px' }}>
                        {ev.descripcion ?? `Pedido ${ESTATUS_LABEL[ev.estatus_nuevo]?.toLowerCase() ?? ev.estatus_nuevo}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#AFADAC' }}>
                        {formatFecha(ev.fecha)} · {formatHora(ev.fecha)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Formulario */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#AFADAC', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '14px' }}>
            Mensaje de soporte
          </div>

          {enviado ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#2F2F2E', marginBottom: '6px' }}>¡Ticket enviado!</p>
              <p style={{ fontSize: '0.85rem', color: '#5C5B5B', marginBottom: '20px' }}>
                Nos pondremos en contacto contigo a la brevedad.
              </p>
              <button
                onClick={() => setEnviado(false)}
                style={{ background: 'none', border: '1.5px solid #EAE7E7', borderRadius: '50px', padding: '8px 20px', fontSize: '0.82rem', fontWeight: 600, color: '#5C5B5B', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviar}>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Describe tu problema con detalle (ej: mi pedido llegó incompleto, el producto estaba dañado...)"
                rows={5}
                required
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '14px',
                  border: '2px solid #EAE7E7', fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem', color: '#2F2F2E', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#B5161E')}
                onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: '#AFADAC' }}>
                  {mensaje.length}/500 caracteres
                </span>
                <button
                  type="submit"
                  disabled={enviando || !mensaje.trim()}
                  style={{
                    padding: '12px 28px', borderRadius: '50px', border: 'none',
                    background: 'linear-gradient(135deg,#B5161E,#FFB467)',
                    color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700,
                    fontSize: '0.9rem', cursor: enviando || !mensaje.trim() ? 'not-allowed' : 'pointer',
                    opacity: enviando || !mensaje.trim() ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {enviando && <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,239,237,0.4)', borderTopColor: '#FFEFED', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                  {enviando ? 'Enviando...' : 'Enviar ticket'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Info de contacto */}
        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,180,67,0.08)', border: '1.5px solid rgba(255,180,67,0.3)', borderRadius: '16px' }}>
          <p style={{ fontSize: '0.82rem', color: '#874E00', lineHeight: 1.6 }}>
            También puedes contactarnos directamente en{' '}
            <strong>soporte@panda-pasteleria.mx</strong>
          </p>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
