
-- Add the missing trigger (candidates already had one too, so use IF NOT EXISTS pattern)
CREATE OR REPLACE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
