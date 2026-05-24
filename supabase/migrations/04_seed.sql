-- ============================================================
-- PanDa Pastelería · Datos de prueba (productos + inventario)
-- Ejecutar DESPUÉS de 01-03 en una BD limpia.
-- Para actualizar una BD existente, ejecutar 05_update_fotos.sql
-- ============================================================

-- Limpieza opcional (descomenta para reset total)
-- TRUNCATE public.inventario, public.producto RESTART IDENTITY CASCADE;

INSERT INTO public.producto (nombre, descripcion, precio_base, activo, foto_url) VALUES
  ('Pastel de Luna Tradicional',
   'Pastel de luna chino artesanal con relleno de pasta de loto y yema salada al centro. Empaque dorado.',
   85.00, TRUE, '/assets/productos/pastelLuna.jpeg'),

  ('Bao de Cerdo BBQ',
   'Pan al vapor esponjoso relleno de cerdo asado estilo cantonés con salsa hoisin.',
   45.00, TRUE, '/assets/productos/baoCerdo.png'),

  ('Tarta de Huevo Portuguesa',
   'Tartaleta crujiente de hojaldre con crema pastelera flameada al estilo Macao.',
   38.00, TRUE, '/assets/productos/tartaHuevo.png'),

  ('Pastel de Zanahoria',
   'Bizcocho de zanahoria con nuez y cubierta de queso crema. Personalizable.',
   320.00, TRUE, '/assets/productos/zanahoria.png'),

  ('Pastel de Chocolate Triple',
   'Tres capas de bizcocho de chocolate con ganache, mousse y trufas. Personalizable.',
   380.00, FALSE, NULL),

  ('Concha Tradicional',
   'Pan dulce mexicano con cubierta de azúcar en sabores vainilla o chocolate.',
   18.00, TRUE, '/assets/productos/concha.png'),

  ('Galletas de Almendra',
   'Galletas chinas crujientes de almendra, paquete de 12 piezas.',
   65.00, TRUE, '/assets/productos/galletasAlmendra.png'),

  ('Pastel de Limón',
   'Bizcocho de limón con relleno de lemon curd y merengue italiano. Personalizable.',
   340.00, TRUE, '/assets/productos/pastelLimon.png'),

  ('Roll de Canela',
   'Rollo de canela con glaseado de queso crema y nueces caramelizadas.',
   42.00, TRUE, '/assets/productos/rolCanela.png'),

  ('Pan de Dulce Surtido',
   'Caja con 6 piezas variadas: cuernitos, orejas, polvorones y empanadas.',
   120.00, FALSE, NULL),

  ('Tang Hulu (Fresa Cristalizada)',
   'Brocheta de fresas frescas bañadas en azúcar cristalizada al estilo chino tradicional.',
   35.00, TRUE, '/assets/productos/tangHulu.png'),

  ('Jian Dui (Bolitas de Ajonjolí)',
   'Bolitas fritas de masa de arroz glutinoso cubiertas de ajonjolí, rellenas de pasta de frijol dulce.',
   50.00, TRUE, '/assets/productos/jianDui.png');

-- Inventario inicial (1:1 con cada producto)
INSERT INTO public.inventario (id_producto, stock_disponible, stock_reservado)
SELECT id_producto, 50, 0
FROM public.producto
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventario i WHERE i.id_producto = producto.id_producto
);
