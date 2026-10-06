import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validasi kredensial Supabase.
 * Memastikan URL dan Key terdefinisi, merupakan URL http/https yang valid,
 * dan TIDAK memuat kata 'placeholder' untuk mencegah error ERR_NAME_NOT_RESOLVED.
 */
export const isConfigured = Boolean(
  rawUrl &&
  typeof rawUrl === 'string' &&
  rawUrl.trim() !== '' &&
  !rawUrl.includes('placeholder') &&
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) &&
  rawKey &&
  typeof rawKey === 'string' &&
  rawKey.trim() !== '' &&
  !rawKey.includes('placeholder')
);

/**
 * Safe Dummy Client (No-Op Proxy)
 * Mencegah aplikasi mengirimkan HTTP request otomatis ke placeholder-project.supabase.co
 * saat environment variables belum disetel atau masih bernilai placeholder.
 */
function createSafeDummyClient() {
  const createChainable = () => {
    const handler = {
      get(target, prop) {
        if (prop === 'then') {
          // Ketika chain di-await langsung (Promise resolution)
          return (resolve) => resolve({ data: [], error: null });
        }
        if (typeof prop === 'string') {
          // Mengembalikan fungsi chainable untuk method seperti .select(), .eq(), .order(), dsb.
          return () => new Proxy({}, handler);
        }
        return undefined;
      }
    };
    return new Proxy({}, handler);
  };

  return {
    from: () => createChainable(),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase belum dikonfigurasi.') }),
      signOut: async () => ({ error: null })
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Supabase Storage belum dikonfigurasi.') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    isConfigured: false
  };
}

let clientInstance;

if (isConfigured) {
  try {
    clientInstance = createClient(rawUrl.trim(), rawKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('⚠️ [Supabase] Inisialisasi client gagal, beralih ke safe client:', err);
    clientInstance = createSafeDummyClient();
  }
} else {
  // Cegah request otomatis ke placeholder-project.supabase.co
  clientInstance = createSafeDummyClient();
}

export const supabase = clientInstance;

// Interoperabilitas di lingkungan window browser
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

export default supabase;
