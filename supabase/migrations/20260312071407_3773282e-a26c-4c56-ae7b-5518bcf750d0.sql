
-- Create a safe increment function for candidate vote count
CREATE OR REPLACE FUNCTION public.increment_vote_count(p_candidate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.candidates
  SET vote_count = vote_count + 1,
      updated_at = now()
  WHERE id = p_candidate_id;
END;
$$;
