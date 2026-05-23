import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { UsuariosClient } from './UsuariosClient';

export default async function AdminUsuariosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const supabase = await createClient();

  const [usuariosRes, repartidoresRes] = await Promise.all([
    supabase.from('users').select('id_user, nombre, email, telefono, calle, colonia, num_casa, fecha_registro, rol(nombre_rol)').order('id_user'),
    supabase.from('repartidor').select('id_user'),
  ]);

  type UserRow = {
    id_user: number; nombre: string; email: string;
    telefono: string | null; calle: string; colonia: string; num_casa: number;
    fecha_registro: string;
    rol: { nombre_rol: string }[] | { nombre_rol: string } | null;
  };

  const repartidorIds = new Set((repartidoresRes.data ?? []).map(r => r.id_user));
  const usuarios = (usuariosRes.data ?? [] as UserRow[]).map((u: UserRow) => {
    const roles = Array.isArray(u.rol) ? u.rol : (u.rol ? [u.rol] : []);
    return {
      id_user:        u.id_user,
      nombre:         u.nombre,
      email:          u.email,
      telefono:       u.telefono,
      calle:          u.calle,
      colonia:        u.colonia,
      num_casa:       u.num_casa,
      fecha_registro: u.fecha_registro,
      roles:          roles.map(r => r.nombre_rol),
      es_repartidor:  repartidorIds.has(u.id_user),
    };
  });

  return <UsuariosClient usuarios={usuarios} />;
}
