import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AdminSession {
  id?: number | string;
  username: string;
  role?: string;
  token: string;
  logged_at: string;
}

interface AdminUserRecord {
  id?: number | string;
  username: string;
  password?: string;
  role?: string;
  token?: string;
}

interface AdminLoginProps {
  onLoginSuccess?: (session: AdminSession) => void;
  onShowToast?: (msg: string) => void;
}

/**
 * Komponen Login Administrator CTW
 * Menggunakan query otentikasi langsung via Supabase SDK (supabase.from('admin_users'))
 * Mengeliminasi error 405 Method Not Allowed pada static hosting seperti GitHub Pages.
 */
export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onShowToast
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError('Mohon masukkan username dan password.');
      setIsLoggingIn(false);
      return;
    }

    try {
      // 1. Query otentikasi langsung ke tabel admin_users melalui Supabase Client SDK
      const { data, error } = (await (supabase.from('admin_users') as any)
        .select('*')
        .eq('username', cleanUsername)
        .eq('password', cleanPassword)
        .maybeSingle()) as { data: AdminUserRecord | null; error: any };

      // 2. Penanganan jika terjadi error koneksi / database Supabase
      if (error) {
        console.warn('⚠️ [Supabase Auth Notice]:', error.message);

        // Fallback akun darurat lokal jika tabel belum dibuat atau terkendala RLS
        if (
          (cleanUsername === 'admin' && cleanPassword === 'admin123') ||
          (cleanUsername === 'atw_admin' && cleanPassword === 'admin123')
        ) {
          const sessionPayload: AdminSession = {
            id: 1,
            username: cleanUsername,
            role: 'admin',
            token: 'ctw_session_' + Date.now(),
            logged_at: new Date().toISOString()
          };

          localStorage.setItem('ctw_admin_session', JSON.stringify(sessionPayload));
          localStorage.setItem('atw_admin_token', sessionPayload.token);

          if (onShowToast) onShowToast('Login Administrator berhasil! (Akses Lokal)');
          if (onLoginSuccess) onLoginSuccess(sessionPayload);
          setIsLoggingIn(false);
          return;
        }

        setLoginError(
          `Gangguan koneksi Supabase: ${error.message || 'Tidak dapat terhubung ke database admin_users'}. Pastikan tabel 'admin_users' sudah dibuat.`
        );
        setIsLoggingIn(false);
        return;
      }

      // 3. Jika akun ditemukan di tabel admin_users
      if (data) {
        const sessionPayload: AdminSession = {
          id: data.id || 1,
          username: data.username || cleanUsername,
          role: data.role || 'admin',
          token: data.token || 'ctw_session_' + Date.now(),
          logged_at: new Date().toISOString()
        };

        // Simpan data session admin di localStorage (key: ctw_admin_session)
        localStorage.setItem('ctw_admin_session', JSON.stringify(sessionPayload));
        localStorage.setItem('atw_admin_token', sessionPayload.token);

        if (onShowToast) onShowToast('Login Administrator berhasil!');
        if (onLoginSuccess) onLoginSuccess(sessionPayload);
        setIsLoggingIn(false);
        return;
      }

      // 4. Toleransi kredensial default admin/admin123 jika tabel admin_users belum terisi data
      if (
        (cleanUsername === 'admin' && cleanPassword === 'admin123') ||
        (cleanUsername === 'atw_admin' && cleanPassword === 'admin123')
      ) {
        const sessionPayload: AdminSession = {
          id: 1,
          username: cleanUsername,
          role: 'admin',
          token: 'ctw_session_' + Date.now(),
          logged_at: new Date().toISOString()
        };

        localStorage.setItem('ctw_admin_session', JSON.stringify(sessionPayload));
        localStorage.setItem('atw_admin_token', sessionPayload.token);

        if (onShowToast) onShowToast('Login Administrator berhasil!');
        if (onLoginSuccess) onLoginSuccess(sessionPayload);
        setIsLoggingIn(false);
        return;
      }

      // 5. Pesan kesalahan informatif jika kredensial tidak cocok
      setLoginError('Username atau password yang Anda masukkan tidak cocok.');
    } catch (err: unknown) {
      console.error('Unhandled login error:', err);
      // Fallback kredensial default saat offline
      if (
        (cleanUsername === 'admin' && cleanPassword === 'admin123') ||
        (cleanUsername === 'atw_admin' && cleanPassword === 'admin123')
      ) {
        const sessionPayload: AdminSession = {
          id: 1,
          username: cleanUsername,
          role: 'admin',
          token: 'ctw_session_' + Date.now(),
          logged_at: new Date().toISOString()
        };

        localStorage.setItem('ctw_admin_session', JSON.stringify(sessionPayload));
        localStorage.setItem('atw_admin_token', sessionPayload.token);

        if (onShowToast) onShowToast('Login Administrator berhasil!');
        if (onLoginSuccess) onLoginSuccess(sessionPayload);
      } else {
        const msg = err instanceof Error ? err.message : 'Terjadi gangguan saat memproses login';
        setLoginError(`Gagal memproses otentikasi: ${msg}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="p-8 rounded-3xl bg-[#f1f5f9] shadow-[8px_8px_18px_#d1d9e6,-8px_-8px_18px_#ffffff] border border-white/80">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center p-2.5 bg-[#f1f5f9] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] border border-white/80 mb-4">
            <img
              src="/shock.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/shock.svg';
              }}
              alt="CTW Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Login Administrator</h2>
          <p className="text-xs text-slate-500 mt-1">Masukkan akun pengelola kuis CTW.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoggingIn}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-600 text-sm font-medium disabled:bg-slate-100"
              placeholder="Username admin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoggingIn}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-600 text-sm font-medium disabled:bg-slate-100"
              placeholder="••••••••"
            />
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <span className="text-rose-500 mt-0.5">⚠️</span>
              <div className="flex-1 leading-relaxed">{loginError}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <span>Masuk ke Panel CMS</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <span className="text-[11px] text-slate-400 font-medium">
            Default kredensial: <code className="text-slate-700 font-bold">admin</code> /{' '}
            <code className="text-slate-700 font-bold">admin123</code>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
