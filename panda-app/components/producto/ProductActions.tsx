'use client';

import { useState } from 'react';

interface Props {
  producto: {
    id_producto: number;
    nombre: string;
    precio_base: number;
    foto_url: string | null;
    stock_disponible: number;
  };
  personalizable: boolean;
}

export function ProductActions({ producto, personalizable }: Props) {
  const [cantidad, setCantidad] = useState(1);

  return (
    <div style={{ border: '3px solid blue', padding: '20px', borderRadius: '12px' }}>
      <p style={{ color: 'blue', fontWeight: 700 }}>
        DEBUG: stock={producto.stock_disponible} | personalizable={String(personalizable)}
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button onClick={() => setCantidad(c => Math.max(1, c - 1))}
          style={{ padding: '8px 16px', background: '#EAE7E7', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          −
        </button>
        <span style={{ padding: '8px 16px', fontWeight: 700 }}>{cantidad}</span>
        <button onClick={() => setCantidad(c => c + 1)}
          style={{ padding: '8px 16px', background: '#EAE7E7', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          +
        </button>
      </div>
      <button
        style={{ marginTop: '16px', padding: '12px 24px', background: '#B5161E', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 700 }}
        onClick={() => alert(`Agregando ${cantidad} x ${producto.nombre}`)}
      >
        Agregar al carrito (test)
      </button>
    </div>
  );
}
