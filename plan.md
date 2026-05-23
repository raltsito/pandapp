# Plan de Implementación — PanDa Pastelería

> Última actualización: 2026-05-07
> Ver `CLAUDE.md` para contexto completo del proyecto antes de trabajar.

---

## Estado Actual

| Página | Estado |
|--------|--------|
| `index.html` — Landing page | ✅ Completo |
| `login(1).html` — Login/Register/Forgot | ✅ Completo |
| `menu.html` — Catálogo con filtros y modal | ✅ Completo |
| `templates/core/` — Versiones Django | ✅ Completo |
| `01_BD.sql` — Schema de base de datos | ✅ Definido |
| `supabase/migrations/*.sql` — Schema PostgreSQL + RLS + seed | ✅ Generado (Fase 1) |
| App Next.js (`panda-app/`) | ✅ Creado |
| Módulo Público (login + register) | ✅ Completo |
| Módulo Cliente — Catálogo | ✅ Completo |
| Módulo Cliente — Producto detalle | ✅ Completo |
| Módulo Cliente — Carrito | ✅ Completo |
| Módulo Cliente — Checkout (con pago simulado) | ✅ Completo |
| Módulo Cliente — Pedidos (historial) | ✅ Completo |
| Módulo Cliente — Pedidos/[id] (detalle + timeline) | ✅ Completo |
| Módulo Cliente — Seguimiento, Soporte, Perfil | ⬜ Pendiente (Fase 4) |
| Módulo Admin | ⬜ Pendiente (Fase 5) |
| Módulo Repartidor | ⬜ Pendiente (Fase 6) |

---

## Fase 0 — Setup del proyecto Next.js ✅

**Objetivo:** Tener el proyecto base corriendo con el design system PanDa.

- [x] `npx create-next-app@latest panda-app` (Next.js 16 + Tailwind v4 + TS)
- [x] Instalar dependencias: `@supabase/ssr @supabase/supabase-js lucide-react`
- [x] Tailwind v4: design system PanDa configurado en `app/globals.css` con `@theme`
- [x] Google Fonts vía `next/font/google` (Plus Jakarta Sans + Manrope)
- [x] `lib/supabase/client.ts` (browser) + `lib/supabase/server.ts` (server)
- [x] `lib/auth.ts` con helper `getSessionUser()`
- [x] `.env.local` y `.env.local.example` creados
- [x] `proxy.ts` (Next 16) para protección de rutas por rol
- [x] `app/page.tsx` redirige según rol o a `/login`

### Pendiente (paso manual del usuario)
- [ ] Llenar `panda-app/.env.local` con credenciales Supabase
- [ ] `cd panda-app && npm run dev` → confirmar que arranca en `http://localhost:3000`

---

## Fase 1 — Base de datos en Supabase ✅

**Objetivo:** Schema completo corriendo en Supabase PostgreSQL.

### Archivos generados (listos para ejecutar)
- [x] `supabase/migrations/01_schema.sql` — Tablas + FKs + índices (T-SQL → PostgreSQL)
- [x] `supabase/migrations/02_helpers.sql` — Funciones helper + trigger signup
- [x] `supabase/migrations/03_rls_policies.sql` — Row Level Security por rol
- [x] `supabase/migrations/04_seed.sql` — 10 productos demo + inventario
- [x] `supabase/README.md` — Guía paso a paso

### Pasos manuales del usuario (en supabase.com)
- [ ] Crear proyecto en supabase.com
- [ ] Ejecutar 01 → 02 → 03 → 04 en SQL Editor (en ese orden)
- [ ] Authentication → Providers → Email: habilitado, "Confirm email" desactivado para dev
- [ ] Crear usuario Admin manual + ejecutar SQL de asignación de rol (ver README §5)
- [ ] Crear usuario Repartidor manual + ejecutar SQL de asignación
- [ ] Copiar `Project URL`, `anon key`, `service_role key` para Fase 0

### Pendiente para Fase 0/2
- [ ] Generar tipos TypeScript: `npx supabase gen types typescript --project-id <id> > types/database.ts`

---

## Fase 2 — Módulo Público (Login / Register) ✅

**Objetivo:** Autenticación completa con Supabase Auth, visual idéntica a `login(1).html`.

- [x] `/login/page.tsx` — Formulario (email lowercase, contraseña, mensajes de error claros)
- [x] `/register/page.tsx` — Campos: nombre, teléfono, email, contraseña, confirmar, calle, colonia, num_casa
- [x] `components/auth/AuthBackground.tsx`

**Pendiente:**
- [ ] `/auth/callback/route.ts` — Handler OAuth de Supabase (si se necesita OAuth)
- [ ] `components/ui/Toast.tsx` — Alertas reutilizables (actualmente los mensajes están inline)
- [ ] `components/ui/Loader.tsx` — Spinner reutilizable

---

## Fase 3 — Módulo Cliente (Compra base) ✅

**Objetivo:** Flujo completo de compra para el cliente.

### Catálogo y Producto ✅
- [x] `(cliente)/catalogo/page.tsx` — Grid con buscador, badge Agotado, filtros
- [x] `components/catalogo/CatalogoGrid.tsx` — Componente client-side interactivo
- [x] `(cliente)/producto/[id]/page.tsx` — Foto, descripción, cantidad, agregar al carrito
- [x] `components/producto/ProductActions.tsx`
- [ ] `(cliente)/personalizar/page.tsx` — **Pendiente** (personalización de pasteles)

### Carrito ✅
- [x] `lib/cart.ts` — get/set/remove/clear sobre localStorage; tipo `CartItem`
- [x] `components/cart/CartContext.tsx` — React Context
- [x] `(cliente)/carrito/page.tsx` — Lista, editar cantidad, eliminar, total

