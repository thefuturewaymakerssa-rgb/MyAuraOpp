-- Add phone column to makers table
ALTER TABLE public.makers ADD COLUMN IF NOT EXISTS phone TEXT;

-- Notify the PostgREST cache to reload the schema
NOTIFY pgrst, 'reload schema';
