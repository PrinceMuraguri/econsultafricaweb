
ALTER TABLE public.user_profiles
  ALTER COLUMN display_handle SET DEFAULT public.generate_display_handle();
