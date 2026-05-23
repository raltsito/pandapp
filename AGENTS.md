# AGENTS.md — PanDa Pastelería · Fuente de Verdad

> **Regla estricta:** Revisar y actualizar este archivo en cada sesión de trabajo antes de hacer cambios. Es el contexto canónico del proyecto.
> **Regla estricta:** Cada vez que se cree o modifique una pantalla/página, actualizar `pantallas.md` con su ruta, descripción y funciones. Este archivo es el inventario vivo de la UI.

---

## 1. Descripción del Proyecto

**PanDa** es una aplicación web de pastelería china artesanal con un sistema completo de pedidos, pagos, inventario y entregas. Tiene 4 roles de usuario: Cliente, Repartidor y Admin (más el módulo público de Login/Registro).

- **Creative North Star:** "The Radiant Heritage" — panadería china artesanal con estética editorial moderna
- **Despliegue objetivo:** Vercel (frontend) + Supabase (auth + PostgreSQL)

---

## 2. Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | **Next.js 16** (App Router) | Vercel-native. Importante: en Next 16 `middleware.ts` se renombró a **`proxy.ts`** y la función exportada es `proxy()` |
| Estilos | **Tailwind CSS v4** | Sin `tailwind.config.ts`. Tema en `app/globals.css` con `@theme {}` directive |
| Auth + DB | Supabase (`@supabase/ssr`) | PostgreSQL, Auth, RLS |
| Lenguaje | TypeScript | Tipos generados desde Supabase |
| Fuentes | `next/font/google`: Plus Jakarta Sans + Manrope | Variables `--font-display` y `--font-body` |
| Iconos | Lucide React | |
| Cart | localStorage via CartContext | No hay tabla CARRITO en BD |

---

## 3. Design System (NO MODIFICAR)

### Colores
```css
--primary: #B5161E;
--primary-container: #FF766D;
--secondary: #874E00;
--secondary-fixed-dim: #FFB467;
--tertiary: #705900;
--surface: #F9F6F5;
--surface-container: #EAE7E7;
--surface-container-lowest: #FFFFFF;
--surface-container-low: #F3F0EF;
--on-surface: #2F2F2E;
--on-surface-variant: #5C5B5B;
--on-primary: #FFEFED;
--outline-variant: #AFADAC;
```

### Gradiente Kinético (botones primarios, hero)
```css
background: linear-gradient(135deg, #B5161E, #FFB467);
```

### Tipografía
| Rol | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Display/h1 | Plus Jakarta Sans | 3.5rem | 800 |
| Headline | Plus Jakarta Sans | 2rem | 700 |
| Body | Manrope | 1rem | 400 |
| Nav labels | Manrope | 0.875rem | 500 |
| Botones | Manrope | 0.875rem | 600 |

### Reglas de Diseño Estrictas
1. Sin líneas de 1px como separadores — solo cambio de fondo
2. Sin sombras genéricas — solo `box-shadow: 0 20px 40px rgba(47,47,46,0.06)`
3. Navbar con glassmorphism: `backdrop-filter: blur(20px)`, `rounded-full`
4. Texto sobre gradiente siempre en `#FFEFED` (on_primary)
5. Border radius de tarjetas: `1.5rem` (24px)
6. Padding generoso: `py-16` a `py-20`

---

## 4. Estructura del Repositorio

```
PROYECTOCALIDAD/
├── index.html              ✅ Landing page completa (NO tocar sin razón)
├── login(1).html           ✅ Login/Register/Forgot password (5 pantallas)
├── menu.html               ✅ Catálogo con filtros, modal, carrito JS
├── templates/core/         ✅ Versiones Django de las 3 páginas anteriores
├── assets/
│   ├── logo.png            Logo oficial PanDa
│   └── mooncake.jpg        Imagen pastel de luna (Three.js 3D)
├── 01_BD.sql               Schema canónico (T-SQL → convertir a PostgreSQL para Supabase)
├── context.md              Historial técnico del proyecto
├── AGENTS.md               Este archivo
├── plan.md                 Plan de implementación activo
└── panda-app/              ← Directorio del proyecto Next.js (se crea en Fase 0)
    ├── app/
    ├── components/
    ├── lib/
    └── types/
```

