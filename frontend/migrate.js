require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Migrating cases...");
  const { data: casesData, error: casesError } = await supabase
    .from('cases')
    .update({ current_stage: 'Registration: Document Verification' })
    .in('current_stage', ['Registration Pending', 'Registration Approved']);
  
  if (casesError) console.error("Error updating cases:", casesError);
  else console.log("Cases migrated successfully.");

  console.log("Migrating history...");
  const { data: histData, error: histError } = await supabase
    .from('case_history')
    .update({ stage: 'Registration: Document Verification' })
    .in('stage', ['Registration Pending', 'Registration Approved']);

  if (histError) console.error("Error updating history:", histError);
  else console.log("History migrated successfully.");
}

migrate();
