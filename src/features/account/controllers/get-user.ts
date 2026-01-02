import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { logger } from '@/utils/logger';

export async function getUser() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    // Auth session missing is expected for unauthenticated users
    if (error.name !== 'AuthSessionMissingError') {
      logger.error('get-user', error);
    }
    return null;
  }

  return data.user;
}
