
-- Create constituencies table
CREATE TABLE public.constituencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  constituency_name TEXT NOT NULL,
  constituency_code TEXT NOT NULL UNIQUE,
  district TEXT NOT NULL,
  division TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view constituencies"
ON public.constituencies FOR SELECT USING (true);

CREATE POLICY "Admins can manage constituencies"
ON public.constituencies FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add constituency_id to candidates table
ALTER TABLE public.candidates ADD COLUMN constituency_id UUID REFERENCES public.constituencies(id);

-- Add constituency_id and nid_number, date_of_birth, photo_url to voters
ALTER TABLE public.voters ADD COLUMN constituency_id UUID REFERENCES public.constituencies(id);
ALTER TABLE public.voters ADD COLUMN nid_number TEXT UNIQUE;
ALTER TABLE public.voters ADD COLUMN date_of_birth DATE;
ALTER TABLE public.voters ADD COLUMN photo_url TEXT;
ALTER TABLE public.voters ADD COLUMN face_template TEXT;

-- Create election_config table for lifecycle control
CREATE TABLE public.election_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.election_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view election config"
ON public.election_config FOR SELECT USING (true);

CREATE POLICY "Admins can manage election config"
ON public.election_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_election_config_updated_at
BEFORE UPDATE ON public.election_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create incidents table for dispute/complaint reporting
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID REFERENCES auth.users(id) NOT NULL,
  constituency_id UUID REFERENCES public.constituencies(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incidents"
ON public.incidents FOR SELECT
USING (auth.uid() = reported_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create incidents"
ON public.incidents FOR INSERT
WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can manage all incidents"
ON public.incidents FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit_logs table for security monitoring
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Enable realtime for votes and election_config
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.election_config;
