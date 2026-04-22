-- Restore full table privileges to anon and authenticated
GRANT ALL PRIVILEGES ON TABLE public.makers TO anon, authenticated;

-- Restore standard policies to only allow the owner to see/edit their data directly from 'makers'
DROP POLICY IF EXISTS "makers: public read" ON public.makers;
DROP POLICY IF EXISTS "makers: owner all" ON public.makers;
CREATE POLICY "makers: owner all" ON public.makers FOR ALL USING (auth.uid() = id);

-- Ensure public view grants are intact
CREATE OR REPLACE VIEW public.public_makers AS
SELECT id, name, trade, skills, location, province, city, township, 
       bio, hourly_rate, is_available, is_verified, identity_verified, 
       verification_tier, reliability_score, featured_until, latitude, longitude,
       updated_at, created_at
FROM public.makers;

GRANT SELECT ON public.public_makers TO anon, authenticated;

-- Notify the PostgREST cache to reload the schema
NOTIFY pgrst, 'reload schema';
