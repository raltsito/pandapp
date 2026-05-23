-- ============================================================
-- PanDa Pastelería · Funciones helper + trigger de signup
-- ============================================================

-- Devuelve el id_user de la tabla public.users para el usuario autenticado actual.
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS INT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id_user FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- Verifica si el usuario autenticado tiene rol ADMIN.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rol r
    JOIN public.users u ON u.id_user = r.id_user
    WHERE u.auth_id = auth.uid() AND r.nombre_rol = 'ADMIN'
  );
$$;

-- Verifica si el usuario autenticado tiene rol REPARTIDOR.
CREATE OR REPLACE FUNCTION public.is_repartidor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rol r
    JOIN public.users u ON u.id_user = r.id_user
    WHERE u.auth_id = auth.uid() AND r.nombre_rol = 'REPARTIDOR'
  );
$$;

-- Devuelve id_repartidor del usuario autenticado (NULL si no es repartidor).
CREATE OR REPLACE FUNCTION public.current_repartidor_id()
RETURNS INT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id_repartidor
  FROM public.repartidor r
  JOIN public.users u ON u.id_user = r.id_user
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- TRIGGER: al crear usuario en auth.users → crear fila en public.users + asignar rol CLIENTE
-- ============================================================
-- El frontend al hacer signUp pasa los datos extra como raw_user_meta_data:
--   { nombre, telefono, calle, colonia, num_casa }
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_user INT;
BEGIN
  INSERT INTO public.users (auth_id, nombre, telefono, email, calle, colonia, num_casa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    NEW.raw_user_meta_data->>'telefono',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'calle', ''),
    COALESCE(NEW.raw_user_meta_data->>'colonia', ''),
    COALESCE((NEW.raw_user_meta_data->>'num_casa')::INT, 0)
  )
  RETURNING id_user INTO v_id_user;

  INSERT INTO public.rol (id_user, nombre_rol) VALUES (v_id_user, 'CLIENTE');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: registrar evento en EVENT_LOG (usado al cambiar estatus de pedido)
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_pedido_evento(
  p_id_pedido         INT,
  p_estatus_anterior  VARCHAR(50),
  p_estatus_nuevo     VARCHAR(50),
  p_descripcion       VARCHAR(255)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.event_log (id_pedido, estatus_anterior, estatus_nuevo, descripcion)
  VALUES (p_id_pedido, p_estatus_anterior, p_estatus_nuevo, p_descripcion);
END;
$$;
