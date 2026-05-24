'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/CartContext';

export interface ProductoConStock {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  foto_url: string | null;
  stock_disponible: number;
}

export function CatalogoGrid({ productos }: { productos: ProductoConStock[] }) {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState<ProductoConStock | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [query, setQuery] = useState('');
  const [cat,   setCat]   = useState('Todos');

  const CATS = ['Todos', 'Pasteles', 'Al vapor', 'Hojaldrados', 'Panadería', 'Galletas'];

  function getCat(nombre: string) {
    const n = nombre.toLowerCase();
    if (n.includes('pastel'))  return 'Pasteles';
    if (n.includes('bao'))     return 'Al vapor';
    if (n.includes('tarta'))   return 'Hojaldrados';
    if (n.includes('galleta')) return 'Galletas';
    return 'Panadería';
  }

  const visible = productos.filter(p => {
    const matchQ = p.nombre.toLowerCase().includes(query.toLowerCase()) ||
                   (p.descripcion ?? '').toLowerCase().includes(query.toLowerCase());
    const matchC = cat === 'Todos' || getCat(p.nombre) === cat;
    return matchQ && matchC;
  });

  function open(p: ProductoConStock) {
    setSelected(p);
    setQty(1);
    setAdded(false);
  }

  function close() { setSelected(null); }

  function addCart() {
    if (!selected) return;
    addToCart({
      idProducto: selected.id_producto,
      nombre:     selected.nombre,
      precioBase: selected.precio_base,
      cantidad:   qty,
      fotoUrl:    selected.foto_url,
    });
    setAdded(true);
    setTimeout(close, 1100);
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>

      <div className="catalogo-header" style={{ padding: '40px 32px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: 'clamp(1.8rem,5vw,3rem)', color: '#B5161E', marginBottom: '8px' }}>
          Nuestros productos
        </h1>
        <p style={{ color: '#5C5B5B' }}>Panadería china artesanal · Elaborada con recetas de generaciones</p>
      </div>

      <div className="catalogo-filters" style={{ padding: '0 32px 28px', maxWidth: '1100px', margin: '0 auto' }}>
      <input
        type="text"
        placeholder="Buscar..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ padding: '10px 18px', border: '2px solid #EAE7E7', borderRadius: '50px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', marginBottom: '16px', width: '100%', maxWidth: '360px', display: 'block' }}
      />

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0' }}>
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              padding: '8px 20px', borderRadius: '50px',
              border: `2px solid ${cat === c ? '#B5161E' : '#AFADAC'}`,
              background: cat === c ? '#B5161E' : 'transparent',
              color: cat === c ? '#FFEFED' : '#5C5B5B',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      </div>

      <div className="catalogo-grid" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
        {visible.map(p => (
          <div
            key={p.id_producto}
            onClick={() => open(p)}
            style={{
              background: '#fff',
              border: '2.5px solid #B5161E',
              borderRadius: '20px',
              cursor: p.stock_disponible > 0 ? 'pointer' : 'default',
              overflow: 'hidden',
              transition: 'transform 0.25s, box-shadow 0.25s',
            }}
            onMouseEnter={e => { if (p.stock_disponible > 0) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(181,22,30,0.18)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
          >
            <div style={{ height: '180px', background: 'linear-gradient(160deg,#B5161E,#C94A1A 50%,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {p.foto_url
                ? <img src={p.foto_url} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '4rem', color: 'rgba(255,239,237,0.85)' }}>{p.nombre.charAt(0)}</span>
              }
              {p.stock_disponible === 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(47,47,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: '#2F2F2E', color: '#FFEFED', padding: '6px 18px', borderRadius: '50px', fontWeight: 700, fontSize: '0.82rem' }}>Agotado</span>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 18px 22px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.1rem', color: '#B5161E', marginBottom: '6px' }}>{p.nombre}</div>
              <div style={{ fontSize: '0.82rem', color: '#5C5B5B', lineHeight: 1.5, marginBottom: '12px', overflow: 'hidden', maxHeight: '3em' }}>{p.descripcion}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.2rem', color: '#FFB467' }}>${p.precio_base.toFixed(2)} MXN</div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          onClick={e => { if (e.target === e.currentTarget) close(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(47,47,46,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'overlay-in 0.3s ease both',
          }}
        >
          <div className="modal-card">
            <button className="modal-close" onClick={close}>✕</button>

            {/* Contenido principal */}
            <div className="modal-inner" style={{ display: 'flex', minHeight: '320px' }}>

              {/* Imagen */}
              <div style={{
                flex: '0 0 46%',
                background: 'linear-gradient(160deg,#B5161E 0%,#C94A1A 50%,#FFB467 100%)',
                borderRadius: '20px 0 0 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '30px', minHeight: '320px', overflow: 'hidden',
              }}>
                {selected.foto_url
                  ? <img src={selected.foto_url} alt={selected.nombre} style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.15))' }} />
                  : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '7rem', color: 'rgba(255,239,237,0.85)', lineHeight: 1, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))' }}>
                      {selected.nombre.charAt(0)}
                    </span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '32px 28px 28px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '1.7rem', color: '#B5161E', marginBottom: '8px' }}>
                  {selected.nombre}
                </div>
                <div style={{ width: '48px', height: '3px', background: 'linear-gradient(160deg,#B5161E,#C94A1A 50%,#FFB467)', borderRadius: '2px', marginBottom: '14px' }} />
                <p style={{ fontSize: '0.9rem', color: '#5C5B5B', lineHeight: 1.7, marginBottom: '18px', flex: 1 }}>
                  {selected.descripcion ?? 'Producto artesanal PanDa.'}
                </p>

                {/* Stock */}
                <div style={{ marginBottom: '14px' }}>
                  {selected.stock_disponible === 0
                    ? <span style={{ padding: '4px 14px', background: '#EAE7E7', color: '#5C5B5B', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600 }}>Sin stock</span>
                    : <span style={{ padding: '4px 14px', background: 'rgba(21,128,61,0.08)', color: '#15803D', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600 }}>{selected.stock_disponible} disponibles</span>
                  }
                </div>

                {/* Precio */}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontStyle: 'italic', fontSize: '2rem', color: '#F5A623', marginBottom: '20px' }}>
                  ${selected.precio_base.toFixed(2)}{' '}
                  <span style={{ fontSize: '0.9rem', color: '#AFADAC', fontStyle: 'normal', fontWeight: 500 }}>MXN</span>
                </div>

                {/* Cantidad + botón */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #EAE7E7', borderRadius: '12px', overflow: 'hidden' }}>
                    <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span style={{ width: '40px', textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', color: '#2F2F2E' }}>{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(q => Math.min(Math.max(selected.stock_disponible, 1), q + 1))}>+</button>
                  </div>
                  <button
                    onClick={addCart}
                    disabled={selected.stock_disponible === 0}
                    style={{
                      flex: 1, padding: '12px', border: 'none', borderRadius: '50px',
                      background: added
                        ? 'linear-gradient(135deg,#15803D,#16a34a)'
                        : 'linear-gradient(160deg,#B5161E 0%,#C94A1A 50%,#FFB467 100%)',
                      color: '#FFEFED',
                      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem',
                      cursor: selected.stock_disponible === 0 ? 'not-allowed' : 'pointer',
                      opacity: selected.stock_disponible === 0 ? 0.5 : 1,
                      transition: 'filter 0.2s, transform 0.2s, background 0.3s',
                    }}
                    onMouseEnter={e => { if (!added && selected.stock_disponible > 0) { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
                  >
                    {added ? 'Agregado al carrito' : selected.stock_disponible === 0 ? 'Sin stock' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
