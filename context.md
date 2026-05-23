# PanDa Landing Page — context.md
> **Regla estricta:** Este archivo debe ser revisado y actualizado en cada iteración o modificación del código. Es la fuente de verdad histórica del proyecto.

---

## 1. Origen del Proyecto

- **Plataforma de diseño:** Google Stitch (MCP)
- **Proyectos en Stitch:**
  - `PanDa_Demo` — ID: `436284153758003528` (Mobile, LIGHT mode, fuente: Plus Jakarta Sans, color custom: `#d41111`)
  - `PanDa Hero Section` — ID: `4807369225804629555` (Desktop, fuente: Plus Jakarta Sans + Manrope, DESIGN.md completo, color override: `#D32F2F`)
- **Creative North Star:** "The Radiant Heritage" — une la panadería china artesanal con una estética editorial moderna y vibrante.
- **Filosofía de diseño:** Asimetría intencional, glassmorphism, layering tonal, sin líneas de borde de 1px.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| HTML | HTML5 semántico | Estructura principal en `index.html` |
| CSS | Tailwind CSS v3 (CDN) | + variables CSS custom para colores del design system |
| Fuentes | Google Fonts: Plus Jakarta Sans, Manrope | Display/Headline = Jakarta, Body/Nav = Manrope |
| SVG | Inline SVG | Forma curva rojo oscuro en esquina inferior-izquierda del Hero |
| Despliegue | Estático (abrir en navegador) | Sin build step requerido |

---

## 3. Estructura de Archivos

```
PROYECTOCALIDAD/
├── index.html          # Landing page principal (única página)
├── context.md          # Este archivo — historial del proyecto
└── assets/
    └── logo.png        # Logotipo oficial PanDa (panda rojo con sombrero dumpling)
```

---

## 4. Paleta de Colores (Design System)

### Colores Primarios
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `primary` | `#B5161E` | Botones primarios, acentos, SVG curvo |
| `primary_container` | `#FF766D` | Gradiente kinético |
| `secondary` | `#874E00` | Acentos secundarios |
| `secondary_fixed_dim` | `#FFB467` | Extremo caliente del gradiente |
| `tertiary` | `#705900` | Detalles dorados |

### Gradiente Kinético (Hero / CTAs)
```css
background: linear-gradient(135deg, #B5161E, #FFB467);
```

### Superficies
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `surface` | `#F9F6F5` | Fondo base |
| `surface_container` | `#EAE7E7` | Secciones de contenido secundario |
| `surface_container_lowest` | `#FFFFFF` | Tarjetas elevadas |
| `surface_container_low` | `#F3F0EF` | Fondo alterno de secciones |

### Texto
| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `on_surface` | `#2F2F2E` | Texto principal |
| `on_surface_variant` | `#5C5B5B` | Texto secundario |
| `on_primary` | `#FFEFED` | Texto sobre fondos primarios/gradiente |
| `outline_variant` | `#AFADAC` | Solo como "Ghost Border" al 15% de opacidad |

---

## 5. Tipografía

| Rol | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Display (logotipo/h1) | Plus Jakarta Sans | 3.5rem (56px) | 800 (ExtraBold) |
| Headline (sub-secciones) | Plus Jakarta Sans | 2rem (32px) | 700 |
| Body (párrafos) | Manrope | 1rem (16px) | 400 |
| Navigation labels | Manrope | 0.875rem (14px) | 500 |
| Botones | Manrope | 0.875rem | 600 |

---

## 6. Componentes Clave

### Navbar (Glassmorphism)
- **Forma:** Píldora flotante centrada (`rounded-full`)
- **Fondo:** `rgba(255, 239, 237, 0.65)` (on_primary al 65% de opacidad)
- **Blur:** `backdrop-filter: blur(20px)`
- **Hover:** Subrayado de 2px en color `primary` o scale-up sutil
- **Links:** Home, Nosotros, Menú, Blog, Contacto

### Hero Section
- **Fondo:** Gradiente kinético (`#B5161E` → `#FFB467`) orientado 135°
- **SVG Curvo rojo oscuro:** Forma orgánica en esquina inferior-izquierda usando `<path>` con curvas bezier, fill `#7B0000` (rojo oscuro profundo)
- **CTA primario:** Botón con gradiente kinético + texto `on_primary`

### Botones
| Tipo | Background | Texto | Border |
|------|-----------|-------|--------|
| Primary | Gradiente kinético | `#FFEFED` | Ninguno |
| Secondary | `#DFDCDC` | `#2F2F2E` | Ninguno |
| Tertiary | Transparente | `#B5161E` bold | Ninguno |

