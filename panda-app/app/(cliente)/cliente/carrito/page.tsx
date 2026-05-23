'use client';

import { useCart } from '@/components/cart/CartContext';
import Link from 'next/link';

const PIN: React.CSSProperties = {
  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
  width: '14px', height: '22px', background: '#FFB467', borderRadius: '4px', zIndex: 2,
};

export default function CarritoPage() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();

  const agotados = items.filter(i => i.precioBase === 0); // placeholder, stock viene del item
  const hayAgotados = false; // se validará en checkout contra DB

  if (items.length === 0) {
    return (
      <main style={{ minHeight: '100vh', background: '#F9F6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛒</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#B5161E', marginBottom: '8px' }}>Tu carrito está vacío</h2>
          <p style={{ color: '#5C5B5B', marginBottom: '28px' }}>Agrega productos desde el catálogo para comenzar.</p>
          <Link href="/cliente/catalogo" style={{
            display: 'inline-block', padding: '14px 32px',
            background: 'linear-gradient(135deg,#B5161E,#FFB467)',
            color: '#FFEFED', borderRadius: '50px', textDecoration: 'none',
            fontWeight: 700, fontSize: '0.95rem',
          }}>
            Ir al catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', fontFamily: 'var(--font-body)', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2.2rem', color: '#B5161E' }}>
            Mi Carrito
          </h1>
          <button
            onClick={clearCart}
            style={{ background: 'none', border: 'none', color: '#AFADAC', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}
          >
            Vaciar carrito
          </button>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '32px' }}>
          {items.map(item => (
            <div key={item.idProducto} style={{ position: 'relative' }}>
              <div style={{ ...PIN, top: '-11px' }} />
              <div style={{ ...PIN, bottom: '-11px' }} />
              <div
                className="carrito-item-grid"
                style={{
                  background: '#fff',
                  border: '2.5px solid #B5161E',
                  borderRadius: '20px',
                  padding: '18px 20px',
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                {/* Imagen */}
                <div style={{
                  width: '72px', height: '72px', borderRadius: '12px', overflow: 'hidden',
                  background: 'linear-gradient(135deg,#B5161E,#FFB467)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {item.fotoUrl
                    ? <img src={item.fotoUrl} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'rgba(255,239,237,0.9)' }}>{item.nombre.charAt(0)}</span>
                  }
                </div>

                {/* Info */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2F2F2E', marginBottom: '4px' }}>{item.nombre}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1rem', color: '#B5161E', marginBottom: '10px' }}>
                    ${item.precioBase.toFixed(2)}
                  </div>

                  {/* Cantidad */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#AFADAC', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cantidad</span>
                      <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #EAE7E7', borderRadius: '10px', overflow: 'hidden' }}>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.idProducto, item.cantidad - 1)}
                          style={{ width: '32px', height: '36px' }}
                        >−</button>
                        <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{item.cantidad}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.idProducto, item.cantidad + 1)}
                          style={{ width: '32px', height: '36px' }}
                        >+</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#AFADAC', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Subtotal</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1rem', color: '#FFB467' }}>
                        ${(item.precioBase * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="carrito-item-acciones" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <span style={{ padding: '3px 10px', background: 'rgba(21,128,61,0.08)', color: '#15803D', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    En Stock
                  </span>
                  <button
                    onClick={() => removeFromCart(item.idProducto)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 14px', border: 'none', borderRadius: '50px',
                      background: 'linear-gradient(135deg,#B5161E,#C94A1A)',
                      color: '#FFEFED', fontFamily: 'var(--font-body)', fontWeight: 700,
                      fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del pedido */}
        <div style={{
          background: '#fff', border: '1.5px solid #EAE7E7',
          borderRadius: '20px', padding: '24px 24px 20px',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#2F2F2E', marginBottom: '16px' }}>
            Resumen del Pedido
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#5C5B5B' }}>
            <span>Subtotal ({items.reduce((s, i) => s + i.cantidad, 0)} artículos)</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#5C5B5B' }}>
            <span>Reserva Temporal</span>
            <span>$0.00</span>
          </div>
          <div style={{ height: '1px', background: '#EAE7E7', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
            <span style={{ color: '#2F2F2E' }}>Total</span>
            <span style={{ color: '#B5161E' }}>${total.toFixed(2)}</span>
          </div>

          {/* Info reserva */}
          <div style={{
            marginTop: '14px', padding: '12px 14px',
            background: '#F3F0EF', borderRadius: '12px',
            fontSize: '0.8rem', color: '#5C5B5B', lineHeight: 1.6,
          }}>
            Al iniciar el checkout, tus artículos se reservarán temporalmente para ti.
            Un temporizador aparecerá para confirmar tu reserva.
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/cliente/checkout"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '16px 32px',
            background: 'linear-gradient(135deg,#B5161E 0%,#FFB467 100%)',
            color: '#FFEFED', borderRadius: '50px', textDecoration: 'none',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.05rem',
            boxShadow: '0 8px 24px rgba(181,22,30,0.3)',
            transition: 'filter 0.2s, transform 0.2s',
          }}
        >
          Continuar al Checkout
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

      </div>
    </main>
  );
}
