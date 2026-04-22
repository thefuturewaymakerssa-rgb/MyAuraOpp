-- Final Production Hardening: Row Level Security (RLS) Migration
-- Target: profiles, jobs, contracts

-- 1. PROFILES Table Hardening
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (Public Discovery)
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (Onboarding)
CREATE POLICY "Users can insert their own profiles"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. JOBS Table Hardening
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs are public (Discovery)
CREATE POLICY "Jobs are viewable by everyone"
ON public.jobs FOR SELECT
USING (true);

-- Only authenticated users (Employers) can post jobs
CREATE POLICY "Authenticated users can post jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employer_id);

-- Only the employer who posted the job can update it
CREATE POLICY "Employers can update their own jobs"
ON public.jobs FOR UPDATE
USING (auth.uid() = employer_id)
WITH CHECK (auth.uid() = employer_id);

-- 3. CONTRACTS Table Hardening (Critical Financial Data)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Only involved parties (Maker or Employer) can see their contracts
CREATE POLICY "Involved parties can view contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = maker_id OR auth.uid() = employer_id);

-- Only the employer can initiate a contract
CREATE POLICY "Employers can initiate contracts"
ON public.contracts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employer_id);

-- Involved parties can update status (Confirm Completion / Release Bag)
CREATE POLICY "Involved parties can update contracts"
ON public.contracts FOR UPDATE
USING (auth.uid() = maker_id OR auth.uid() = employer_id);

-- Re-sync schema cache
NOTIFY pgrst, 'reload schema';