### Checkout ✅
- [x] `(cliente)/checkout/page.tsx` + `CheckoutClient.tsx`
  - Resumen, dirección pre-llenada, ReservaTimer (15 min, rojo <2min)
  - Selector método: Efectivo / Tarjeta (form UI) / Transferencia
  - INSERT pedido + detalle_pedido + reserva_inventario + pago
  - UPDATE pedido a IN_PROGRESS + INSERT event_log
  - Botón "Simular fallo" (DEMO) → pago FAILED + error_code CARD_DECLINED
  - Reintentar tras fallo

### Historial ✅
- [x] `(cliente)/pedidos/page.tsx` — Lista con badges por estatus
- [x] `(cliente)/pedidos/[id]/page.tsx`
  - Badge pedido + badge pago separados
  - Stepper de seguimiento (Confirmado → Empacado → En camino → Entregado)
  - Código de confirmación visible si hay entrega asignada
  - Timeline EVENT_LOG
  - Dirección, productos, total
  - CancelarButton (si estatus = CREATED)
  - Link a soporte

**Componentes creados:**
- [x] `components/navbar/Navbar.tsx` — Glassmorphism pill
- [x] `app/(cliente)/layout.tsx` — Layout con Navbar y CartContext

---

## Fase 4 — Módulo Cliente (Trazabilidad y Perfil) ✅

- [x] `(cliente)/seguimiento/[id]/page.tsx` — Stepper animado, código de confirmación por caracteres, resumen de productos
- [x] `(cliente)/soporte/page.tsx` — Selector de pedido, historial EVENT_LOG, formulario de ticket simulado
- [x] `(cliente)/perfil/page.tsx` + `PerfilClient.tsx` — Tabs (datos / contraseña), edición inline, `updateUser` de Supabase Auth

---

## Fase 5 — Módulo Admin ✅

- [x] `(admin)/layout.tsx` — Guard ADMIN + sidebar integrado
- [x] `components/admin/AdminSidebar.tsx` — Sidebar fijo desktop + drawer móvil, links activos
- [x] `(admin)/dashboard/page.tsx` — 7 KPI cards + tabla de pedidos recientes
- [x] `(admin)/pedidos/page.tsx` — Tabla filtrable por estatus + buscador por id/nombre/email
- [x] `(admin)/pedidos/[id]/page.tsx` + `PedidoAcciones.tsx` — Detalle completo, cambiar estado, asignar repartidor (genera código), reembolso, EVENT_LOG
- [x] `(admin)/pagos/page.tsx` — Tabla filtrable, error_code, id_gateway
- [x] `(admin)/inventario/page.tsx` + `InventarioClient.tsx` — Edición inline de stock, alertas agotado/bajo
- [x] `(admin)/productos/page.tsx` + `ProductosClient.tsx` — CRUD con modal, toggle activo/inactivo, crea entrada inventario automática
- [x] `(admin)/usuarios/page.tsx` + `UsuariosClient.tsx` — Buscador, badges de rol, asignar Repartidor/Admin

---

## Fase 6 — Módulo Repartidor ✅

- [x] `(repartidor)/layout.tsx` — Navbar top con guard REPARTIDOR
- [x] `components/repartidor/RepartidorNav.tsx` — Barra de navegación con links activos
- [x] `(repartidor)/dashboard/page.tsx` — KPIs pendientes/entregados hoy + lista de próximas entregas
- [x] `(repartidor)/entregas/page.tsx` — Lista filtrable (Todas/Pendientes/Entregadas), teléfono, dirección
- [x] `(repartidor)/entregas/[id]/page.tsx` — Datos cliente + teléfono clicable + productos
- [x] `ValidarEntrega.tsx` — Input 6 chars, validación vs BD, UPDATE entrega + pedido DELIVERED + EVENT_LOG

---

## Fase 7 — Despliegue

### Supabase
1. Confirmar que todas las tablas y RLS policies están activas
2. Insertar datos de prueba: productos, usuario admin, usuario repartidor

### Vercel
1. `git init` + `git remote add origin <repo>`
2. `git push -u origin main`
3. Importar en vercel.com → Framework: Next.js
4. Variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy → verificar URL pública

### Checklist final
- [ ] Login → redirect correcto por rol
- [ ] Cliente puede agregar al carrito y persistir en localStorage
- [ ] Checkout crea pedido y reserva en BD
- [ ] Timeline EVENT_LOG visible en detalle de pedido
- [ ] Admin puede asignar repartidor y cambiar estado
- [ ] Repartidor valida código → pedido pasa a DELIVERED
- [ ] Build sin errores TypeScript
- [ ] Deploy en Vercel sin errores de entorno

---

## Componentes Globales de UI (checklist)

- [ ] `Badge.tsx` — Colores distintos: CREATED=gris, IN_PROGRESS=azul, DELIVERED=verde, CANCELLED=rojo, REFUNDED=naranja
- [ ] `Toast.tsx` — Stack de notificaciones top-right (éxito, error, advertencia)
- [ ] `Modal.tsx` — Overlay con confirmación
- [ ] `Loader.tsx` — Spinner "Procesando pago..."
- [ ] `Timeline.tsx` — Línea de tiempo desde EVENT_LOG
- [ ] `ReservaTimer.tsx` — Contador regresivo en checkout
- [ ] `DataTable.tsx` — Tabla con búsqueda y filtros
- [ ] `Navbar.tsx` — Glassmorphism pill (cliente)
- [ ] `Sidebar.tsx` — Colapsible (admin/repartidor)
