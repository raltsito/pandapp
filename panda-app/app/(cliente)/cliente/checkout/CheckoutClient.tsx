'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import { createClient } from '@/lib/supabase/client';

type PaymentState  = 'idle' | 'pending' | 'paid' | 'failed';
type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

interface Props {
  idUser: number;
  nombre: string;
  direccion: { calle: string; colonia: string; num_casa: number };
}

/* ── Cronómetro ─────────────────────────────────────────────── */
function ReservaTimer() {
  const [segundos, setSegundos] = useState(900);
  useEffect(() => {
    const id = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const min = String(Math.floor(segundos / 60)).padStart(2, '0');
  const sec = String(segundos % 60).padStart(2, '0');
  const urgente = segundos < 120;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      padding: '8px 18px',
      background: urgente ? 'rgba(181,22,30,0.08)' : 'rgba(255,180,67,0.12)',
      border: `1.5px solid ${urgente ? '#B5161E' : '#FFB467'}`,
      borderRadius: '50px',
    }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: urgente ? '#B5161E' : '#FFB467',
        animation: 'pulse-dot 1s ease infinite',
      }} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: urgente ? '#B5161E' : '#874E00', letterSpacing: '0.05em' }}>
        {min}:{sec}
      </span>
      <span style={{ fontSize: '0.78rem', color: '#5C5B5B', fontWeight: 500 }}>Tiempo de reserva</span>
    </div>
  );
}

