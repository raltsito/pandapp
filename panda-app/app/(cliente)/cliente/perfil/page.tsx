import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PerfilClient } from './PerfilClient';

export default async function PerfilPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from('users')
    .select('nombre, telefono, email, calle, colonia, num_casa')
    .eq('id_user', user.idUser)
    .single();

  if (!perfil) redirect('/login');

  return <PerfilClient idUser={user.idUser} perfil={perfil} />;
}
