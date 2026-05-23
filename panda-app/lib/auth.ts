import { createClient } from "@/lib/supabase/server";

export type AppRole = "CLIENTE" | "ADMIN" | "REPARTIDOR";

export interface SessionUser {
  authId: string;
  email: string;
  idUser: number;
  role: AppRole;
  nombre: string;
}

/**
 * Obtiene el usuario autenticado + su rol y datos de public.users.
 * Devuelve null si no hay sesión.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id_user, nombre, email, rol(nombre_rol)")
    .eq("auth_id", user.id)
    .single();

  if (error || !data) return null;

  const rolArray = (data.rol as { nombre_rol: AppRole }[] | null) ?? [];
  const PRIORITY: AppRole[] = ["ADMIN", "REPARTIDOR", "CLIENTE"];
  const role = PRIORITY.find(r => rolArray.some(row => row.nombre_rol === r)) ?? "CLIENTE";

  return {
    authId: user.id,
    email: data.email,
    idUser: data.id_user,
    nombre: data.nombre,
    role,
  };
}
