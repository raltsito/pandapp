# Inventario de Pantallas — PanDa Pastelería

> Actualizar este archivo cada vez que se cree o modifique una pantalla.
> Última actualización: 2026-05-10

---

## Leyenda de estado

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completa y funcional |
| 🔨 | En construcción |
| ⬜ | Pendiente |

---

## Módulo Público (sin autenticación)

### `/login` — Inicio de sesión
**Archivo:** `panda-app/app/login/page.tsx`
**Estado:** ✅
**Pantallas internas (sin cambio de ruta):**
- **Login** — formulario email + contraseña; email forzado a minúsculas; botón "Inicia sesión" llama `supabase.auth.signInWithPassword`; redirige a `/` (el middleware decide el dashboard por rol); link a `/register`
- **Olvidé contraseña** — formulario email; botón "Enviar enlace" llama `supabase.auth.resetPasswordForEmail`; transición slide
- **Correo enviado** — pantalla de confirmación con ícono de sobre; botón volver a login

**Componente de fondo:** `AuthBackground` (gradiente kinético, nubes animadas, partículas flotantes)

---

### `/register` — Registro de cliente
**Archivo:** `panda-app/app/register/page.tsx`
**Estado:** ✅
**Pantallas internas:**
- **Formulario** — 8 campos: nombre, teléfono, email, contraseña, confirmar contraseña, calle, colonia, num_casa; área scrollable; botón "Limpiar form." resetea todos los campos; botón "Crear cuenta" llama `supabase.auth.signUp` con `raw_user_meta_data`; el trigger `handle_new_user` crea la fila en `public.users` y asigna rol `CLIENTE`
- **Éxito** — pantalla con checkmark animado y botón "Iniciar sesión" que redirige a `/login`
- Validaciones: contraseñas coincidentes, mínimo 6 caracteres, num_casa numérico

**Componente de fondo:** `AuthBackground`

---

### `/auth/signout` — Cerrar sesión
**Archivo:** `panda-app/app/auth/signout/route.ts`
**Estado:** ✅
**Función:** Llama `supabase.auth.signOut()` y redirige a `/login`. Accesible por GET.

---

### `/auth/callback` — Callback OAuth / magic link
**Archivo:** `panda-app/app/auth/callback/route.ts`
**Estado:** ✅
**Función:** Intercambia el `code` de la URL por una sesión Supabase (`exchangeCodeForSession`); redirige a `/` si éxito o a `/login?error=auth` si falla. Usado para recuperación de contraseña y OAuth futuro.

---

## Módulo Cliente (`/cliente/...`)

### `/cliente/dashboard` — Panel del cliente
**Archivo:** `panda-app/app/(cliente)/cliente/dashboard/page.tsx`
**Estado:** 🔨 Placeholder
**Funciones actuales:** muestra nombre y email del usuario autenticado; botón cerrar sesión (`/auth/signout`)
**Funciones previstas (Fase 3):** pedidos recientes, alertas de stock, accesos rápidos a catálogo y carrito

### `/cliente/catalogo` — Catálogo de productos
**Archivo:** `panda-app/app/(cliente)/cliente/catalogo/page.tsx` + `components/catalogo/CatalogoGrid.tsx`
**Estado:** ✅
**Funciones:**
- Servidor: consulta `producto JOIN inventario` desde Supabase (solo activos)
- Buscador en tiempo real por nombre y descripción
- Filtros por categoría: Todos / Pasteles / Al vapor / Hojaldrados / Panadería / Galletas (derivado del nombre)
- Grid responsive `auto-fill minmax(280px, 1fr)` con animación card-in escalonada
- Tarjetas con borde rojo, pins naranjas, hover con escala y sombra roja
- Badge "Agotado" superpuesto cuando `stock_disponible = 0`
- Click en tarjeta → abre **modal** con imagen, descripción, stock, precio, selector cantidad, botón "Agregar al carrito", carrusel de otros productos
- Stock se carga con query separada (join anidado de Supabase devolvía null)

### `/cliente/producto/[id]` — Detalle de producto
**Archivo:** `panda-app/app/(cliente)/cliente/producto/[id]/page.tsx` + `components/producto/ProductActions.tsx`
**Estado:** ✅
**Funciones:**
- Servidor: fetch producto + stock por ID, 404 si no existe o inactivo
- Layout dos columnas: imagen (gradiente o foto real) | info
- Selector de cantidad (−/+) limitado al stock disponible
- Badge stock verde / gris según disponibilidad
- Subtotal en tiempo real (precio × cantidad)
- Botón "Agregar al carrito" → CartContext + animación verde con check
- Botón "Personalizar pastel" (pasteles) → `/cliente/personalizar?id=X`