---

## 5. Base de Datos — Schema Canónico (01_BD.sql)

Usar **exactamente** las tablas de `01_BD.sql`. Cambios mínimos para Supabase:

### Tabla: USERS
```sql
CREATE TABLE users (
  id_user       SERIAL PRIMARY KEY,
  auth_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- AÑADIDO para Supabase Auth
  nombre        VARCHAR(100) NOT NULL,
  telefono      VARCHAR(20),
  email         VARCHAR(150) NOT NULL UNIQUE,
  calle         VARCHAR(100) NOT NULL,
  colonia       VARCHAR(100) NOT NULL,
  num_casa      INT NOT NULL,
  fecha_registro TIMESTAMPTZ DEFAULT NOW()
  -- contrasena omitida: la maneja Supabase Auth
);
```

### Tabla: ROL
```sql
CREATE TABLE rol (
  id_rol      SERIAL PRIMARY KEY,
  id_user     INT NOT NULL REFERENCES users(id_user),
  nombre_rol  VARCHAR(20) NOT NULL CHECK (nombre_rol IN ('CLIENTE','ADMIN','REPARTIDOR')),
  UNIQUE(id_user, nombre_rol)
);
```

### Tabla: REPARTIDOR
```sql
CREATE TABLE repartidor (
  id_repartidor SERIAL PRIMARY KEY,
  id_user       INT NOT NULL UNIQUE REFERENCES users(id_user),
  estatus       VARCHAR(20)
);
```

### Tabla: PRODUCTO
```sql
CREATE TABLE producto (
  id_producto  SERIAL PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  descripcion  TEXT,
  precio_base  NUMERIC(10,2) NOT NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  foto_url     TEXT  -- AÑADIDO: mínimo necesario para mostrar imagen en UI
);
```

### Tabla: PEDIDO
```sql
CREATE TABLE pedido (
  id_pedido      SERIAL PRIMARY KEY,
  id_user        INT NOT NULL REFERENCES users(id_user),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_entrega  TIMESTAMPTZ,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  estatus        VARCHAR(20) NOT NULL DEFAULT 'CREATED'
    CHECK (estatus IN ('CREATED','IN_PROGRESS','DELIVERED','CANCELLED','REFUNDED'))
);
```

### Tabla: DETALLE_PEDIDO
```sql
CREATE TABLE detalle_pedido (
  id_detalle  SERIAL PRIMARY KEY,
  id_pedido   INT NOT NULL REFERENCES pedido(id_pedido),
  id_producto INT NOT NULL REFERENCES producto(id_producto),
  cantidad    INT NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL
);
```

### Tabla: ENTREGA
```sql
CREATE TABLE entrega (
  id_entrega          SERIAL PRIMARY KEY,
  id_pedido           INT NOT NULL REFERENCES pedido(id_pedido),
  id_repartidor       INT NOT NULL REFERENCES repartidor(id_repartidor),
  codigo_confirmacion VARCHAR(6),
  confirmado          BOOLEAN NOT NULL DEFAULT FALSE
);
```

### Tabla: EVENT_LOG
```sql
CREATE TABLE event_log (
  id_event         SERIAL PRIMARY KEY,
  id_pedido        INT NOT NULL REFERENCES pedido(id_pedido),
  estatus_anterior VARCHAR(50),
  estatus_nuevo    VARCHAR(50) NOT NULL,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descripcion      VARCHAR(255)
);
```

### Tabla: INVENTARIO
```sql
CREATE TABLE inventario (
  id_inventario   SERIAL PRIMARY KEY,
  id_producto     INT NOT NULL REFERENCES producto(id_producto),
  stock_disponible INT NOT NULL DEFAULT 0,
  stock_reservado  INT NOT NULL DEFAULT 0
);
```

