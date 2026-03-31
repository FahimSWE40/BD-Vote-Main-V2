
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS: admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'সাধারণ সম্পাদক',
  party TEXT,
  photo_url TEXT,
  manifesto TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Public read for candidates
CREATE POLICY "Anyone can view active candidates"
ON public.candidates FOR SELECT
USING (is_active = true);

-- Admins can manage candidates
CREATE POLICY "Admins can manage candidates"
ON public.candidates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create voters table
CREATE TABLE public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  session_year TEXT,
  has_voted BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view voters"
ON public.voters FOR SELECT
USING (true);

CREATE POLICY "Admins can manage voters"
ON public.voters FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES public.voters(id) NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (voter_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view votes"
ON public.votes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert votes"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
