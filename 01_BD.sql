USE sistema_pedidos;

IF OBJECT_ID('dbo.ENTREGA', 'U') IS NOT NULL DROP TABLE dbo.ENTREGA;
IF OBJECT_ID('dbo.RESERVA_INVENTARIO', 'U') IS NOT NULL DROP TABLE dbo.RESERVA_INVENTARIO;
IF OBJECT_ID('dbo.PEDIDO_PERSONALIZADO', 'U') IS NOT NULL DROP TABLE dbo.PEDIDO_PERSONALIZADO;
IF OBJECT_ID('dbo.EVENT_LOG', 'U') IS NOT NULL DROP TABLE dbo.EVENT_LOG;
IF OBJECT_ID('dbo.PAGO', 'U') IS NOT NULL DROP TABLE dbo.PAGO;
IF OBJECT_ID('dbo.DETALLE_PEDIDO', 'U') IS NOT NULL DROP TABLE dbo.DETALLE_PEDIDO;
IF OBJECT_ID('dbo.INVENTARIO', 'U') IS NOT NULL DROP TABLE dbo.INVENTARIO;
IF OBJECT_ID('dbo.PEDIDO', 'U') IS NOT NULL DROP TABLE dbo.PEDIDO;
IF OBJECT_ID('dbo.PRODUCTO', 'U') IS NOT NULL DROP TABLE dbo.PRODUCTO;
IF OBJECT_ID('dbo.USERS', 'U') IS NOT NULL DROP TABLE dbo.USERS;
IF OBJECT_ID('dbo.REPARTIDOR','U') IS NOT NULL DROP TABLE dbo.REPARTIDOR;
IF OBJECT_ID('dbo.ROL','U') IS NOT NULL DROP TABLE dbo.ROL;
GO

CREATE TABLE dbo.USERS
(
    id_user         INT IDENTITY(1,1) NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20) NULL,
    email           VARCHAR(150) NOT NULL,
    contrasena      VARCHAR(64) NOT NULL,
    calle           VARCHAR(100) NOT NULL,
    colonia         VARCHAR(100) NOT NULL,
    num_casa        INT NOT NULL,
    fecha_registro  DATETIME NULL CONSTRAINT DF_USERS_fecha_registro DEFAULT (GETDATE()),

    CONSTRAINT PK_USERS PRIMARY KEY CLUSTERED (id_user),
    CONSTRAINT UQ_USERS_email UNIQUE (email)
);
GO

CREATE TABLE dbo.rol
(
    id_rol INT IDENTITY(1,1) NOT NULL,
    id_user INT NOT NULL,
    nombre_rol VARCHAR(20) NOT NULL,

    CONSTRAINT PK_ROL PRIMARY KEY CLUSTERED (id_rol),
    CONSTRAINT CHK_ROL_nombre CHECK (nombre_rol IN ('CLIENTE', 'ADMIN', 'REPARTIDOR'))
);
GO

CREATE TABLE dbo.REPARTIDOR
(
    id_repartidor INT IDENTITY(1,1) NOT NULL,
    id_user INT NOT NULL,
    estatus VARCHAR(20)

    CONSTRAINT PK_REPARTIDOR PRIMARY KEY CLUSTERED (id_repartidor),
);
GO

CREATE TABLE dbo.PRODUCTO
(
    id_producto     INT IDENTITY(1,1) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     VARCHAR(MAX) NULL,
    precio_base     DECIMAL(10,2) NOT NULL,
    activo          BIT NOT NULL CONSTRAINT DF_PRODUCTO_activo DEFAULT (1),

    CONSTRAINT PK_PRODUCTO PRIMARY KEY CLUSTERED (id_producto)
);
GO

CREATE TABLE dbo.PEDIDO
(
    id_pedido        INT IDENTITY(1,1) NOT NULL,
    id_user          INT NOT NULL,
    fecha_registro   DATETIME NOT NULL CONSTRAINT DF_PEDIDO_fecha_registro DEFAULT (GETDATE()),
    fecha_entrega    DATETIME NULL,
    total            DECIMAL(10,2) NOT NULL CONSTRAINT DF_PEDIDO_total DEFAULT (0),
    estatus          VARCHAR(20) NOT NULL CONSTRAINT DF_PEDIDO_estatus DEFAULT ('CREATED'),

    CONSTRAINT PK_PEDIDO PRIMARY KEY CLUSTERED (id_pedido),
    CONSTRAINT CHK_PEDIDO_estatus CHECK (estatus IN ('CREATED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED', 'REFUNDED'))
);
GO

CREATE TABLE dbo.DETALLE_PEDIDO
(
    id_detalle      INT IDENTITY(1,1) NOT NULL,
    id_pedido       INT NOT NULL,
    id_producto     INT NOT NULL,
    cantidad        INT NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL,

    CONSTRAINT PK_DETALLE_PEDIDO PRIMARY KEY CLUSTERED (id_detalle)
);
GO

