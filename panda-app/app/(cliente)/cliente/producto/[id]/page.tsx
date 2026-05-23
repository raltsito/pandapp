import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProductActions } from '@/components/producto/ProductActions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: p } = await supabase
    .from('producto')
    .select(`
      id_producto,
      nombre,
      descripcion,
      precio_base,
      foto_url,
      activo,
      inventario ( stock_disponible )
    `)
    .eq('id_producto', id)
    .eq('activo', true)
    .single();

  if (!p) notFound();

  const stock = (p.inventario as { stock_disponible: number }[] | null)?.[0]?.stock_disponible ?? 0;
  const personalizable = p.nombre.toLowerCase().includes('pastel');

  return (
    <main style={{ minHeight: '100vh', background: '#F9F6F5', paddingBottom: '80px' }}>

      {/* Back link */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 32px 0' }}>
        <Link
          href="/cliente/catalogo"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.875rem', fontWeight: 600, color: '#5C5B5B',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={16} />
          Volver al catálogo
        </Link>
      </div>

      {/* Product card — pins fuera, sin overflow hidden */}
      <div style={{ maxWidth: '1000px', margin: '40px auto 0', padding: '0 32px' }}>
        <div style={{ position: 'relative' }}>

          {/* Pin top */}
          <div style={{
            position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
            width: '18px', height: '26px', background: '#FFB467',
            borderRadius: '5px', zIndex: 5,
          }} />
          {/* Pin bottom */}
          <div style={{
            position: 'absolute', bottom: '-13px', left: '50%', transform: 'translateX(-50%)',
            width: '18px', height: '26px', background: '#FFB467',
            borderRadius: '5px', zIndex: 5,
          }} />

          <div style={{
            border: '2.5px solid #B5161E',
            borderRadius: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#fff',
          }}
            className="producto-layout"
          >
            {/* Left: Image — overflow hidden solo aquí para respetar border-radius */}
            <div style={{
              background: 'linear-gradient(160deg, #B5161E 0%, #C94A1A 50%, #FFB467 100%)',
              borderRadius: '21px 0 0 21px',
              minHeight: '460px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '40px',
              overflow: 'hidden',
            }}>
              {p.foto_url ? (
                <img
                  src={p.foto_url}
                  alt={p.nombre}
                  style={{
                    width: '100%', maxWidth: '300px',
                    height: '300px', objectFit: 'cover',
                    borderRadius: '16px',
                    boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
                  }}
                />
              ) : (
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '8rem', color: 'rgba(255,239,237,0.7)',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {p.nombre.charAt(0)}
                </span>
              )}
            </div>

            {/* Right: Info — flex-start para que no corte contenido */}
            <div style={{
              padding: '40px 36px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
            }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontStyle: 'italic', fontSize: '2rem', color: '#B5161E',
                marginBottom: '10px', lineHeight: 1.15,
              }}>
                {p.nombre}
              </h1>

              <div style={{
                width: '48px', height: '3px',
                background: 'linear-gradient(135deg, #B5161E, #FFB467)',
                borderRadius: '2px', marginBottom: '16px',
              }} />

              <p style={{
                fontSize: '0.92rem', color: '#5C5B5B',
                lineHeight: 1.75, marginBottom: '24px',
              }}>
                {p.descripcion ?? 'Producto artesanal PanDa.'}
              </p>

              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontStyle: 'italic', fontSize: '2.2rem', color: '#FFB467',
                marginBottom: '28px',
              }}>
                ${p.precio_base.toFixed(2)}{' '}
                <span style={{ fontSize: '1rem', color: '#AFADAC', fontStyle: 'normal', fontWeight: 500 }}>
                  MXN
                </span>
              </div>

              <ProductActions
                producto={{
                  id_producto:      p.id_producto,
                  nombre:           p.nombre,
                  precio_base:      p.precio_base,
                  foto_url:         p.foto_url,
                  stock_disponible: stock,
                }}
                personalizable={personalizable}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
