import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getUser() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    // Auth session missing is expected for unauthenticated users
    if (error.name !== 'AuthSessionMissingError') {
      console.error(error);
    }
    return null;
  }

  return data.user;
}
