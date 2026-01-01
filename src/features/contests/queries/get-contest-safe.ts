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
    .select('id, code, slug, name, description, sport_type, row_team_name, col_team_name, square_price, max_squares_per_person, row_numbers, col_numbers, numbers_auto_generated, payout_q1_percent, payout_q2_percent, payout_q3_percent, payout_final_percent, payout_game1_percent, payout_game2_percent, payout_game3_percent, payout_game4_percent, payout_game5_percent, payout_game6_percent, payout_game7_percent, hero_image_url, org_image_url, primary_color, secondary_color, status, is_public, owner_id, created_at, updated_at, deleted_at')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  if (error) {
    return null;
  }

  return data;
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