### Tabla: PAGO
```sql
CREATE TABLE pago (
  id_pago         SERIAL PRIMARY KEY,
  id_pedido       INT NOT NULL REFERENCES pedido(id_pedido),
  id_gateway      VARCHAR(100) UNIQUE,
  idempotency_key VARCHAR(100) UNIQUE,
  event_id        VARCHAR(100) UNIQUE,
  estatus         VARCHAR(20) NOT NULL DEFAULT 'INITIATED'
    CHECK (estatus IN ('INITIATED','PENDING','PAID','FAILED','REFUNDED')),
  monto           NUMERIC(10,2) NOT NULL,
  error_code      VARCHAR(50),
  error_mensaje   VARCHAR(255),
  fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabla: PEDIDO_PERSONALIZADO
```sql
CREATE TABLE pedido_personalizado (
  id_pedido_personalizado SERIAL PRIMARY KEY,
  id_detalle              INT NOT NULL REFERENCES detalle_pedido(id_detalle),
  sabor_pan               VARCHAR(20) NOT NULL
    CHECK (sabor_pan IN ('Vainilla','Chocolate','Zanahoria','Limón','Otro')),
  relleno                 VARCHAR(20) NOT NULL
    CHECK (relleno IN ('Crema','Fresa','Chocolate','Cajeta','Otro')),
  decoracion_especial     VARCHAR(300),
  mensaje_dedicatoria     VARCHAR(200),
  cargo_extra             NUMERIC(10,2) NOT NULL DEFAULT 0
);
```

### Tabla: RESERVA_INVENTARIO
```sql
CREATE TABLE reserva_inventario (
  id_reserva  SERIAL PRIMARY KEY,
  id_producto INT NOT NULL REFERENCES producto(id_producto),
  cantidad    INT NOT NULL,
  id_pedido   INT REFERENCES pedido(id_pedido),
  expiracion  TIMESTAMPTZ NOT NULL,
  activa      BOOLEAN NOT NULL DEFAULT TRUE
);
```

### Cambios mínimos justificados respecto a 01_BD.sql
| Campo añadido | Tabla | Motivo |
|---|---|---|
| `auth_id UUID` | USERS | Enlace con Supabase Auth (sin esto no hay login) |
| `foto_url TEXT` | PRODUCTO | Sin imagen no hay catálogo funcional |
| Se elimina `contrasena` de USERS | USERS | Supabase Auth gestiona la contraseña de forma segura |

---

## 6. Páginas ya Construidas (NO rehacer desde cero)

| Archivo | Estado | Notas |
|---|---|---|
| `index.html` | ✅ Completo | Hero 3D, 6 secciones, Navbar glassmorphism |
| `login(1).html` | ✅ Completo | 5 pantallas con transiciones |
| `menu.html` | ✅ Completo | Filtros, modal, carrito JS |
| `templates/core/login.html` | ✅ | Django + CSRF + /api/login/ |
| `templates/core/index.html` | ✅ | Django version del landing |
| `templates/core/menu.html` | ✅ | Django + productos desde BD |

En Next.js: estas páginas se **adaptan** (no se rehacen). Se reutiliza el CSS/HTML como referencia exacta.

---

## 7. Módulos del Frontend (según requerimientos)

### Módulo Público
- `/login` — email, contraseña, mensajes de error, email lowercase
- `/register` — nombre, teléfono, email, contraseña, confirmar, calle, colonia, num_casa

### Módulo Cliente (`/cliente/...`)
- `/cliente/dashboard` — pedidos recientes, alertas, accesos rápidos
- `/cliente/catalogo` — grid productos, buscador, filtro categoría, stock
- `/cliente/producto/[id]` — foto, descripción, cantidad, personalización
- `/cliente/carrito` — lista localStorage, subtotales, editar/eliminar
- `/cliente/checkout` — resumen, dirección, pago, cronómetro RESERVA_INVENTARIO
- `/cliente/pedidos` — historial, filtros por estatus
- `/cliente/pedidos/[id]` — timeline EVENT_LOG, estado pedido vs estado pago separados
- `/cliente/seguimiento/[id]` — estado entrega, repartidor, código confirmación
- `/cliente/soporte` — selector pedido, historial, formulario
- `/cliente/perfil` — editar datos, cambiar contraseña

### Módulo Repartidor (`/repartidor/...`)
- `/repartidor/dashboard` — pedidos asignados, pendientes, entregados hoy
- `/repartidor/entregas` — lista con dirección, cliente, teléfono, estatus
- `/repartidor/entregas/[id]` — datos pedido, input código, validar, marcar entregado

### Módulo Admin (`/admin/...`)
- `/admin/dashboard` — KPI cards (pedidos, pagos, stock, entregas)
- `/admin/pedidos` — tabla filtrable por estatus, búsqueda id/cliente
- `/admin/pedidos/[id]` — asignar repartidor, cambiar estado, reembolsar, EVENT_LOG
- `/admin/pagos` — listado, error_code, id_gateway, reintentar conciliación
- `/admin/inventario` — stock disponible/reservado, alertas
- `/admin/productos` — CRUD, precio, activo/inactivo
- `/admin/usuarios` — usuarios, roles, convertir en repartidor
- `/admin/soporte` — tickets, trazabilidad, responder/cerrar

---

## 8. Flujos Críticos

### Carrito → Checkout
1. Cliente agrega producto → `localStorage` via `CartContext`
2. Checkout: revalidar stock vs `INVENTARIO.stock_disponible`
3. Si hay stock → INSERT `RESERVA_INVENTARIO` (expiracion = now + 15min) → mostrar cronómetro
4. Confirmar → INSERT `PEDIDO` + `DETALLE_PEDIDO`
5. **Pago simulado** (proyecto escolar — sin gateway real):
   - Pantalla de pago con opciones: Efectivo / Tarjeta (simulado) / Transferencia
   - Botón "Pagar ahora" → spinner 2s → INSERT `PAGO` (estatus = 'PAID', idempotency_key = uuid frontend)
   - Botón "Simular fallo" → INSERT `PAGO` (estatus = 'FAILED', error_code = 'CARD_DECLINED')
6. Pago exitoso → UPDATE `PEDIDO.estatus = 'IN_PROGRESS'` + INSERT `EVENT_LOG`
7. Fallo → mostrar error, botón Reintentar; reserva se libera al expirar

### Entrega sin GPS
1. Admin asigna repartidor → INSERT/UPDATE `ENTREGA`
2. Cliente ve `codigo_confirmacion` en `/cliente/seguimiento/[id]`
3. Repartidor captura código en `/repartidor/entregas/[id]`
4. Validar código == `ENTREGA.codigo_confirmacion`
5. Si correcto → `confirmado = TRUE`, `PEDIDO.estatus = 'DELIVERED'` + INSERT `EVENT_LOG`

---

## 9. Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Solo en server-side
```

