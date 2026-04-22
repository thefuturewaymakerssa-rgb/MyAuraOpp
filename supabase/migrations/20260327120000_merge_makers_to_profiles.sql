-- 1. Add all makers columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS township TEXT,
ADD COLUMN IF NOT EXISTS trade TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS reliability_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS id_selfie TEXT;

-- 2. Migrate data from makers to profiles
UPDATE profiles p
SET
 phone = m.phone,
 dob = m.dob,
 location = m.location,
 province = m.province,
 city = m.city,
 township = m.township,
 trade = m.trade,
 skills = m.skills,
 hourly_rate = m.hourly_rate,
 is_available = m.is_available,
 is_verified = m.is_verified,
 identity_verified = m.identity_verified,
 onboarded = m.onboarded,
 verification_tier = m.verification_tier,
 reliability_score = m.reliability_score,
 featured_until = m.featured_until,
 latitude = m.latitude,
 longitude = m.longitude,
 id_selfie = m.id_selfie
FROM makers m
WHERE p.id = m.id;

-- 3. Drop makers table and replace references (To be done manually once codebase is verified)
-- DROP TABLE IF EXISTS makers;