### `/cliente/personalizar` — Personalización de pastel
**Estado:** ⬜ (Fase 3)
**Funciones previstas:** sabor_pan, relleno, decoración especial, mensaje dedicatoria, cargo extra

### `/cliente/carrito` — Carrito de compras
**Archivo:** `panda-app/app/(cliente)/cliente/carrito/page.tsx`
**Estado:** ✅
**Funciones:**
- Lee items del CartContext (localStorage)
- Cards con pins naranjas, imagen, nombre, precio, selector cantidad, subtotal, badge stock, botón Eliminar
- Pantalla vacía con botón "Ir al catálogo" si no hay items
- Resumen: subtotal, total, info de reserva temporal
- Botón "Vaciar carrito"
- Botón "Continuar al Checkout" → `/cliente/checkout`

### `/cliente/checkout` — Proceso de compra
**Archivo:** `panda-app/app/(cliente)/cliente/checkout/page.tsx` + `CheckoutClient.tsx`
**Estado:** ✅
**Funciones:**
- Cronómetro de reserva 15:00 con pulso animado (rojo cuando quedan <2min)
- Resumen readonly de items del carrito con total
- Dirección pre-llenada del perfil con link "Editar"
- Selector de método de pago: Tarjeta / Efectivo / Transferencia
- Estado de pago visual: Iniciar → Pendiente (spinner) → Pagado / Fallido
- "Confirmar compra": INSERT pedido + detalle_pedido + reserva_inventario + pago(PAID) + event_log → redirect a pedidos
- "Simular fallo de pago": INSERT pago(FAILED, CARD_DECLINED)
- "Reintentar pago" tras fallo
- Botones Volver (carrito) y Cancelar (catálogo)
**Funciones previstas:** resumen pedido, dirección, pago simulado (Efectivo/Tarjeta/Transferencia), cronómetro de reserva de inventario, botón "Simular fallo de pago"

### `/cliente/pedidos` — Historial de pedidos
**Archivo:** `panda-app/app/(cliente)/cliente/pedidos/page.tsx`
**Estado:** ✅
**Funciones:** lista pedidos propios ordenados por fecha desc, badge de estatus con color, total, link a detalle de cada pedido
**Funciones previstas:** lista pedidos propios, filtros por estatus (CREATED, IN_PROGRESS, DELIVERED, CANCELLED)

### `/cliente/pedidos/[id]` — Detalle de pedido
**Archivo:** `panda-app/app/(cliente)/cliente/pedidos/[id]/page.tsx` + `CancelarButton.tsx`
**Estado:** ✅
**Funciones:**
- Hero editorial: número del pedido en gradiente kinetic italic, fecha y dos chips de estatus (pedido + pago)
- Stepper horizontal de 4 pasos (Confirmado · Empacado · En camino · Entregado) con animación de pulso en el paso activo
- Código de confirmación de entrega en mono font con borde naranja punteado (visible si hay repartidor asignado)
- Lista read-only de productos con imagen, cantidad y subtotal + total destacado
- Tarjeta de dirección de entrega
- Timeline vertical de event_log con gradiente rojo→naranja→gris
- Banner especial para pedidos cancelados / reembolsados
- Detalle del pago fallido si aplica (error_code + error_mensaje)
- Botón cancelar pedido (solo CREATED) con modal de confirmación → UPDATE pedido + INSERT event_log
- Botón contactar soporte
**Funciones previstas:** datos pedido, badge estado pedido + badge estado pago (separados), timeline EVENT_LOG, botón cancelar (si CREATED), botón soporte

### `/cliente/seguimiento/[id]` — Seguimiento de entrega
**Estado:** ⬜ (Fase 4)
**Funciones previstas:** estado entrega, repartidor asignado, código de confirmación, botón copiar código

### `/cliente/soporte` — Soporte
**Estado:** ⬜ (Fase 4)
**Funciones previstas:** selector de pedido, historial EVENT_LOG, formulario de mensaje

### `/cliente/perfil` — Perfil de usuario
**Estado:** ⬜ (Fase 4)
**Funciones previstas:** editar datos personales, cambiar contraseña vía Supabase Auth

---

## Módulo Admin (`/admin/...`)

### `/admin/dashboard` — Panel administrador
**Archivo:** `panda-app/app/(admin)/admin/dashboard/page.tsx`
**Estado:** 🔨 Placeholder
**Funciones actuales:** muestra nombre y email del admin autenticado; botón cerrar sesión (`/auth/signout`)
**Funciones previstas (Fase 5):** KPI cards: pedidos por estatus, pagos fallidos, productos agotados, entregas activas

