import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lottgkrtjwbyhxtjjkge.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdHRna3J0andieWh4dGpqa2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTQ2MTUsImV4cCI6MjA5MDA5MDYxNX0._675IGU-TOakpqrX0P3OCB68Ef0xY4jVdl_bRIaRuzw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
