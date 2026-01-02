import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { logger } from '@/utils/logger';

export async function getUserProfile(): Promise<Database['public']['Tables']['users']['Row'] | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('users').select('*').single();

  if (error) {
    logger.error('get-user-profile', error);
  }

  return data;
}
