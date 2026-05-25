-- ============================================================
-- PanDa Pastelería · Actualizar fotos y agregar productos nuevos
-- Ejecutar contra una BD existente que ya tiene 04_seed.sql
-- ============================================================

-- Deshabilitar productos sin foto
UPDATE public.producto SET activo = FALSE WHERE nombre = 'Pastel de Chocolate Triple';
UPDATE public.producto SET activo = FALSE WHERE nombre = 'Pan de Dulce Surtido';

-- Actualizar foto_url de productos existentes
UPDATE public.producto SET foto_url = '/assets/productos/pastelLuna.png'    WHERE nombre = 'Pastel de Luna Tradicional';
UPDATE public.producto SET foto_url = '/assets/productos/baoCerdo.png'      WHERE nombre = 'Bao de Cerdo BBQ';
UPDATE public.producto SET foto_url = '/assets/productos/tartaHuevo.png'   WHERE nombre = 'Tarta de Huevo Portuguesa';
UPDATE public.producto SET foto_url = '/assets/productos/zanahoria.png'     WHERE nombre = 'Pastel de Zanahoria';
UPDATE public.producto SET foto_url = '/assets/productos/concha.png'        WHERE nombre = 'Concha Tradicional';
UPDATE public.producto SET foto_url = '/assets/productos/galletasAlmendra.png' WHERE nombre = 'Galletas de Almendra';
UPDATE public.producto SET foto_url = '/assets/productos/pastelLimon.png'   WHERE nombre = 'Pastel de Limón';
UPDATE public.producto SET foto_url = '/assets/productos/rolCanela.png'     WHERE nombre = 'Roll de Canela';

-- Insertar productos nuevos (solo si no existen)
INSERT INTO public.producto (nombre, descripcion, precio_base, activo, foto_url)
SELECT 'Tang Hulu (Fresa Cristalizada)',
       'Brocheta de fresas frescas bañadas en azúcar cristalizada al estilo chino tradicional.',
       35.00, TRUE, '/assets/productos/tangHulu.png'
WHERE NOT EXISTS (SELECT 1 FROM public.producto WHERE nombre = 'Tang Hulu (Fresa Cristalizada)');

INSERT INTO public.producto (nombre, descripcion, precio_base, activo, foto_url)
SELECT 'Jian Dui (Bolitas de Ajonjolí)',
       'Bolitas fritas de masa de arroz glutinoso cubiertas de ajonjolí, rellenas de pasta de frijol dulce.',
       50.00, TRUE, '/assets/productos/jianDui.png'
WHERE NOT EXISTS (SELECT 1 FROM public.producto WHERE nombre = 'Jian Dui (Bolitas de Ajonjolí)');

-- Inventario para productos nuevos
INSERT INTO public.inventario (id_producto, stock_disponible, stock_reservado)
SELECT id_producto, 50, 0
FROM public.producto
WHERE nombre IN ('Tang Hulu (Fresa Cristalizada)', 'Jian Dui (Bolitas de Ajonjolí)')
  AND NOT EXISTS (
    SELECT 1 FROM public.inventario i WHERE i.id_producto = producto.id_producto
  );
