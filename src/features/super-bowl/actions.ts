'use server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { logger } from '@/utils/logger';

// =============================================================================
// Auth helper - ensure user is authenticated
// =============================================================================

async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Authentication required');
  return data.user;
}

// =============================================================================
// Toggle score checking on/off
// =============================================================================

export async function toggleScoreChecking(enabled: boolean): Promise<ActionResponse<{ enabled: boolean }>> {
  try {
    await requireAuth();

    const { error } = await supabaseAdminClient
      .from('super_bowl_config')
      .update({ enabled })
      .not('id', 'is', null); // Update all rows (there's only one)

    if (error) throw error;

    return { data: { enabled }, error: null };
  } catch (error) {
    logger.error('toggleScoreChecking', error);
    return { data: null, error: { message: 'Failed to toggle score checking' } };
  }
}

// =============================================================================
// Get current config
// =============================================================================

export async function getSuperBowlConfig() {
  try {
    await requireAuth();

    const { data, error } = await supabaseAdminClient
      .from('super_bowl_config')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('getSuperBowlConfig', error);
    return null;
  }
}

// =============================================================================
// Get processing logs
// =============================================================================

export async function getProcessingLogs(limit = 50) {
  try {
    await requireAuth();

    const { data, error } = await supabaseAdminClient
      .from('super_bowl_processing_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('getProcessingLogs', error);
    return [];
  }
}

// =============================================================================
// Get quarter results for all contests
// =============================================================================

export async function getQuarterResults() {
  try {
    await requireAuth();

    const { data, error } = await supabaseAdminClient
      .from('super_bowl_quarter_results')
      .select('*, contests(name)')
      .order('processed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('getQuarterResults', error);
    return [];
  }
}

// =============================================================================
// Manually trigger score check
// =============================================================================

export async function triggerScoreCheck(
  quarter?: string,
  force = false
): Promise<ActionResponse<{ status: string }>> {
  try {
    await requireAuth();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return { data: null, error: { message: 'Missing Supabase configuration' } };
    }

    // Invoke the edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/check-super-bowl-scores`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quarter, force }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: result.error || 'Edge function failed' } };
    }

    return { data: { status: result.status || 'triggered' }, error: null };
  } catch (error) {
    logger.error('triggerScoreCheck', error);
    return { data: null, error: { message: 'Failed to trigger score check' } };
  }
}

// =============================================================================
// Resend emails for a quarter result
// =============================================================================

export async function resendQuarterEmails(
  resultId: string
): Promise<ActionResponse<{ status: string }>> {
  try {
    await requireAuth();

    // Reset email flags so next processing attempt resends
    const { error } = await supabaseAdminClient
      .from('super_bowl_quarter_results')
      .update({
        winner_email_sent: false,
        owner_email_sent: false,
        winner_email_sent_at: null,
        owner_email_sent_at: null,
      })
      .eq('id', resultId);

    if (error) throw error;

    // Trigger a force re-process
    const triggerResult = await triggerScoreCheck(undefined, true);
    if (!triggerResult || triggerResult.error) {
      return { data: null, error: triggerResult?.error ?? { message: 'Trigger failed' } };
    }

    return { data: { status: 'resent' }, error: null };
  } catch (error) {
    logger.error('resendQuarterEmails', error);
    return { data: null, error: { message: 'Failed to resend emails' } };
  }
}

// =============================================================================
// Get Super Bowl contests count
// =============================================================================

export async function getSuperBowlContests() {
  try {
    await requireAuth();

    const { data, error } = await supabaseAdminClient
      .from('contests')
      .select('id, name, status, slug, owner_id, is_super_bowl')
      .eq('is_super_bowl', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('getSuperBowlContests', error);
    return [];
  }
}
