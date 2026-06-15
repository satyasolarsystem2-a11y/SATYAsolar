import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zpkjlcsylfapitwhxxhc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_nPzKMUYQKjHlT-v4q5EGZg_IEgK01Aw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin@satyasolar.com';
  const password = 'SatyaAdmin@2026';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Super Admin',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('USER_ID=' + data.user.id);
  console.log('EMAIL=' + email);
  console.log('PASSWORD=' + password);
}

createAdmin();
