import { createClient } from "@supabase/supabase-js";

// ShapaCV Seeding Script — Populater 🚀🇿🇦
// Use this to verify the Discovery Feed and RLS policies.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {


  // Note: This requires real User IDs if you want profiles to link.
  // For RLS testing, we can insert dummy data if RLS is bypassed via Service Role,
  // or use the current user's ID for testing.


  process.exit(0);
}

seed().catch(console.error);