---

## 10. Despliegue

### Supabase
1. Crear proyecto → Copiar URL y anon key
2. SQL Editor → Ejecutar schema PostgreSQL (basado en 01_BD.sql con cambios mínimos)
3. Authentication → Email/Password habilitado
4. RLS Policies: cliente solo sus pedidos; repartidor solo sus entregas; admin todo

### Vercel
1. GitHub repo → Import en vercel.com
2. Framework: Next.js (auto-detectado)
3. Environment Variables: pegar las 3 vars de Supabase
4. Deploy

---

## 11. Historial de Sesiones

### Nota permanente: Pagos simulados
El proyecto es escolar — **no hay gateway de pago real**. El flujo de pago se simula en el frontend:
- Botón "Pagar ahora" → delay 2s + INSERT PAGO estatus='PAID' (idempotency_key = crypto.randomUUID())
- Botón "Simular fallo" → INSERT PAGO estatus='FAILED', error_code='CARD_DECLINED'
- Campos `id_gateway` y `event_id` en tabla PAGO quedan NULL
- La tabla PAGO se mantiene igual (sirve para demostrar el modelo de datos ante el profesor)

---

### 2026-05-07 — Sesión inicial de planificación
- Leído `01_BD.sql` (T-SQL, SQL Server)
- Leído requerimientos de `Frontend-Requerimientos_ACTUALIZADO_Pasteleria.docx`
- Identificado stack existente: vanilla HTML + Tailwind CDN + Django templates
- Decisión: migrar a Next.js 14 preservando design system y páginas existentes como referencia
- Cambios mínimos al schema: añadir `auth_id` en USERS y `foto_url` en PRODUCTO
- Creados `plan.md` y `AGENTS.md`

