const { createClient } = require("@supabase/supabase-js");

const url = "https://zpkjlcsylfapitwhxxhc.supabase.co";
const key = "sb_publishable_nPzKMUYQKjHlT-v4q5EGZg_IEgK01Aw";
const supabase = createClient(url, key);

async function run() {
  const { data: cases, error } = await supabase.from("cases").select("id, customer_name, created_at, tracking_id, customer_id");
  if (error) {
    console.error("Error fetching cases:", error);
    return;
  }

  console.log(`Found ${cases.length} cases.`);

  for (const c of cases) {
    if (!c.tracking_id || !c.customer_id) {
      console.log(`Backfilling IDs for case ${c.id} (${c.customer_name})`);
      
      const customerName = c.customer_name || "CUST";
      
      const trackingSlug = customerName
        .replace(/\s+/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .substring(0, 5)
        .padEnd(5, "X");
      const randomDigits5 = String(Math.floor(10000 + Math.random() * 90000));
      const trackingIdVal = `${trackingSlug}${randomDigits5}`;

      const custSlug = customerName
        .replace(/\s+/g, "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .substring(0, 2)
        .padEnd(2, "X");
      
      const createdAt = new Date(c.created_at);
      const dd = String(createdAt.getDate()).padStart(2, "0");
      const mm = String(createdAt.getMonth() + 1).padStart(2, "0");
      const yyyy = String(createdAt.getFullYear());
      const customerIdVal = `${custSlug}${dd}${mm}${yyyy}`;

      const { error: updateErr } = await supabase
        .from("cases")
        .update({
          tracking_id: c.tracking_id || trackingIdVal,
          customer_id: c.customer_id || customerIdVal,
        })
        .eq("id", c.id);

      if (updateErr) {
        console.error(`Error updating case ${c.id}:`, updateErr);
      } else {
        console.log(`Updated case ${c.id} successfully.`);
      }
    }
  }
  console.log("Done.");
}

run();
