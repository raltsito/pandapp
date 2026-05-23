import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CheckoutClient } from './CheckoutClient';

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'CLIENTE') redirect('/login');

  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from('users')
    .select('calle, colonia, num_casa, telefono, nombre')
    .eq('id_user', user.idUser)
    .single();

  return (
    <CheckoutClient
      idUser={user.idUser}
      nombre={perfil?.nombre ?? user.nombre}
      direccion={{
        calle:    perfil?.calle    ?? '',
        colonia:  perfil?.colonia  ?? '',
        num_casa: perfil?.num_casa ?? 0,
      }}
    />
  );
}