CREATE TABLE dbo.ENTREGA
(
    id_entrega             INT IDENTITY(1,1) NOT NULL,
    id_pedido              INT NOT NULL,
    id_repartidor          INT NOT NULL,
    codigo_confirmacion    VARCHAR(6) NULL,
    confirmado             BIT NOT NULL CONSTRAINT DF_ENTREGA_confirmado DEFAULT (0),

    CONSTRAINT PK_ENTREGA PRIMARY KEY CLUSTERED (id_entrega)
);
GO

CREATE TABLE dbo.EVENT_LOG
(
    id_event          INT IDENTITY(1,1) NOT NULL,
    id_pedido         INT NOT NULL,
    estatus_anterior   VARCHAR(50) NULL,
    estatus_nuevo      VARCHAR(50) NOT NULL,
    fecha             DATETIME NOT NULL CONSTRAINT DF_EVENT_LOG_fecha DEFAULT (GETDATE()),
    descripcion       VARCHAR(255) NULL,

    CONSTRAINT PK_EVENT_LOG PRIMARY KEY CLUSTERED (id_event)
);
GO

CREATE TABLE dbo.INVENTARIO
(
    id_inventario       INT IDENTITY(1,1) NOT NULL,
    id_producto       INT NOT NULL,
    stock_disponible  INT NOT NULL CONSTRAINT DF_INVENTARIO_stock DEFAULT (0),
    stock_reservado INT NOT NULL CONSTRAINT DF_INVENTARIO_stock_reservado DEFAULT (0),

    CONSTRAINT PK_INVENTARIO PRIMARY KEY CLUSTERED (id_inventario)
);
GO

