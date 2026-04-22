-- Migration to fix missing columns in profiles table
-- Note: 'gender' is a new field collected in onboarding, it does not exist in the legacy 'makers' table.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Migrate ONLY 'bio' data from makers to profiles (as 'gender' didn't exist in makers)
UPDATE profiles p
SET 
  bio = m.bio
FROM makers m
WHERE p.id = m.id;
