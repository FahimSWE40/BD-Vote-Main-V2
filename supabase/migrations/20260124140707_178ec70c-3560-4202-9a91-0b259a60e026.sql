-- Insert admin role for the user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('8312f232-20a6-46a0-b07b-2bb90885e286', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;