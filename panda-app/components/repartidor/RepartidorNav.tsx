'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/repartidor/dashboard', label: 'Inicio' },
  { href: '/repartidor/entregas',  label: 'Mis Entregas' },
];

export function RepartidorNav({ nombre }: { nombre: string }) {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
      background: '#fff', borderBottom: '1.5px solid #EAE7E7',
      display: 'flex', alignItems: 'center', padding: '0 24px',
      gap: '24px', zIndex: 40,
    }}>
      <Link href="/repartidor/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
        <img src="/assets/logo.png" alt="PanDa" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: '#B5161E', lineHeight: 1 }}>PanDa</div>
          <div style={{ fontSize: '0.62rem', color: '#AFADAC', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Repartidor</div>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: '4px', flex: 1 }}>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{
              padding: '7px 14px', borderRadius: '10px', textDecoration: 'none',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: active ? 700 : 500,
              color: active ? '#B5161E' : '#5C5B5B',
              background: active ? 'rgba(181,22,30,0.07)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', color: '#FFEFED' }}>{nombre.charAt(0).toUpperCase()}</span>
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2F2F2E' }}>{nombre.split(' ')[0]}</span>
        <a href="/auth/signout" style={{ padding: '6px 12px', borderRadius: '8px', background: '#EAE7E7', color: '#5C5B5B', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
          Salir
        </a>
      </div>
    </header>
  );
}
