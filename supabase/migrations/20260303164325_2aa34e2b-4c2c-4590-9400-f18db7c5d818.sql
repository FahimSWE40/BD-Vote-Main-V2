
-- Fix permissive INSERT policy on votes
DROP POLICY IF EXISTS "Authenticated can insert votes" ON public.votes;
CREATE POLICY "Authenticated can insert votes"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.voters v
    WHERE v.id = votes.voter_id AND v.has_voted = false
  )
);
