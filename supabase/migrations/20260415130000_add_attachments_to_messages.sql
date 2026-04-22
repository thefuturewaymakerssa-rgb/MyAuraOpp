-- Migration: Add attachment support to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- 'image', 'video', 'file'

COMMENT ON COLUMN public.messages.attachment_type IS 'Type of the message attachment: image, video, or file';

-- Re-sync PostgREST schema cache
NOTIFY pgrst, 'reload schema';
