'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';

const LINKS = [
  { href: '/cliente/dashboard',   label: 'Dashboard' },
  { href: '/cliente/catalogo',    label: 'Catálogo' },
  { href: '/cliente/pedidos',     label: 'Mis Pedidos' },
  { href: '/cliente/soporte',     label: 'Soporte' },
];

export function Navbar({ userName }: { userName: string }) {
  const pathname  = usePathname();
  const { count } = useCart();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Condensar navbar al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar user menu al click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstName = userName.split(' ')[0];

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 50, display: 'flex', justifyContent: 'center',
      padding: '20px 16px 0',
      transition: 'padding 0.3s ease',
      paddingTop: scrolled ? '12px' : '20px',
    }}>
      {/* ── Pill principal ── */}
      <nav
        className="glass-nav"
        style={{
          borderRadius: '9999px',
          padding: '10px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          width: '100%',
          maxWidth: '860px',
          boxShadow: scrolled
            ? '0 4px 24px rgba(47,47,46,0.10)'
            : '0 2px 8px rgba(47,47,46,0.04)',
          transition: 'box-shadow 0.3s ease',
        }}
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link href="/cliente/dashboard" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img
            src="/assets/logo.png"
            alt="PanDa"
            style={{ width: '44px', height: '44px', objectFit: 'contain' }}
          />
        </Link>

        {/* Links — desktop */}
        <div className="nav-desktop-links">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${pathname.startsWith(href) ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Acciones — derecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>

          {/* Carrito */}
          <Link
            href="/cliente/carrito"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}
            title="Carrito"
          >
            <ShoppingCart size={22} color="#2F2F2E" />
            {count > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                background: '#B5161E', color: '#FFEFED',
                borderRadius: '50%', width: '17px', height: '17px',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="nav-user-btn"
              style={{
                alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #B5161E 0%, #FFB467 100%)',
                color: '#FFEFED', border: 'none', borderRadius: '50px',
                padding: '8px 16px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                transition: 'filter 0.2s',
              }}
            >
              <User size={15} />
              {firstName}
              <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: '#fff', borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(47,47,46,0.12)',
                overflow: 'hidden', minWidth: '176px', zIndex: 100,
                animation: 'fade-in-up 0.2s ease both',
              }}>
                <Link
                  href="/cliente/perfil"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '13px 16px', color: '#2F2F2E', textDecoration: 'none',
                    fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                >
                  <User size={15} color="#B5161E" />
                  Mi Perfil
                </Link>
                <div style={{ height: '1px', background: '#F3F0EF', margin: '0 12px' }} />
                <a
                  href="/auth/signout"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '13px 16px', color: '#B5161E', textDecoration: 'none',
                    fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </a>
              </div>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            style={{
              display: 'none',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px', borderRadius: '8px',
            }}
            className="nav-mobile-toggle"
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} color="#2F2F2E" /> : <Menu size={22} color="#2F2F2E" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          style={{
            position: 'absolute', top: '76px', left: '16px', right: '16px',
            borderRadius: '24px', padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: '4px',
            animation: 'fade-in-up 0.25s ease both',
            background: '#F9F6F5',
            border: '1px solid rgba(175,173,172,0.25)',
            boxShadow: '0 20px 40px rgba(47,47,46,0.10)',
          }}
        >
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${pathname.startsWith(href) ? ' active' : ''}`}
              style={{ display: 'block', padding: '8px 0' }}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div style={{ height: '1px', background: 'rgba(47,47,46,0.08)', margin: '8px 0' }} />
          <Link
            href="/cliente/carrito"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#2F2F2E', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}
            onClick={() => setMobileOpen(false)}
          >
            <ShoppingCart size={16} /> Carrito {count > 0 && `(${count})`}
          </Link>
          <a
            href="/auth/signout"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#B5161E', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <LogOut size={16} /> Cerrar sesión
          </a>
        </div>
      )}
    </header>
  );
}
