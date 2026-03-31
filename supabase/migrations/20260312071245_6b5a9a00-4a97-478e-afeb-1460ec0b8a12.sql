
-- Add blockchain-related columns to votes table
ALTER TABLE public.votes 
ADD COLUMN IF NOT EXISTS tx_hash text,
ADD COLUMN IF NOT EXISTS voter_id_hash text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS encrypted_vote text;

-- Create index on tx_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_votes_tx_hash ON public.votes(tx_hash);
CREATE INDEX IF NOT EXISTS idx_votes_status ON public.votes(status);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id_hash ON public.votes(voter_id_hash);