### 2026-05-07 — Fase 1 completada (Base de datos)
Archivos generados en `supabase/`:
- `migrations/01_schema.sql` — Schema PostgreSQL convertido de T-SQL
- `migrations/02_helpers.sql` — Funciones `current_user_id()`, `is_admin()`, `is_repartidor()`, `current_repartidor_id()`, `log_pedido_evento()` + trigger `handle_new_user` que auto-crea `users` + asigna rol `CLIENTE` al hacer signUp
- `migrations/03_rls_policies.sql` — RLS habilitado en las 12 tablas con policies por rol
- `migrations/04_seed.sql` — 10 productos demo + inventario inicial (50 unidades c/u)
- `README.md` — Guía paso a paso para desplegar en Supabase

Decisiones técnicas tomadas:
- El registro vía Supabase Auth pasa los datos extra (nombre, telefono, calle, colonia, num_casa) en `raw_user_meta_data`. El trigger `handle_new_user` los lee desde ahí.
- Admin y Repartidor se crean manualmente desde el dashboard de Supabase (instrucciones en README §5).
- Product `foto_url` admite `NULL` — el frontend usa fallback (SVG placeholder o avatar de inicial).
- En modo dev: deshabilitar "Confirm email" en Auth para no tener que verificar correos.

**Pendiente:** Ejecutar las migraciones en un proyecto real de Supabase (paso manual del usuario, descrito en `supabase/README.md`).

### 2026-05-07 — Fase 0 completada (Setup Next.js)
Creado proyecto en `panda-app/` con Next.js 16 + Tailwind v4 + TypeScript + ESLint.

Archivos creados:
- `app/globals.css` — `@theme` directive con design system PanDa (colores, fuentes, gradientes)
- `app/layout.tsx` — Plus Jakarta Sans + Manrope vía `next/font/google`
- `app/page.tsx` — Server component que redirige según rol o a `/login`
- `lib/supabase/client.ts` — `createBrowserClient` para client components
- `lib/supabase/server.ts` — `createServerClient` con `cookies()` async (Next 15+)
- `lib/supabase/proxy.ts` — Helper `updateSession` para protección de rutas por rol
- `lib/auth.ts` — Helper `getSessionUser()` que devuelve `{ idUser, role, nombre, email, authId }`
- `proxy.ts` (root) — Convención de Next 16 (antes `middleware.ts`)
- `.env.local` (vacío) y `.env.local.example` (template)

Decisiones técnicas Next 16 / Tailwind v4:
- **`proxy.ts`** reemplaza `middleware.ts` en Next 16 — la función se exporta como `proxy(request)`
- **Tailwind v4** ya no usa `tailwind.config.ts`. Tokens (colores, fonts) se declaran con `@theme { --color-name: ... }` en CSS y generan utilidades automáticas (`bg-primary`, `font-display`, etc.)
- `cookies()` de `next/headers` es async — siempre con `await`
- Lectura de `next/dist/docs/` confirma que la API de Next.js cambió respecto a versiones previas; consultar esos docs antes de usar APIs nuevas

**Cómo arrancar dev server (después de Fase 1 en Supabase):**
1. Llenar `panda-app/.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. `cd panda-app && npm run dev`
3. Abrir `http://localhost:3000` → redirige a `/login` (404 hasta que se cree en Fase 2)
