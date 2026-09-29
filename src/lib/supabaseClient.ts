import * as supabaseClient from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau Anon Key belum terpasang di Environment Variables.");
}

export const supabase = supabaseClient.createClient(supabaseUrl || '', supabaseAnonKey || '');

// Expose to window for global runtime interoperability if running in browser
if (typeof window !== 'undefined') {
  (window as unknown as { supabase: typeof supabase; VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string }).supabase = supabase;
  if (supabaseUrl) {
    (window as unknown as { VITE_SUPABASE_URL?: string }).VITE_SUPABASE_URL = supabaseUrl;
  }
  if (supabaseAnonKey) {
    (window as unknown as { VITE_SUPABASE_ANON_KEY?: string }).VITE_SUPABASE_ANON_KEY = supabaseAnonKey;
  }
}

export default supabase;
