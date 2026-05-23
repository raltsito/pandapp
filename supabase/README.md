# Supabase Setup — PanDa Pastelería

Pasos para desplegar la base de datos en Supabase desde cero.

---

## 1. Crear proyecto en Supabase

1. Ir a https://supabase.com → **New Project**
2. Nombre: `panda-pasteleria` (o el que prefieras)
3. Database Password: elige una segura y guárdala
4. Region: la más cercana (ej. `East US`)
5. Plan: Free tier es suficiente
6. Esperar ~2 min a que termine de provisionar

---

## 2. Ejecutar migrations

En el dashboard de Supabase: **SQL Editor → New query**.

Ejecutar **en este orden exacto** (uno por uno, click en `Run` después de pegar cada archivo):

1. `migrations/01_schema.sql` — Tablas, FKs, índices
2. `migrations/02_helpers.sql` — Funciones helper + trigger de signup
3. `migrations/03_rls_policies.sql` — Row Level Security
4. `migrations/04_seed.sql` — Productos demo + inventario

Si algún script falla, lee el error y arregla antes de continuar. Los scripts son idempotentes (puedes re-ejecutarlos).

---

## 3. Habilitar Email Auth

**Authentication → Providers → Email**:
- ✅ Enable email provider
- ✅ Confirm email: **DESACTIVAR** durante desarrollo (para evitar tener que verificar correo)
- En producción, reactivarlo

---

## 4. Copiar credenciales

**Settings → API**:
- `Project URL` → guardar como `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → guardar como `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` (secret) → guardar como `SUPABASE_SERVICE_ROLE_KEY` (solo server-side)

Estos valores se ponen en `.env.local` del proyecto Next.js (Fase 0/2).

---

## 5. Crear usuarios de prueba

### Cliente
Se crea automáticamente desde la pantalla `/register` del frontend (Fase 2). El trigger `handle_new_user` se encarga de:
- Insertar fila en `public.users` con los datos del formulario
- Asignar rol `CLIENTE` automáticamente

### Admin (manual)
1. **Authentication → Users → Add user → Create new user**:
   - Email: `admin@panda.test`
   - Password: `Admin123!`
   - Auto Confirm User: ✅
2. Copiar el `id` (UUID) que aparece en la lista
3. **SQL Editor**, ejecutar:

```sql
-- Reemplaza <UUID> por el id del usuario admin recién creado
DO $$
DECLARE
  v_uuid UUID := '<UUID>';
  v_id_user INT;
BEGIN
  INSERT INTO public.users (auth_id, nombre, email, calle, colonia, num_casa)
  VALUES (v_uuid, 'Admin PanDa', 'admin@panda.test', 'Calle Admin', 'Centro', 1)
  ON CONFLICT (auth_id) DO UPDATE SET nombre = EXCLUDED.nombre
  RETURNING id_user INTO v_id_user;

  INSERT INTO public.rol (id_user, nombre_rol) VALUES (v_id_user, 'ADMIN')
  ON CONFLICT (id_user, nombre_rol) DO NOTHING;
END $$;
```

> Nota: Si `handle_new_user` ya creó la fila vacía, el `INSERT` con `ON CONFLICT` la actualiza.

### Repartidor (manual)
Mismo proceso, pero el SQL es:

```sql
DO $$
DECLARE
  v_uuid UUID := '<UUID-DEL-REPARTIDOR>';
  v_id_user INT;
BEGIN
  INSERT INTO public.users (auth_id, nombre, telefono, email, calle, colonia, num_casa)
  VALUES (v_uuid, 'Juan Repartidor', '5551234567', 'juan@panda.test', 'Calle Norte', 'Centro', 10)
  ON CONFLICT (auth_id) DO UPDATE SET nombre = EXCLUDED.nombre
  RETURNING id_user INTO v_id_user;

  INSERT INTO public.rol (id_user, nombre_rol) VALUES (v_id_user, 'REPARTIDOR')
  ON CONFLICT (id_user, nombre_rol) DO NOTHING;

  INSERT INTO public.repartidor (id_user, estatus) VALUES (v_id_user, 'ACTIVO')
  ON CONFLICT (id_user) DO NOTHING;
END $$;
```

---

## 6. Verificación

En **SQL Editor**, corre:

```sql
SELECT u.email, r.nombre_rol
FROM public.users u
JOIN public.rol r ON r.id_user = u.id_user
ORDER BY u.id_user;
```

Deberías ver tu admin y repartidor con sus roles.

```sql
SELECT p.nombre, p.precio_base, i.stock_disponible
FROM public.producto p
JOIN public.inventario i ON i.id_producto = p.id_producto
ORDER BY p.id_producto;
```

Deberías ver 10 productos con stock inicial de 50.

---

## 7. Re-ejecutar todo (reset completo)

Si necesitas borrar y empezar desde cero:

1. SQL Editor: ejecuta `migrations/01_schema.sql` (incluye `DROP TABLE IF EXISTS ... CASCADE`)
2. Continúa con 02, 03, 04 en orden

⚠️ Esto **NO borra** los usuarios de `auth.users`. Para eliminarlos: **Authentication → Users → seleccionar → Delete**.

---

## Estructura de archivos

```
supabase/
├── README.md              ← Este archivo
└── migrations/
    ├── 01_schema.sql      ← Tablas + FKs + índices
    ├── 02_helpers.sql     ← Funciones + trigger de signup
    ├── 03_rls_policies.sql← Row Level Security
    └── 04_seed.sql        ← Productos demo + inventario
```
