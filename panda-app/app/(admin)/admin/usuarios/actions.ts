'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function crearUsuario(form: {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  calle: string;
  colonia: string;
  num_casa: number;
  rol: string;
}): Promise<{ error?: string }> {
  const supabase = adminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email:          form.email.toLowerCase().trim(),
    password:       form.password,
    email_confirm:  true,
    user_metadata: {
      nombre:   form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      calle:    form.calle.trim(),
      colonia:  form.colonia.trim(),
      num_casa: form.num_casa,
    },
  });

  if (error || !data.user) return { error: error?.message ?? 'No se pudo crear el usuario.' };

  // Esperar a que el trigger handle_new_user cree el registro en users
  await new Promise(r => setTimeout(r, 800));

  // Si el rol no es CLIENTE, añadirlo (el trigger ya inserta CLIENTE)
  if (form.rol !== 'CLIENTE') {
    const { data: userData } = await supabase
      .from('users')
      .select('id_user')
      .eq('auth_id', data.user.id)
      .single();

    if (userData) {
      await supabase.from('rol').insert({ id_user: userData.id_user, nombre_rol: form.rol });
      if (form.rol === 'REPARTIDOR') {
        await supabase.from('repartidor').insert({ id_user: userData.id_user, estatus: 'activo' });
      }
    }
  }

  revalidatePath('/admin/usuarios');
  return {};
}

export async function actualizarUsuario(
  idUser: number,
  data: { nombre: string; telefono: string; calle: string; colonia: string; num_casa: number },
): Promise<{ error?: string }> {
  const supabase = adminClient();
  const { error } = await supabase
    .from('users')
    .update({
      nombre:   data.nombre.trim(),
      telefono: data.telefono.trim() || null,
      calle:    data.calle.trim(),
      colonia:  data.colonia.trim(),
      num_casa: data.num_casa,
    })
    .eq('id_user', idUser);

  revalidatePath('/admin/usuarios');
  return error ? { error: 'Error al actualizar.' } : {};
}

export async function cambiarRolUsuario(
  idUser: number,
  _rolesActuales: string[],
  nuevoRol: string,
): Promise<{ error?: string }> {
  const supabase = adminClient();

  // Eliminar TODOS los roles actuales
  await supabase.from('rol').delete().eq('id_user', idUser);

  // Insertar únicamente el nuevo rol
  const { error } = await supabase.from('rol').insert({ id_user: idUser, nombre_rol: nuevoRol });
  if (error) return { error: 'Error al asignar rol.' };

  if (nuevoRol === 'REPARTIDOR') {
    await supabase.from('repartidor').upsert({ id_user: idUser, estatus: 'activo' }, { onConflict: 'id_user' });
  }

  revalidatePath('/admin/usuarios');
  return {};
}
