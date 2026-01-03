-- Create a function to soft delete contests
-- This bypasses RLS for the UPDATE but still checks ownership
CREATE OR REPLACE FUNCTION soft_delete_contest(contest_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  contest_owner_id UUID;
BEGIN
  -- Get the contest and verify ownership
  SELECT owner_id INTO contest_owner_id
  FROM contests
  WHERE id = contest_id AND deleted_at IS NULL;
  
  -- If not found or doesn't belong to user, return false
  IF contest_owner_id IS NULL OR contest_owner_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- Perform the soft delete (this bypasses RLS due to SECURITY DEFINER)
  UPDATE contests
  SET deleted_at = NOW()
  WHERE id = contest_id AND owner_id = auth.uid();
  
  RETURN TRUE;
END;
$$;