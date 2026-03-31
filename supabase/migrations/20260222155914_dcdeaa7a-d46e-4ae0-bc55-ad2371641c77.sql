
-- 1. CONSTITUENCIES টেবিল
CREATE TABLE public.constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  district text NOT NULL,
  division text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view constituencies"
  ON public.constituencies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage constituencies"
  ON public.constituencies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add constituency_id FK to voters_master
ALTER TABLE public.voters_master
  ADD COLUMN constituency_id uuid REFERENCES public.constituencies(id);

-- 3. Add constituency_id FK to candidates
ALTER TABLE public.candidates
  ADD COLUMN constituency_id uuid REFERENCES public.constituencies(id);

-- 4. ELECTION_CONFIG টেবিল
CREATE TABLE public.election_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_name text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.election_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view election config"
  ON public.election_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage election config"
  ON public.election_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_election_config_updated_at
  BEFORE UPDATE ON public.election_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. VOTES টেবিল
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id_hash text NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id),
  tx_hash text UNIQUE,
  block_number bigint,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all votes"
  ON public.votes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. INCIDENTS টেবিল
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by uuid REFERENCES auth.users(id),
  constituency_id uuid REFERENCES public.constituencies(id),
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'low',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all incidents"
  ON public.incidents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can report incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
