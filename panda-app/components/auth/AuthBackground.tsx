'use client';

import { useEffect, useRef } from 'react';

const CLOUDS: { viewBox: string; d: string; dur: string; delay: string; style: React.CSSProperties }[] = [
  {
    viewBox: '0 0 400 120',
    d: 'M20 80 Q60 20 100 60 Q120 40 150 60 Q170 30 200 55 Q230 30 260 55 Q290 25 320 60 Q350 40 380 70 Q400 55 400 80 Q400 100 380 100 L20 100 Q0 100 0 80 Q0 60 20 80Z',
    dur: '28s', delay: '0s',
    style: { top: '8%', left: '-10%', width: '420px' },
  },
  {
    viewBox: '0 0 300 100',
    d: 'M15 65 Q45 15 80 50 Q100 30 125 50 Q150 20 180 48 Q210 25 240 55 Q270 38 285 65 Q300 52 300 65 Q300 80 285 80 L15 80 Q0 80 0 65 Q0 50 15 65Z',
    dur: '22s', delay: '-8s',
    style: { top: '55%', left: '-8%', width: '300px' },
  },
  {
    viewBox: '0 0 380 110',
    d: 'M18 75 Q55 18 95 55 Q115 35 145 55 Q165 28 195 52 Q225 28 255 52 Q285 22 315 58 Q345 38 365 68 Q380 55 380 75 Q380 95 365 95 L18 95 Q0 95 0 75 Q0 56 18 75Z',
    dur: '32s', delay: '-4s',
    style: { top: '20%', right: '-10%', width: '380px', transform: 'scaleX(-1)' },
  },
  {
    viewBox: '0 0 260 90',
    d: 'M12 60 Q38 12 68 45 Q88 25 112 45 Q138 18 165 44 Q192 22 215 55 Q238 40 248 60 Q258 50 258 60 Q258 75 248 75 L12 75 Q0 75 0 60 Q0 46 12 60Z',
    dur: '25s', delay: '-15s',
    style: { bottom: '10%', right: '-5%', width: '260px', transform: 'scaleX(-1)' },
  },
  {
    viewBox: '0 0 200 80',
    d: 'M10 55 Q30 10 55 40 Q72 22 90 40 Q112 15 135 40 Q158 20 175 50 Q190 40 195 55 Q198 45 198 55 Q198 68 188 68 L10 68 Q0 68 0 55 Q0 43 10 55Z',
    dur: '35s', delay: '-20s',
    style: { top: '-5%', left: '35%', width: '200px' },
  },
];

export function AuthBackground({ children }: { children: React.ReactNode }) {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      const size = 6 + Math.random() * 18;
      Object.assign(p.style, {
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(255,239,237,0.18)',
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: 'float-particle ease-in-out infinite',
        animationDuration: `${4 + Math.random() * 5}s`,
        animationDelay: `${-Math.random() * 6}s`,
      });
      container.appendChild(p);
    }
    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #B5161E 0%, #C94A1A 45%, #FFB467 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated clouds */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {CLOUDS.map((cloud, i) => (
          <svg
            key={i}
            viewBox={cloud.viewBox}
            fill="none"
            style={{
              position: 'absolute',
              opacity: 0.08,
              animation: `drift linear ${cloud.dur} ${cloud.delay} infinite`,
              ...cloud.style,
            }}
          >
            <path d={cloud.d} fill="white" />
          </svg>
        ))}
      </div>

      {/* Floating particles */}
      <div ref={particlesRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Card slot */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '480px', padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}
