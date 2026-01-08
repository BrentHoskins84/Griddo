import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type Contest = Database['public']['Tables']['contests']['Row'];
type PublicContest = Omit<Contest, 'access_pin'>;

/**
 * Fetches a contest for public viewing (excludes sensitive fields like access_pin)
 */
export async function getPublicContestBySlug(slug: string): Promise<PublicContest | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  // Remove private fields
  const { access_pin, ...publicData } = data;
  return publicData;
}

/**
 * Fetches a contest for owner viewing (includes all fields)
 */
export async function getOwnerContestById(contestId: string, userId: string): Promise<Contest | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .eq('owner_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}