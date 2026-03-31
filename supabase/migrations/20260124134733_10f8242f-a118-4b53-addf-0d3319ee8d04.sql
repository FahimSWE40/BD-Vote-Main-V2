-- Step 1: Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Step 6: Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Step 7: Create voters_master table
CREATE TABLE public.voters_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    wallet_address TEXT NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 8: Enable RLS on voters_master
ALTER TABLE public.voters_master ENABLE ROW LEVEL SECURITY;

-- Step 9: RLS policies for voters_master
CREATE POLICY "Admins can manage voters"
ON public.voters_master
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can view voters"
ON public.voters_master
FOR SELECT
TO authenticated
USING (true);

-- Step 10: Trigger for updated_at on voters_master
CREATE TRIGGER update_voters_master_updated_at
BEFORE UPDATE ON public.voters_master
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 11: Create id-cards storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', false);

-- Step 12: Storage policies for id-cards bucket
CREATE POLICY "Admins can upload id cards"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'id-cards' 
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can view id cards"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'id-cards' 
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete id cards"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'id-cards' 
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
);