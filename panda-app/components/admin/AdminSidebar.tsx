'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/pedidos',    label: 'Pedidos',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/admin/pagos',      label: 'Pagos',       icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href: '/admin/inventario', label: 'Inventario',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/productos',  label: 'Productos',   icon: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z' },
  { href: '/admin/usuarios',   label: 'Usuarios',    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
];

export function AdminSidebar({ nombre }: { nombre: string }) {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);

  const initial = nombre.charAt(0).toUpperCase();

  const navLinks = (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: active ? 700 : 500,
              color: active ? '#B5161E' : '#5C5B5B',
              background: active ? 'rgba(181,22,30,0.07)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d={icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
        background: '#fff', borderRight: '1.5px solid #EAE7E7',
        display: 'flex', flexDirection: 'column', zIndex: 40,
      }}
        className="admin-sidebar-desktop"
      >
        {/* Logo */}
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F3F0EF' }}>
          <img src="/assets/logo.png" alt="PanDa" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#B5161E' }}>PanDa</div>
            <div style={{ fontSize: '0.68rem', color: '#AFADAC', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '12px' }}>
          {navLinks}
        </div>

        {/* User footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F0EF', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#B5161E,#FFB467)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: '#FFEFED' }}>{initial}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2F2F2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</div>
          </div>
          <a href="/auth/signout" title="Cerrar sesión" style={{ color: '#AFADAC', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </aside>

      {/* ── Topbar móvil ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: '#fff', borderBottom: '1.5px solid #EAE7E7',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', zIndex: 40,
      }}
        className="admin-topbar-mobile"
      >
        <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#2F2F2E" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
        <img src="/assets/logo.png" alt="PanDa" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#B5161E' }}>PanDa Admin</span>
      </header>

      {/* ── Drawer móvil ── */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(47,47,46,0.4)', zIndex: 48 }} />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px',
            background: '#fff', zIndex: 49, display: 'flex', flexDirection: 'column',
            animation: 'slide-in-left 0.22s ease both',
          }}>
            <div style={{ padding: '20px 24px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #F3F0EF' }}>
              <img src="/assets/logo.png" alt="PanDa" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#B5161E' }}>PanDa Admin</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: '12px' }}>{navLinks}</div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F0EF' }}>
              <a href="/auth/signout" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B5161E', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cerrar sesión
              </a>
            </div>
          </div>
        </>
      )}

      <style>{`
        .admin-sidebar-desktop { display: flex !important; }
        .admin-topbar-mobile   { display: none  !important; }
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none  !important; }
          .admin-topbar-mobile   { display: flex !important; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
