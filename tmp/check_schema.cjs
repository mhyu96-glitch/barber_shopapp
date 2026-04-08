
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://lottgkrtjwbyhxtjjkge.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdHRna3J0andieWh4dGpqa2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTQ2MTUsImV4cCI6MjA5MDA5MDYxNX0._675IGU-TOakpqrX0P3OCB68Ef0xY4jVdl_bRIaRuzw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('shops').select('*').limit(1);
  if (error) {
    console.error('Error fetching shops:', error);
    return;
  }
  if (data && data[0]) {
    console.log('Columns in shops table:', Object.keys(data[0]));
    console.log('Sample data:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No shops found.');
  }

  const { data: plans, error: pError } = await supabase.from('subscription_plans').select('*').order('price', { ascending: true });
  if (pError) {
    console.error('Error fetching plans:', pError);
  } else {
    console.log('All Subscription Plans:');
    plans.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id}): Features:`, p.features);
    });
  }
}

check();
