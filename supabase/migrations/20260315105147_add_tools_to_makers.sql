ALTER TABLE public.makers ADD COLUMN IF NOT EXISTS recommended_tools jsonb DEFAULT '[]'::jsonb;