### Tarjetas de Producto
- Background: `#FFFFFF` (`surface_container_lowest`)
- Border radius: `1.5rem` (24px)
- Imagen desborda el borde superior-derecho de la tarjeta
- Sin sombras de drop-shadow genéricas; usar: `box-shadow: 0 20px 40px rgba(47, 47, 46, 0.06)`

---

## 7. Reglas de Diseño Estrictas

1. **Sin líneas de 1px** para separar secciones. Solo cambios de fondo o patrones.
2. **Sin sombras genéricas de Material Design.** Solo sombras ambientales de baja opacidad.
3. **Glassmorphism obligatorio** en navbar: `backdrop-filter: blur(20px)`.
4. **Padding generoso:** usar `py-16` a `py-20` para respiración entre secciones.
5. **Texto sobre gradiente siempre en `on_primary`** (`#FFEFED`) para accesibilidad AA.
6. **El SVG ondulado** es la "firma visual" del Hero — nunca usar una caja rectangular simple.

---

## 8. Historial de Iteraciones

### v1.0 — 2026-03-23
- **Creación inicial del proyecto.**
- Recuperado diseño de Stitch MCP (proyectos: `PanDa_Demo` y `PanDa Hero Section`).
- Extraído DESIGN.md completo con paleta, tipografía y componentes.
- Generado `index.html` con:
  - Navbar glassmorphism (backdrop-blur-xl, `rounded-full`)
  - Hero con gradiente kinético
  - SVG curvo rojo oscuro en esquina inferior-izquierda del Hero
  - Sección de productos
  - Sección "Nuestra Historia"
  - Footer
- Creado `context.md` (este archivo).

### v1.1 — 2026-03-24
- **Integración del logotipo oficial PanDa.**
- Creada carpeta `assets/` en el proyecto.
- Logo guardado como `assets/logo.png` (oso panda rojo con sombrero de dumpling, tipografía brush script "PanDa").
- Reemplazado el texto "PanDa" en:
  - **Navbar:** ahora muestra `<img>` del logo (40×40px, `rounded-lg`).
  - **Hero:** logo (96×96px) + h1 "PanDa" en texto en fila horizontal.
  - **Footer:** logo pequeño (40×40px) + texto de marca junto.
- Sin cambios en paleta, glassmorphism o SVG curvo.

### v1.2 — 2026-03-24
- **Corrección de logotipo:** se sustituyó la imagen generada por IA por el logo oficial del usuario (`media__1774380270506.png` → `assets/logo.png`).
- Logo ahora aparece **únicamente en el navbar** (44×44px, sin `border-radius`).
- Hero y Footer vuelven a branding en texto limpio (sin imagen).

### v1.3 — 2026-03-24
- **Pastel de luna giratorio en el Hero.**
- Imagen del usuario guardada como `assets/mooncake.jpg`.
- Hero reestructurado a **dos columnas** (flex-row en desktop): texto izquierda, pastel derecha.
- Animaciones CSS puras:
  - `@keyframes mooncake-spin` — rotación continua 360° en 22 segundos (suave, lineal).
  - `@keyframes mooncake-float` — flotación vertical ±22px cada 5 segundos (ease-in-out).
- `mix-blend-mode: screen` — elimina el fondo negro de la foto; el pastel dorado brilla sobre el gradiente rojo.
- `filter: drop-shadow(...)` — halo anaranjado/rojo alrededor del pastel para integración visual.
- `mooncake-glow` — anillo radial semitransparente detrás del pastel como efecto de luz ambiental.
- Tamaño responsivo: `clamp(320px, 38vw, 520px)` — grande en desktop, compacto en mobile.

### v1.4 — 2026-03-24
- **Pastel de luna 3D con Three.js (WebGL).**
- Eliminada animación CSS 2D (mix-blend-mode: screen) por quedar mal visualmente.
- Integrada librería Three.js r160 desde CDN (`jsdelivr.net`).
- Geometría: `CylinderGeometry(r=2, height=0.72, segments=80)` — forma de disco = pastel de luna.
- Materiales:
  - Top cap: `MeshStandardMaterial` con textura `assets/mooncake.jpg` (foto del usuario).
  - Lado: dorado-café `#C07828` con roughness 0.5.
  - Base: marrón oscuro `#8B5010`.
- Iluminación: Ambient cálido + KeyLight blanco-cálido + FillLight + RimLight rojo `#B5161E`.
- Animación: rotación Y continua (0.009 rad/frame) + wobble leve en X con `Math.sin`.
- El `<canvas>` Three.js es transparente (`alpha: true`), mostrando el gradiente del Hero atrás.
- Flotación CSS (`.mooncake-wrap`) sigue con `@keyframes mooncake-float` (5s ease-in-out).