/* ── Estado de pago visual ──────────────────────────────────── */
function PaymentVisual({ estado }: { estado: PaymentState }) {
  const steps: { key: string; label: string }[] = [
    { key: 'idle',    label: 'Iniciar'   },
    { key: 'pending', label: 'Pendiente' },
    { key: estado === 'failed' ? 'failed' : 'paid', label: estado === 'failed' ? 'Fallido' : 'Pagado' },
  ];

  const activeIdx = estado === 'idle' ? 0 : estado === 'pending' ? 1 : 2;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
      {steps.map((step, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        const color  = step.key === 'paid' ? '#15803D' : step.key === 'failed' ? '#B5161E' : '#B5161E';

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: '36px', height: '2px', background: done || active ? '#B5161E' : '#EAE7E7', transition: 'background 0.4s' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: `2.5px solid ${done || active ? color : '#EAE7E7'}`,
                background: done ? color : active ? (step.key === 'paid' ? '#15803D' : step.key === 'failed' ? '#B5161E' : 'rgba(181,22,30,0.06)') : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s',
              }}>
                {done && <span style={{ color: '#fff', fontSize: '1rem' }}>✓</span>}
                {active && step.key === 'pending' && (
                  <div style={{ width: '14px', height: '14px', border: '2px solid rgba(181,22,30,0.25)', borderTopColor: '#B5161E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
                {active && step.key === 'paid'   && <span style={{ color: '#fff', fontSize: '1rem' }}>✓</span>}
                {active && step.key === 'failed' && <span style={{ color: '#fff', fontSize: '1rem' }}>✕</span>}
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: active ? color : '#AFADAC' }}>{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Iconos SVG de métodos de pago ──────────────────────────── */
function IconCard() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="5" y="13" width="5" height="2" rx="1" fill="currentColor"/>
    </svg>
  );
}
function IconCash() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconTransfer() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

const METODOS: { key: PaymentMethod; label: string; Icon: () => React.ReactElement }[] = [
  { key: 'tarjeta',       label: 'Tarjeta',      Icon: IconCard     },
  { key: 'efectivo',      label: 'Efectivo',     Icon: IconCash     },
  { key: 'transferencia', label: 'Transferencia',Icon: IconTransfer },
];

/* ── Componente principal ───────────────────────────────────── */
export function CheckoutClient({ idUser, nombre, direccion }: Props) {
  const router   = useRouter();
  const supabase = createClient();
  const { items, total, clearCart } = useCart();

  const [metodo,   setMetodo]   = useState<PaymentMethod>('tarjeta');
  const [payState, setPayState] = useState<PaymentState>('idle');
  const [mensaje,  setMensaje]  = useState('');
  const processing = useRef(false);
  const pagado     = useRef(false);

  // Datos de tarjeta (solo UI simulada)
  const [cardNum,  setCardNum]  = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp,  setCardExp]  = useState('');
  const [cardCvv,  setCardCvv]  = useState('');

  function formatCardNum(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExp(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
  }

  useEffect(() => {
    if (items.length === 0 && !pagado.current) router.replace('/cliente/carrito');
  }, [items, router]);

  async function procesarPago(simularFallo: boolean) {
    if (processing.current) return;
    processing.current = true;
    setPayState('pending');
    setMensaje('Estamos procesando tu pago...');

    await new Promise(r => setTimeout(r, 3500));

    try {
      const totalRedondeado = Number(total.toFixed(2));

      const { data: pedido, error: errP } = await supabase
        .from('pedido')
        .insert({ id_user: idUser, total: totalRedondeado, estatus: 'CREATED' })
        .select('id_pedido')
        .single();

      if (errP || !pedido) {
        console.error('Error INSERT pedido:', errP);
        throw new Error(errP?.message ?? 'Error al crear pedido');
      }

      await supabase.from('detalle_pedido').insert(
        items.map(item => ({
          id_pedido:   pedido.id_pedido,
          id_producto: item.idProducto,
          cantidad:    item.cantidad,
          subtotal:    item.precioBase * item.cantidad,
        }))
      );

      await supabase.from('reserva_inventario').insert(
        items.map(item => ({
          id_producto: item.idProducto,
          cantidad:    item.cantidad,
          id_pedido:   pedido.id_pedido,
          expiracion:  new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          activa:      true,
        }))
      );

      if (simularFallo) {
        await supabase.from('pago').insert({
          id_pedido: pedido.id_pedido, idempotency_key: crypto.randomUUID(),
          estatus: 'FAILED', monto: total,
          error_code: 'CARD_DECLINED', error_mensaje: 'La tarjeta fue rechazada.',
        });
        setPayState('failed');
        setMensaje('Pago rechazado. Puedes reintentar o cancelar.');
        processing.current = false;
        return;
      }

      await supabase.from('pago').insert({
        id_pedido: pedido.id_pedido, idempotency_key: crypto.randomUUID(),
        estatus: 'PAID', monto: total,
      });

      await supabase.from('event_log').insert({
        id_pedido:        pedido.id_pedido,
        estatus_anterior: 'CREATED',
        estatus_nuevo:    'CREATED',
        descripcion:      `Pago confirmado — ${metodo}`,
      });

      pagado.current = true;
      setPayState('paid');
      setMensaje('¡Pago confirmado! Redirigiendo...');
      clearCart();
      setTimeout(() => router.push('/cliente/pedidos'), 2000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      console.error('Error en checkout:', err);
      setPayState('failed');
      setMensaje(`Error: ${msg}`);
      processing.current = false;
    }
  }

  function reintentar() {
    processing.current = false;
    setPayState('idle');
    setMensaje('');
  }

  if (items.length === 0) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px 0' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2.2rem', color: '#B5161E', textAlign: 'center', marginBottom: '8px' }}>
          Checkout
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <ReservaTimer />
        </div>

        {/* Resumen */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#2F2F2E' }}>Resumen del Pedido</h2>
            <a href="/cliente/carrito" style={{ fontSize: '0.8rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none' }}>Editar carrito</a>
          </div>
          {items.map(item => (
            <div key={item.idProducto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F0EF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {item.fotoUrl
                    ? <img src={item.fotoUrl} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'rgba(255,239,237,0.9)' }}>{item.nombre.charAt(0)}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2F2F2E' }}>{item.nombre} ×{item.cantidad}</div>
                  <div style={{ fontSize: '0.78rem', color: '#AFADAC' }}>${item.precioBase.toFixed(2)} c/u</div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '0.95rem', color: '#FFB467' }}>
                ${(item.precioBase * item.cantidad).toFixed(2)}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
            <span style={{ color: '#2F2F2E' }}>Total</span>
            <span style={{ color: '#B5161E' }}>${total.toFixed(2)}</span>
          </div>
        </section>

        {/* Dirección */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#2F2F2E', marginBottom: '12px' }}>Dirección de Entrega</h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2F2F2E' }}>{nombre}</div>
              <div style={{ fontSize: '0.85rem', color: '#5C5B5B', marginTop: '2px' }}>
                {direccion.calle} #{direccion.num_casa}, {direccion.colonia}
              </div>
              <a href="/cliente/perfil" style={{ fontSize: '0.78rem', color: '#B5161E', fontWeight: 600, textDecoration: 'none', marginTop: '6px', display: 'inline-block' }}>
                Editar dirección
              </a>
            </div>
          </div>
        </section>

        {/* Método de pago */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#2F2F2E', marginBottom: '14px' }}>Método de Pago</h2>

          {/* Selector */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {METODOS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => payState === 'idle' && setMetodo(key)}
                style={{
                  flex: 1, minWidth: '90px', padding: '12px 10px',
                  border: `2px solid ${metodo === key ? '#B5161E' : '#EAE7E7'}`,
                  borderRadius: '14px',
                  background: metodo === key ? 'rgba(181,22,30,0.05)' : '#fff',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.82rem',
                  color: metodo === key ? '#B5161E' : '#5C5B5B',
                  cursor: payState === 'idle' ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          {/* Formulario tarjeta */}
          {metodo === 'tarjeta' && payState === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fade-in-up 0.25s ease both' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#AFADAC', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Número de tarjeta</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNum}
                  onChange={e => setCardNum(formatCardNum(e.target.value))}
                  maxLength={19}
                  style={{ padding: '11px 14px', border: '2px solid #EAE7E7', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', letterSpacing: '0.08em', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = '#B5161E')}
                  onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#AFADAC', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Nombre en la tarjeta</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={cardName}
                  onChange={e => setCardName(e.target.value.toUpperCase())}
                  style={{ padding: '11px 14px', border: '2px solid #EAE7E7', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = '#B5161E')}
                  onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#AFADAC', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Vencimiento</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={cardExp}
                    onChange={e => setCardExp(formatExp(e.target.value))}
                    maxLength={5}
                    style={{ padding: '11px 14px', border: '2px solid #EAE7E7', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#AFADAC', letterSpacing: '0.04em', textTransform: 'uppercase' }}>CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    style={{ padding: '11px 14px', border: '2px solid #EAE7E7', borderRadius: '12px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => (e.target.style.borderColor = '#B5161E')}
                    onBlur={e => (e.target.style.borderColor = '#EAE7E7')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Aviso efectivo */}
          {metodo === 'efectivo' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'rgba(255,180,67,0.10)', border: '1.5px solid #FFB467', borderRadius: '12px', animation: 'fade-in-up 0.25s ease both' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke="#874E00" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: '0.85rem', color: '#874E00', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                El pago se realizará en <strong>efectivo al repartidor</strong> al momento de la entrega. Asegúrate de tener el monto exacto.
              </p>
            </div>
          )}

          {/* Aviso transferencia */}
          {metodo === 'transferencia' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'rgba(30,64,175,0.06)', border: '1.5px solid rgba(30,64,175,0.25)', borderRadius: '12px', animation: 'fade-in-up 0.25s ease both' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" stroke="#1E40AF" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: '0.85rem', color: '#1E40AF', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                La transferencia bancaria debe realizarse <strong>al momento de recibir tu pedido</strong>. El repartidor te proporcionará los datos de cuenta.
              </p>
            </div>
          )}
        </section>

        {/* Estado de pago */}
        <section style={{ background: '#fff', border: '1.5px solid #EAE7E7', borderRadius: '20px', padding: '20px 22px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#2F2F2E', marginBottom: '4px' }}>Estado de Pago</h2>
          <PaymentVisual estado={payState} />
          {mensaje && (
            <p style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: 500, color: payState === 'failed' ? '#B5161E' : payState === 'paid' ? '#15803D' : '#5C5B5B' }}>
              {mensaje}
            </p>
          )}
        </section>

        {/* Botones principales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '10px' }}>
          <a href="/cliente/carrito" style={{ padding: '14px', textAlign: 'center', borderRadius: '50px', background: '#FFB467', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'block' }}>
            Volver
          </a>
          <button
            onClick={() => router.push('/cliente/catalogo')}
            disabled={payState === 'pending'}
            style={{ padding: '14px', borderRadius: '50px', border: 'none', background: '#B5161E', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', cursor: payState === 'pending' ? 'not-allowed' : 'pointer', opacity: payState === 'pending' ? 0.6 : 1 }}
          >
            Cancelar
          </button>
          <button
            onClick={() => procesarPago(false)}
            disabled={payState !== 'idle'}
            style={{
              padding: '14px', borderRadius: '50px', border: 'none',
              background: payState === 'paid' ? 'linear-gradient(135deg,#15803D,#16a34a)' : 'linear-gradient(135deg,#B5161E,#FFB467)',
              color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
              cursor: payState !== 'idle' ? 'not-allowed' : 'pointer',
              opacity: payState === 'pending' ? 0.7 : 1, transition: 'background 0.3s',
            }}
          >
            {payState === 'pending' ? 'Procesando...' : payState === 'paid' ? 'Pago confirmado' : 'Confirmar compra'}
          </button>
        </div>

        {/* Reintentar tras fallo */}
        {payState === 'failed' && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button onClick={reintentar} style={{ background: 'linear-gradient(135deg,#B5161E,#FFB467)', border: 'none', borderRadius: '50px', padding: '10px 24px', color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              Reintentar pago
            </button>
          </div>
        )}

        {/* Simular fallo — solo en idle, claramente marcado como demo */}
        {payState === 'idle' && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              onClick={() => procesarPago(true)}
              style={{ background: 'none', border: '1.5px dashed #AFADAC', borderRadius: '50px', padding: '7px 18px', color: '#AFADAC', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              [DEMO] Simular fallo de pago
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </main>
  );
}
