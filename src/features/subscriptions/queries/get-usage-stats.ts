'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getUsageStats(userId: string): Promise<{
  activeContests: number;
  totalContests: number;
}> {
  try {
    const supabase = await createSupabaseServerClient();

    const [activeResult, totalResult] = await Promise.all([
      supabase
        .from('contests')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .in('status', ['draft', 'open', 'locked', 'in_progress']),
      supabase
        .from('contests')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .is('deleted_at', null),
    ]);

    return {
      activeContests: activeResult.count ?? 0,
      totalContests: totalResult.count ?? 0,
    };
  } catch {
    return {
      activeContests: 0,
      totalContests: 0,
    };
  }
}

