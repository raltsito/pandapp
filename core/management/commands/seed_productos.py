from django.core.management.base import BaseCommand
from core.models import Producto, Inventario

PRODUCTOS = [
    {
        'nombre': 'Pan Cocktail',
        'descripcion': 'Nuestro clásico pan cocktail de mantequilla: una masa esponjosa y tierna rellena de coco rallado caramelizado con un toque de azúcar morena. Horneado a la perfección hasta lograr una corteza ligeramente dorada y un interior suave que derrite.',
        'precio_base': 45,
    },
    {
        'nombre': 'Pastel de Luna',
        'descripcion': 'El rey de la panadería china. Elaborado con pasta de loto cremosa y yema de huevo salada curada, envuelto en masa tierna con el tradicional patrón floral. Perfecto para compartir en el Festival de Otoño o en cualquier celebración especial.',
        'precio_base': 55,
    },
    {
        'nombre': 'Baozi de Frijol Negro',
        'descripcion': 'Suave bollo chino cocido al vapor con una textura nube que se deshace en la boca. Relleno generoso de pasta de frijol negro endulzada, con el equilibrio perfecto entre lo dulce y lo terroso. Una tradición de la dim sum china que nunca pasa de moda.',
        'precio_base': 38,
    },
    {
        'nombre': 'Tarta de Huevo',
        'descripcion': 'Inspirada en el famoso pastel de nata portugués reinterpretado al estilo chino de Hong Kong. Una base de masa hojaldrada ultra crujiente sosteniendo una natilla de huevo suave, levemente acaramelada por encima. Imprescindible con té.',
        'precio_base': 42,
    },
    {
        'nombre': 'Galleta de Almendra',
        'descripcion': 'Galleta artesanal de mantequilla con forma trenzada y textura crujiente, coronada con una almendra entera tostada y un barniz de miel dorada. Receta transmitida de generación en generación con el sello inconfundible de PanDa.',
        'precio_base': 35,
    },
    {
        'nombre': 'Wife Cake',
        'descripcion': 'El legendario Wife Cake cantonés: capas de masa hojaldrada envolviendo un relleno de semilla de invierno, azúcar y coco. Su textura quebradiza y su dulzor sutil lo convierten en uno de los dulces más queridos de la panadería china tradicional.',
        'precio_base': 48,
    },
]


class Command(BaseCommand):
    help = 'Carga los productos iniciales del menú PanDa'

    def handle(self, *args, **kwargs):
        creados = 0
        for p in PRODUCTOS:
            obj, created = Producto.objects.get_or_create(
                nombre=p['nombre'],
                defaults={'descripcion': p['descripcion'], 'precio_base': p['precio_base']},
            )
            if created:
                Inventario.objects.create(producto=obj, stock_disponible=100)
                creados += 1
                self.stdout.write(self.style.SUCCESS(f'  OK {obj.nombre}'))
            else:
                self.stdout.write(f'  · {obj.nombre} (ya existía)')
        self.stdout.write(self.style.SUCCESS(f'\n{creados} producto(s) creado(s).'))
