import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';

type Contest = Database['public']['Tables']['contests']['Row'];

export interface ContestWithCounts extends Contest {
  squares: { payment_status: string }[];
}

/**
 * Fetches all contests owned by the current user with square counts
 */
export async function listContestsForOwner(ownerId: string): Promise<ContestWithCounts[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('contests')
    .select('*, squares(payment_status)')
    .eq('owner_id', ownerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contests: ${error.message}`);
  }

  return data ?? [];
}
