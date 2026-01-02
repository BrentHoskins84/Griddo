import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { logger } from '@/utils/logger';

export async function getUserProfile() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('users').select('*').single();

  if (error) {
    logger.error('get-user-profile', error);
  }

  return data;
}
