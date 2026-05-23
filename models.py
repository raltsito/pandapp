from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)

    telefono = models.CharField(max_length=20, blank=True, null=True)
    calle = models.CharField(max_length=100, blank=True, null=True)
    colonia = models.CharField(max_length=100, blank=True, null=True)
    cp = models.CharField(max_length=10, blank=True, null=True)
    num_casa = models.CharField(max_length=20, blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "USERS"


class Rol(models.Model):
    CLIENTE = "CLIENTE"
    ADMIN = "ADMIN"
    REPARTIDOR = "REPARTIDOR"

    ROLES = [
        (CLIENTE, "Cliente"),
        (ADMIN, "Administrador"),
        (REPARTIDOR, "Repartidor"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rol"
    )
    nombre_rol = models.CharField(max_length=20, choices=ROLES, default=CLIENTE)

    class Meta:
        db_table = "ROL"


class Producto(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "PRODUCTO"


class Inventario(models.Model):
    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        related_name="inventario"
    )
    stock_disponible = models.IntegerField(default=0)
    stock_reservado = models.IntegerField(default=0)

    class Meta:
        db_table = "INVENTARIO"


class Pedido(models.Model):
    ESTATUS = [
        ("CREATED", "Creado"),
        ("PREPARING", "En preparación"),
        ("ON_ROUTE", "En camino"),
        ("DELIVERED", "Entregado"),
        ("CANCELLED", "Cancelado"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pedidos"
    )
    fecha_registro = models.DateTimeField(default=timezone.now)
    fecha_entrega = models.DateTimeField(blank=True, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    estatus = models.CharField(max_length=20, choices=ESTATUS, default="CREATED")

    class Meta:
        db_table = "PEDIDO"


class DetallePedido(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="detalles"
    )
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "DETALLE_PEDIDO"


class PedidoPersonalizado(models.Model):
    detalle = models.OneToOneField(
        DetallePedido,
        on_delete=models.CASCADE,
        related_name="personalizacion"
    )
    sabor_pan = models.CharField(max_length=50)
    relleno = models.CharField(max_length=50)
    decoracion_especial = models.CharField(max_length=300, blank=True, null=True)
    mensaje_dedicatoria = models.CharField(max_length=200, blank=True, null=True)
    cargo_extra = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = "PEDIDO_PERSONALIZADO"


class Pago(models.Model):
    ESTATUS = [
        ("INITIATED", "Iniciado"),
        ("PENDING", "Pendiente"),
        ("PAID", "Pagado"),
        ("FAILED", "Fallido"),
        ("REFUNDED", "Reembolsado"),
    ]

    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="pagos"
    )

    id_gateway = models.CharField(max_length=100, unique=True, blank=True, null=True)
    idempotency_key = models.CharField(max_length=100, unique=True, blank=True, null=True)
    event_id = models.CharField(max_length=100, unique=True, blank=True, null=True)

    estatus = models.CharField(max_length=20, choices=ESTATUS, default="INITIATED")
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    error_code = models.CharField(max_length=50, blank=True, null=True)
    error_mensaje = models.CharField(max_length=255, blank=True, null=True)

    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "PAGO"


class ReservaInventario(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True)

    expiracion = models.DateTimeField()
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "RESERVA_INVENTARIO"


class Repartidor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="repartidor"
    )
    estatus = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "REPARTIDOR"


class Entrega(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="entregas"
    )
    repartidor = models.ForeignKey(Repartidor, on_delete=models.PROTECT)

    codigo_confirmacion = models.CharField(max_length=6, blank=True, null=True)
    confirmado = models.BooleanField(default=False)

    class Meta:
        db_table = "ENTREGA"


class EventLog(models.Model):
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="eventos"
    )
    estatus_anterior = models.CharField(max_length=50, blank=True, null=True)
    estatus_nuevo = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "EVENT_LOG"