### `/admin/pedidos` — Gestión de pedidos
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** tabla filtrable por estatus, búsqueda por id/cliente

### `/admin/pedidos/[id]` — Detalle de pedido admin
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** datos cliente y productos, EVENT_LOG, cambiar estado, asignar repartidor (genera código de confirmación 6 chars), reembolsar, cancelar

### `/admin/pagos` — Gestión de pagos
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** tabla con estatus, monto, id_gateway, error_code, reintentar conciliación

### `/admin/inventario` — Control de inventario
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** tabla stock_disponible/stock_reservado, alertas de bajo stock, editar stock

### `/admin/productos` — CRUD de productos
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** listar, crear, editar (nombre, descripción, precio, activo, foto_url), activar/desactivar

### `/admin/usuarios` — Gestión de usuarios
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** lista usuarios + rol, cambiar rol, convertir en repartidor

### `/admin/soporte` — Soporte admin
**Estado:** ⬜ (Fase 5)
**Funciones previstas:** tickets, trazabilidad pedido, responder/cerrar

---

## Módulo Repartidor (`/repartidor/...`)

### `/repartidor/dashboard` — Panel repartidor
**Archivo:** `panda-app/app/(repartidor)/repartidor/dashboard/page.tsx`
**Estado:** 🔨 Placeholder
**Funciones actuales:** muestra nombre y email del repartidor autenticado; botón cerrar sesión (`/auth/signout`)
**Funciones previstas (Fase 6):** pedidos asignados pendientes, entregados hoy

### `/repartidor/entregas` — Lista de entregas
**Estado:** ⬜ (Fase 6)
**Funciones previstas:** lista con dirección, cliente, teléfono, estatus entrega

### `/repartidor/entregas/[id]` — Detalle de entrega
**Estado:** ⬜ (Fase 6)
**Funciones previstas:** datos pedido y dirección, input código de 6 chars, validar código → marca DELIVERED + inserta EVENT_LOG, reportar incidencia

---

## Páginas HTML estáticas (referencia de diseño, no parte del flujo Next.js)

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Landing page completa con hero 3D (Three.js), navbar glassmorphism, 6 secciones |
| `login(1).html` | Referencia visual de login/register con 5 pantallas y animaciones |
| `menu.html` | Catálogo con filtros, modal de producto, carrito en localStorage |
| `templates/core/login.html` | Versión Django del login (con CSRF + `/api/login/`) |
| `templates/core/index.html` | Versión Django del landing |
| `templates/core/menu.html` | Versión Django del catálogo (productos desde BD) |

---

## Componentes de UI compartidos

| Componente | Archivo | Estado | Descripción |
|-----------|---------|--------|-------------|
| AuthBackground | `components/auth/AuthBackground.tsx` | ✅ | Fondo animado para páginas de auth (gradiente, nubes, partículas) |
| Navbar | `components/navbar/Navbar.tsx` | ✅ | Navbar glassmorphism pill: logo, links (Catálogo/Pedidos/Soporte), badge carrito, menú usuario con dropdown, hamburger mobile, scroll condensation |
| CartProvider / useCart | `components/cart/CartContext.tsx` | ✅ | Context global del carrito: items, count, total, addToCart, removeFromCart, updateQuantity, clearCart (persiste en localStorage) |
| Badge | `components/ui/Badge.tsx` | ⬜ | Badges de estatus (CREATED=gris, IN_PROGRESS=azul, DELIVERED=verde, CANCELLED=rojo, REFUNDED=naranja) |
| Toast | `components/ui/Toast.tsx` | ⬜ | Stack de notificaciones top-right |
| Modal | `components/ui/Modal.tsx` | ⬜ | Overlay de confirmación para acciones destructivas |
| Loader | `components/ui/Loader.tsx` | ⬜ | Spinner de carga |
| Timeline | `components/ui/Timeline.tsx` | ⬜ | Línea de tiempo desde EVENT_LOG |
| ReservaTimer | `components/checkout/ReservaTimer.tsx` | ⬜ | Contador regresivo de reserva de inventario |
| DataTable | `components/ui/DataTable.tsx` | ⬜ | Tabla con búsqueda y filtros |
| Navbar | `components/navbar/Navbar.tsx` | ⬜ | Navbar glassmorphism pill (módulo cliente) |
| Sidebar | `components/sidebar/Sidebar.tsx` | ⬜ | Sidebar colapsible (admin/repartidor) |
