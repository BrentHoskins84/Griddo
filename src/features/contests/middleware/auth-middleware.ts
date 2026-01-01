import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';

export class AuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new AuthError('You must be logged in');
  }

  return { user: data.user, supabase };
}

export async function requireContestOwnership(
  supabase: SupabaseClient<Database>,
  userId: string,
  contestId: string
) {
  const { data: contest, error } = await supabase
    .from('contests')
    .select('id, owner_id')
    .eq('id', contestId)
    .single();

  if (error || !contest) {
    throw new NotFoundError('Contest not found');
  }

  if (contest.owner_id !== userId) {
    throw new ForbiddenError('You do not own this contest');
  }

  return contest;
}

export function withContestOwnership<T>(
  contestId: string,
  action: (
    user: User,
    supabase: SupabaseClient<Database>,
    contest: { id: string; owner_id: string }
  ) => Promise<T>
): () => Promise<ActionResponse<T>> {
  return async () => {
    try {
      const { user, supabase } = await requireAuth();
      const contest = await requireContestOwnership(supabase, user.id, contestId);
      const result = await action(user, supabase, contest);
      return { data: result, error: null };
    } catch (error) {
      if (
        error instanceof AuthError ||
        error instanceof NotFoundError ||
        error instanceof ForbiddenError
      ) {
        return { data: null, error: { message: error.message } };
      }
      console.error(error);
      return { data: null, error: { message: 'An unexpected error occurred' } };
    }
  };
}

export async function requireContestOwnershipForUpload(
  contestId: string
): Promise<{ user: User; supabase: SupabaseClient<Database> } | { error: string }> {
  try {
    const { user, supabase } = await requireAuth();
    await requireContestOwnership(supabase, user.id, contestId);
    return { user, supabase };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'You must be logged in' };
    }
    if (error instanceof NotFoundError) {
      return { error: 'Contest not found' };
    }
    if (error instanceof ForbiddenError) {
      return { error: 'You do not own this contest' };
    }
    return { error: 'An unexpected error occurred' };
  }
}