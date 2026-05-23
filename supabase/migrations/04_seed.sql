-- ============================================================
-- PanDa Pastelería · Datos de prueba (productos + inventario)
-- Ejecutar DESPUÉS de 01-03. Idempotente vía ON CONFLICT.
-- ============================================================

-- Limpieza opcional (descomenta para reset total)
-- TRUNCATE public.inventario, public.producto RESTART IDENTITY CASCADE;

INSERT INTO public.producto (nombre, descripcion, precio_base, activo, foto_url) VALUES
  ('Pastel de Luna Tradicional',
   'Pastel de luna chino artesanal con relleno de pasta de loto y yema salada al centro. Empaque dorado.',
   85.00, TRUE, '/assets/mooncake.jpg'),

  ('Bao de Cerdo BBQ',
   'Pan al vapor esponjoso relleno de cerdo asado estilo cantonés con salsa hoisin.',
   45.00, TRUE, NULL),

  ('Tarta de Huevo Portuguesa',
   'Tartaleta crujiente de hojaldre con crema pastelera flameada al estilo Macao.',
   38.00, TRUE, NULL),

  ('Pastel de Zanahoria',
   'Bizcocho de zanahoria con nuez y cubierta de queso crema. Personalizable.',
   320.00, TRUE, NULL),

  ('Pastel de Chocolate Triple',
   'Tres capas de bizcocho de chocolate con ganache, mousse y trufas. Personalizable.',
   380.00, TRUE, NULL),

  ('Concha Tradicional',
   'Pan dulce mexicano con cubierta de azúcar en sabores vainilla o chocolate.',
   18.00, TRUE, NULL),

  ('Galletas de Almendra',
   'Galletas chinas crujientes de almendra, paquete de 12 piezas.',
   65.00, TRUE, NULL),

  ('Pastel de Limón',
   'Bizcocho de limón con relleno de lemon curd y merengue italiano. Personalizable.',
   340.00, TRUE, NULL),

  ('Roll de Canela',
   'Rollo de canela con glaseado de queso crema y nueces caramelizadas.',
   42.00, TRUE, NULL),

  ('Pan de Dulce Surtido',
   'Caja con 6 piezas variadas: cuernitos, orejas, polvorones y empanadas.',
   120.00, TRUE, NULL);

-- Inventario inicial (1:1 con cada producto)
INSERT INTO public.inventario (id_producto, stock_disponible, stock_reservado)
SELECT id_producto, 50, 0
FROM public.producto
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventario i WHERE i.id_producto = producto.id_producto
);
