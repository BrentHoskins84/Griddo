import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type Contest = Database['public']['Tables']['contests']['Row'];

/**
 * Fetches a contest by ID (for dashboard/owner views)
 */
export async function getContestById(contestId: string): Promise<Contest | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('contests').select('*').eq('id', contestId).single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Fetches only the access_pin for PIN verification
 */
export async function getContestPin(slug: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('contests').select('access_pin').eq('slug', slug).single();

  if (error || !data) {
    return null;
  }

  return data.access_pin;
}
