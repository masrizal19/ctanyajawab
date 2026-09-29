import * as supabaseClient from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback dummy credentials to prevent @supabase/supabase-js createClient from throwing runtime error
const FALLBACK_SUPABASE_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

const isValidHttpUrl = (val: string): boolean => {
  if (!val || typeof val !== 'string' || !val.trim()) return false;
  try {
    const url = new URL(val.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isConfigured = Boolean(isValidHttpUrl(rawUrl) && rawKey.trim());

const supabaseUrl = isConfigured ? rawUrl.trim() : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = isConfigured ? rawKey.trim() : FALLBACK_SUPABASE_ANON_KEY;

if (!isConfigured) {
  console.warn("⚠️ [Supabase] Supabase URL atau Anon Key belum terpasang di Environment Variables. Menggunakan safe fallback client.");
}

let client: ReturnType<typeof supabaseClient.createClient>;
try {
  client = supabaseClient.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch (err) {
  console.error("⚠️ [Supabase] Inisialisasi client gagal, fallback aktif:", err);
  client = supabaseClient.createClient(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_ANON_KEY);
}

export const supabase = client;

// Expose to window for global runtime interoperability if running in browser
if (typeof window !== 'undefined') {
  (window as unknown as { supabase: typeof supabase; VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string }).supabase = supabase;
  if (rawUrl) {
    (window as unknown as { VITE_SUPABASE_URL?: string }).VITE_SUPABASE_URL = rawUrl;
  }
  if (rawKey) {
    (window as unknown as { VITE_SUPABASE_ANON_KEY?: string }).VITE_SUPABASE_ANON_KEY = rawKey;
  }
}

export default supabase;
