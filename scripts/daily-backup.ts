import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ShapaCV Automated Daily Backup Script 🗄️🛡️
// Ensures a ruthless audit trail for SARS and POPIA compliance.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables. Check .env.local");
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY missing. Using ANON_KEY (Backup may be incomplete due to RLS).");
}


const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = ["profiles", "makers", "public_makers", "wallets", "transactions", "contracts", "consent_logs"];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups", timestamp);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }



  for (const table of TABLES) {
    const { data, error, count } = await supabase.from(table).select("*", { count: 'exact' });
    
    if (error) {
      console.error(`❌ Failed to export ${table}:`, error.message);
      continue;
    }

    const rowCount = data?.length || 0;


    fs.writeFileSync(
      path.join(backupDir, `${table}.json`),
      JSON.stringify(data, null, 2)
    );
  }


  process.exit(0);
}

runBackup().catch(console.error);
