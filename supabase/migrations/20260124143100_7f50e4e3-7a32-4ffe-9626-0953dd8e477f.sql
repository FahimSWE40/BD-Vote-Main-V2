-- Create candidates table for election management
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  position text NOT NULL,
  party text,
  photo_url text,
  bio text,
  vote_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Everyone can view active candidates
CREATE POLICY "Anyone can view active candidates"
ON public.candidates
FOR SELECT
USING (is_active = true);

-- Admins can manage all candidates
CREATE POLICY "Admins can manage candidates"
ON public.candidates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload candidate photos
CREATE POLICY "Admins can upload candidate photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update candidate photos
CREATE POLICY "Admins can update candidate photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'candidate-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete candidate photos
CREATE POLICY "Admins can delete candidate photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'candidate-photos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Anyone can view candidate photos (public bucket)
CREATE POLICY "Anyone can view candidate photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'candidate-photos');