-- ============================================================
-- PanDa Pastelería · Row Level Security policies
-- ============================================================
-- Reglas generales:
--   · Cliente: solo lee/edita sus propios datos (pedido, pago, entrega)
--   · Repartidor: solo lee las entregas que le fueron asignadas
--   · Admin: acceso total a todas las tablas
--   · Producto / Inventario: lectura pública; escritura solo admin
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repartidor            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedido        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrega               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pago                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_personalizado  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva_inventario    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS
-- ============================================================
CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth_id = auth.uid() OR public.is_admin());

CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- ROL
-- ============================================================
CREATE POLICY rol_select_self ON public.rol
  FOR SELECT USING (id_user = public.current_user_id() OR public.is_admin());

CREATE POLICY rol_admin_all ON public.rol
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- REPARTIDOR
-- ============================================================
CREATE POLICY repartidor_select_authenticated ON public.repartidor
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY repartidor_admin_all ON public.repartidor
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PRODUCTO · lectura pública, escritura admin
-- ============================================================
CREATE POLICY producto_select_all ON public.producto
  FOR SELECT USING (TRUE);

CREATE POLICY producto_admin_all ON public.producto
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- INVENTARIO · lectura pública, escritura admin
-- ============================================================
CREATE POLICY inventario_select_all ON public.inventario
  FOR SELECT USING (TRUE);

CREATE POLICY inventario_admin_all ON public.inventario
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PEDIDO · cliente sus pedidos, repartidor los que entrega, admin todo
-- ============================================================
CREATE POLICY pedido_select_owner ON public.pedido
  FOR SELECT USING (
    id_user = public.current_user_id()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.entrega e
      WHERE e.id_pedido = pedido.id_pedido
        AND e.id_repartidor = public.current_repartidor_id()
    )
  );

CREATE POLICY pedido_insert_owner ON public.pedido
  FOR INSERT WITH CHECK (id_user = public.current_user_id());

CREATE POLICY pedido_update_admin ON public.pedido
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY pedido_update_owner_cancel ON public.pedido
  FOR UPDATE USING (id_user = public.current_user_id())
  WITH CHECK (id_user = public.current_user_id());

-- ============================================================
-- DETALLE_PEDIDO · sigue al pedido padre
-- ============================================================
CREATE POLICY detalle_select ON public.detalle_pedido
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = detalle_pedido.id_pedido
        AND (p.id_user = public.current_user_id() OR public.is_admin())
    )
  );

CREATE POLICY detalle_insert ON public.detalle_pedido
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = detalle_pedido.id_pedido
        AND p.id_user = public.current_user_id()
    )
  );

CREATE POLICY detalle_admin_all ON public.detalle_pedido
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- ENTREGA · cliente lee la suya, repartidor la suya, admin todo
-- ============================================================
CREATE POLICY entrega_select ON public.entrega
  FOR SELECT USING (
    id_repartidor = public.current_repartidor_id()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = entrega.id_pedido
        AND p.id_user = public.current_user_id()
    )
  );

CREATE POLICY entrega_admin_all ON public.entrega
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Repartidor puede actualizar SOLO su propia entrega (validar código)
CREATE POLICY entrega_update_repartidor ON public.entrega
  FOR UPDATE USING (id_repartidor = public.current_repartidor_id())
  WITH CHECK (id_repartidor = public.current_repartidor_id());

-- ============================================================
-- EVENT_LOG · cliente lee los de sus pedidos, admin todo
-- ============================================================
CREATE POLICY event_log_select ON public.event_log
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = event_log.id_pedido
        AND (p.id_user = public.current_user_id()
             OR EXISTS (
               SELECT 1 FROM public.entrega e
               WHERE e.id_pedido = p.id_pedido
                 AND e.id_repartidor = public.current_repartidor_id()
             ))
    )
  );

CREATE POLICY event_log_insert_authenticated ON public.event_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- PAGO · cliente lee/inserta el de su pedido, admin todo
-- ============================================================
CREATE POLICY pago_select ON public.pago
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = pago.id_pedido
        AND p.id_user = public.current_user_id()
    )
  );

CREATE POLICY pago_insert_owner ON public.pago
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = pago.id_pedido
        AND p.id_user = public.current_user_id()
    )
  );

CREATE POLICY pago_admin_all ON public.pago
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PEDIDO_PERSONALIZADO · sigue al detalle padre
-- ============================================================
CREATE POLICY pp_select ON public.pedido_personalizado
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.detalle_pedido d
      JOIN public.pedido p ON p.id_pedido = d.id_pedido
      WHERE d.id_detalle = pedido_personalizado.id_detalle
        AND p.id_user = public.current_user_id()
    )
  );

CREATE POLICY pp_insert ON public.pedido_personalizado
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.detalle_pedido d
      JOIN public.pedido p ON p.id_pedido = d.id_pedido
      WHERE d.id_detalle = pedido_personalizado.id_detalle
        AND p.id_user = public.current_user_id()
    )
  );

-- ============================================================
-- RESERVA_INVENTARIO · cliente inserta la suya, admin todo
-- ============================================================
CREATE POLICY reserva_select ON public.reserva_inventario
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.pedido p
      WHERE p.id_pedido = reserva_inventario.id_pedido
        AND p.id_user = public.current_user_id()
    )
  );

CREATE POLICY reserva_insert_authenticated ON public.reserva_inventario
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY reserva_admin_all ON public.reserva_inventario
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
