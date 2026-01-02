import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { logger } from '@/utils/logger';

export async function getSubscription() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error) {
    logger.error('get-subscription', error);
  }

  return data;
}
