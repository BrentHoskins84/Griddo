-- Fix UPDATE RLS policy to allow soft deletes
-- The USING clause prevents updating already-deleted contests
-- The WITH CHECK clause ensures ownership is maintained after update

DROP POLICY IF EXISTS "Users can update their own contests" ON contests;

CREATE POLICY "Users can update their own contests"
  ON contests FOR UPDATE
  USING (auth.uid() = owner_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = owner_id);

