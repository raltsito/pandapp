-- ============================================================
-- PanDa Pastelería · Schema PostgreSQL para Supabase
-- Convertido de 01_BD.sql (T-SQL / SQL Server) con cambios mínimos:
--   · INT IDENTITY → SERIAL
--   · VARCHAR(MAX) → TEXT
--   · DATETIME → TIMESTAMPTZ
--   · BIT → BOOLEAN
--   · GETDATE() → NOW()
--   · USERS.auth_id UUID añadido (enlace con Supabase Auth)
--   · USERS.contrasena removido (lo gestiona Supabase Auth)
--   · PRODUCTO.foto_url añadido (necesario para UI)
-- ============================================================

-- Limpieza idempotente
DROP TABLE IF EXISTS public.entrega CASCADE;
DROP TABLE IF EXISTS public.reserva_inventario CASCADE;
DROP TABLE IF EXISTS public.pedido_personalizado CASCADE;
DROP TABLE IF EXISTS public.event_log CASCADE;
DROP TABLE IF EXISTS public.pago CASCADE;
DROP TABLE IF EXISTS public.detalle_pedido CASCADE;
DROP TABLE IF EXISTS public.inventario CASCADE;
DROP TABLE IF EXISTS public.pedido CASCADE;
DROP TABLE IF EXISTS public.producto CASCADE;
DROP TABLE IF EXISTS public.repartidor CASCADE;
DROP TABLE IF EXISTS public.rol CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE public.users (
  id_user        SERIAL PRIMARY KEY,
  auth_id        UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         VARCHAR(100) NOT NULL,
  telefono       VARCHAR(20),
  email          VARCHAR(150) NOT NULL UNIQUE,
  calle          VARCHAR(100) NOT NULL,
  colonia        VARCHAR(100) NOT NULL,
  num_casa       INT NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.rol (
  id_rol     SERIAL PRIMARY KEY,
  id_user    INT NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
  nombre_rol VARCHAR(20) NOT NULL CHECK (nombre_rol IN ('CLIENTE','ADMIN','REPARTIDOR')),
  CONSTRAINT uq_rol_user_nombre UNIQUE (id_user, nombre_rol)
);

CREATE TABLE public.repartidor (
  id_repartidor SERIAL PRIMARY KEY,
  id_user       INT NOT NULL UNIQUE REFERENCES public.users(id_user) ON DELETE CASCADE,
  estatus       VARCHAR(20)
);

CREATE TABLE public.producto (
  id_producto SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC(10,2) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  foto_url    TEXT
);

CREATE TABLE public.pedido (
  id_pedido      SERIAL PRIMARY KEY,
  id_user        INT NOT NULL REFERENCES public.users(id_user),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_entrega  TIMESTAMPTZ,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  estatus        VARCHAR(20) NOT NULL DEFAULT 'CREATED'
    CHECK (estatus IN ('CREATED','IN_PROGRESS','DELIVERED','CANCELLED','REFUNDED'))
);

CREATE TABLE public.detalle_pedido (
  id_detalle  SERIAL PRIMARY KEY,
  id_pedido   INT NOT NULL REFERENCES public.pedido(id_pedido) ON DELETE CASCADE,
  id_producto INT NOT NULL REFERENCES public.producto(id_producto),
  cantidad    INT NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL
);

CREATE TABLE public.entrega (
  id_entrega          SERIAL PRIMARY KEY,
  id_pedido           INT NOT NULL REFERENCES public.pedido(id_pedido),
  id_repartidor       INT NOT NULL REFERENCES public.repartidor(id_repartidor),
  codigo_confirmacion VARCHAR(6),
  confirmado          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.event_log (
  id_event         SERIAL PRIMARY KEY,
  id_pedido        INT NOT NULL REFERENCES public.pedido(id_pedido) ON DELETE CASCADE,
  estatus_anterior VARCHAR(50),
  estatus_nuevo    VARCHAR(50) NOT NULL,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descripcion      VARCHAR(255)
);

CREATE TABLE public.inventario (
  id_inventario    SERIAL PRIMARY KEY,
  id_producto      INT NOT NULL UNIQUE REFERENCES public.producto(id_producto) ON DELETE CASCADE,
  stock_disponible INT NOT NULL DEFAULT 0,
  stock_reservado  INT NOT NULL DEFAULT 0
);

CREATE TABLE public.pago (
  id_pago         SERIAL PRIMARY KEY,
  id_pedido       INT NOT NULL REFERENCES public.pedido(id_pedido) ON DELETE CASCADE,
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

CREATE TABLE public.pedido_personalizado (
  id_pedido_personalizado SERIAL PRIMARY KEY,
  id_detalle              INT NOT NULL REFERENCES public.detalle_pedido(id_detalle) ON DELETE CASCADE,
  sabor_pan               VARCHAR(20) NOT NULL
    CHECK (sabor_pan IN ('Vainilla','Chocolate','Zanahoria','Limón','Otro')),
  relleno                 VARCHAR(20) NOT NULL
    CHECK (relleno IN ('Crema','Fresa','Chocolate','Cajeta','Otro')),
  decoracion_especial     VARCHAR(300),
  mensaje_dedicatoria     VARCHAR(200),
  cargo_extra             NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.reserva_inventario (
  id_reserva  SERIAL PRIMARY KEY,
  id_producto INT NOT NULL REFERENCES public.producto(id_producto),
  cantidad    INT NOT NULL,
  id_pedido   INT REFERENCES public.pedido(id_pedido) ON DELETE CASCADE,
  expiracion  TIMESTAMPTZ NOT NULL,
  activa      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_eventlog_pedido            ON public.event_log(id_pedido);
CREATE INDEX idx_pago_estatus               ON public.pago(estatus);
CREATE INDEX idx_pago_pedido                ON public.pago(id_pedido);
CREATE INDEX idx_pedido_estatus             ON public.pedido(estatus);
CREATE INDEX idx_pedido_user                ON public.pedido(id_user);
CREATE INDEX idx_reserva_expiracion         ON public.reserva_inventario(expiracion, activa);
CREATE INDEX idx_reserva_producto           ON public.reserva_inventario(id_producto, activa);
CREATE INDEX idx_detalle_pedido             ON public.detalle_pedido(id_pedido);
CREATE INDEX idx_detalle_producto           ON public.detalle_pedido(id_producto);
CREATE INDEX idx_entrega_pedido             ON public.entrega(id_pedido);
CREATE INDEX idx_entrega_repartidor         ON public.entrega(id_repartidor);
CREATE INDEX idx_rol_user                   ON public.rol(id_user);
CREATE INDEX idx_repartidor_user            ON public.repartidor(id_user);
CREATE INDEX idx_pedido_personalizado_det   ON public.pedido_personalizado(id_detalle);
CREATE INDEX idx_users_auth                 ON public.users(auth_id);
