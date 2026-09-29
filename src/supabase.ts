import * as supabaseClient from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau Anon Key belum terpasang di Environment Variables.");
}

export const supabase = supabaseClient.createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
