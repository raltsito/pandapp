from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Rol, Producto, Inventario,
    Pedido, DetallePedido, Pago, Repartidor, Entrega, EventLog,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Datos PanDa', {'fields': ('telefono', 'calle', 'colonia', 'cp', 'num_casa')}),
    )
    list_display = ('email', 'first_name', 'last_name', 'is_staff')


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('user', 'nombre_rol')


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio_base', 'activo')
    list_editable = ('activo',)


@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = ('producto', 'stock_disponible', 'stock_reservado')


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'estatus', 'total', 'fecha_registro')
    list_filter = ('estatus',)


admin.site.register(DetallePedido)
admin.site.register(Pago)
admin.site.register(Repartidor)
admin.site.register(Entrega)
admin.site.register(EventLog)