CREATE TABLE dbo.PAGO
(
    id_pago            INT IDENTITY(1,1) NOT NULL,
    id_pedido          INT NOT NULL,
    id_gateway         VARCHAR(100) NULL,
    idempotency_key    VARCHAR(100) NULL,
    event_id           VARCHAR(100) NULL,
    estatus            VARCHAR(20) NOT NULL CONSTRAINT DF_PAGO_estatus DEFAULT ('INITIATED'),
    monto              DECIMAL(10,2) NOT NULL,
    error_code         VARCHAR(50) NULL,
    error_mensaje      VARCHAR(255) NULL,
    fecha              DATETIME NOT NULL CONSTRAINT DF_PAGO_fecha DEFAULT (GETDATE()),

    CONSTRAINT PK_PAGO PRIMARY KEY CLUSTERED (id_pago),
    CONSTRAINT UQ_PAGO_id_gateway UNIQUE (id_gateway),
    CONSTRAINT UQ_PAGO_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT UQ_PAGO_event_id UNIQUE (event_id),
    CONSTRAINT CHK_PAGO_estatus CHECK (estatus IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'))
);
GO

CREATE TABLE dbo.PEDIDO_PERSONALIZADO
(
    id_pedido_personalizado INT IDENTITY(1,1) NOT NULL,
    id_detalle              INT NOT NULL,
    sabor_pan               VARCHAR(20) NOT NULL,
    relleno                 VARCHAR(20) NOT NULL,
    decoracion_especial     VARCHAR(300) NULL,
    mensaje_dedicatoria     VARCHAR(200) NULL,
    cargo_extra             DECIMAL(10,2) NOT NULL CONSTRAINT DF_PEDIDO_PERSONALIZADO_cargo_extra DEFAULT (0),

    CONSTRAINT PK_PEDIDO_PERSONALIZADO PRIMARY KEY CLUSTERED (id_pedido_personalizado),
    CONSTRAINT CHK_PP_sabor_pan CHECK (sabor_pan IN ('Vainilla', 'Chocolate', 'Zanahoria', 'Limón', 'Otro')),
    CONSTRAINT CHK_PP_relleno CHECK (relleno IN ('Crema', 'Fresa', 'Chocolate', 'Cajeta', 'Otro'))
);
GO

CREATE TABLE dbo.RESERVA_INVENTARIO
(
    id_reserva      INT IDENTITY(1,1) NOT NULL,
    id_producto     INT NOT NULL,
    cantidad        INT NOT NULL,
    id_pedido       INT NULL,
    expiracion      DATETIME NOT NULL,
    activa          BIT NOT NULL CONSTRAINT DF_RESERVA_INVENTARIO_activa DEFAULT (1),

    CONSTRAINT PK_RESERVA_INVENTARIO PRIMARY KEY CLUSTERED (id_reserva)
);
GO

/* =========================================================
   FOREIGN KEYS
   ========================================================= */

ALTER TABLE dbo.PEDIDO
ADD CONSTRAINT FK_PEDIDO_USER
FOREIGN KEY (id_user) REFERENCES dbo.USERS(id_user);
GO


ALTER TABLE dbo.DETALLE_PEDIDO
ADD CONSTRAINT FK_DETALLE_PEDIDO_PEDIDO
FOREIGN KEY (id_pedido) REFERENCES dbo.PEDIDO(id_pedido);
GO

ALTER TABLE dbo.DETALLE_PEDIDO
ADD CONSTRAINT FK_DETALLE_PEDIDO_PRODUCTO
FOREIGN KEY (id_producto) REFERENCES dbo.PRODUCTO(id_producto);
GO

ALTER TABLE dbo.ENTREGA
ADD CONSTRAINT FK_ENTREGA_PEDIDO
FOREIGN KEY (id_pedido) REFERENCES dbo.PEDIDO(id_pedido);
GO

ALTER TABLE dbo.ENTREGA
ADD CONSTRAINT FK_ENTREGA_REPARTIDOR
FOREIGN KEY (id_repartidor) REFERENCES dbo.REPARTIDOR(id_repartidor);
GO

ALTER TABLE dbo.EVENT_LOG
ADD CONSTRAINT FK_EVENT_LOG_PEDIDO
FOREIGN KEY (id_pedido) REFERENCES dbo.PEDIDO(id_pedido);
GO

ALTER TABLE dbo.INVENTARIO
ADD CONSTRAINT FK_INVENTARIO_PRODUCTO
FOREIGN KEY (id_producto) REFERENCES dbo.PRODUCTO(id_producto);
GO

ALTER TABLE dbo.PAGO
ADD CONSTRAINT FK_PAGO_PEDIDO
FOREIGN KEY (id_pedido) REFERENCES dbo.PEDIDO(id_pedido);
GO

ALTER TABLE dbo.PEDIDO_PERSONALIZADO
ADD CONSTRAINT FK_PEDIDO_PERSONALIZADO_DETALLE
FOREIGN KEY (id_detalle) REFERENCES dbo.DETALLE_PEDIDO(id_detalle);
GO

ALTER TABLE dbo.RESERVA_INVENTARIO
ADD CONSTRAINT FK_RESERVA_INVENTARIO_PEDIDO
FOREIGN KEY (id_pedido) REFERENCES dbo.PEDIDO(id_pedido);
GO

ALTER TABLE dbo.RESERVA_INVENTARIO
ADD CONSTRAINT FK_RESERVA_INVENTARIO_PRODUCTO
FOREIGN KEY (id_producto) REFERENCES dbo.PRODUCTO(id_producto);
GO

ALTER TABLE dbo.ROL
ADD CONSTRAINT FK_ROL_USER
FOREIGN KEY (id_user) REFERENCES dbo.USERS(id_user);
GO

ALTER TABLE dbo.REPARTIDOR
ADD CONSTRAINT FK_REPARTIDOR_USER
FOREIGN KEY (id_user) REFERENCES dbo.USERS(id_user);
GO
/* =========================================================
   ÍNDICES
   ========================================================= */

CREATE INDEX idx_eventlog_pedido
ON dbo.EVENT_LOG(id_pedido);
GO

CREATE INDEX idx_pago_estatus
ON dbo.PAGO(estatus);
GO

CREATE INDEX idx_pago_pedido
ON dbo.PAGO(id_pedido);
GO

CREATE INDEX idx_pedido_estatus
ON dbo.PEDIDO(estatus);
GO

CREATE INDEX idx_pedido_user
ON dbo.PEDIDO(id_user);
GO

CREATE INDEX idx_reserva_expiracion
ON dbo.RESERVA_INVENTARIO(expiracion, activa);
GO

CREATE INDEX idx_reserva_producto
ON dbo.RESERVA_INVENTARIO(id_producto, activa);
GO

CREATE INDEX idx_detalle_pedido
ON dbo.DETALLE_PEDIDO(id_pedido);
GO

CREATE INDEX idx_detalle_producto
ON dbo.DETALLE_PEDIDO(id_producto);
GO

CREATE INDEX idx_entrega_pedido
ON dbo.ENTREGA(id_pedido);
GO

CREATE INDEX idx_entrega_repartidor
ON dbo.ENTREGA(id_repartidor);
GO

CREATE INDEX idx_rol_user
ON dbo.ROL(id_user);
GO

CREATE INDEX idx_repartidor_user
ON dbo.REPARTIDOR(id_user);
GO

CREATE INDEX idx_pedido_personalizado_detalle
ON dbo.PEDIDO_PERSONALIZADO(id_detalle);
GO

CREATE UNIQUE INDEX uq_rol_user_nombre
ON dbo.ROL(id_user, nombre_rol);
GO

CREATE UNIQUE INDEX uq_repartidor_user
ON dbo.REPARTIDOR(id_user);
GO