'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { hasActiveSubscription } from './has-active-subscription';

type ContestLimitResult = {
  canCreate: boolean;
  limit: number | null;
  currentCount: number;
};

// Free tier: 1 active contest at a time (completed contests don't count)
// Pro tier: Unlimited active contests

export async function getContestLimit(userId: string): Promise<ContestLimitResult> {
  try {
    const [isSubscribed, supabase] = await Promise.all([
      hasActiveSubscription(userId),
      createSupabaseServerClient(),
    ]);

    const { count, error } = await supabase
      .from('contests')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .in('status', ['draft', 'open', 'locked', 'in_progress']);

    if (error) {
      return { canCreate: false, limit: 1, currentCount: 0 };
    }

    const currentCount = count ?? 0;

    if (isSubscribed) {
      return { canCreate: true, limit: null, currentCount };
    }

    return {
      canCreate: currentCount < 1,
      limit: 1,
      currentCount,
    };
  } catch {
    return { canCreate: false, limit: 1, currentCount: 0 };
  }
}
