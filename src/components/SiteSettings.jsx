import React, { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings, DEFAULT_SITE_SETTINGS } from '../services/quizService';
import {
  Globe,
  Layout,
  Mail,
  Phone,
  MapPin,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
  Zap,
  AlignLeft,
  FileText
} from 'lucide-react';

/**
 * Komponen SiteSettings.jsx (Antarmuka Halaman "Pengaturan Website" di Panel Admin CMS)
 * 1. Kelompok input:
 *    - Identitas Umum: Judul Website, Tagline, Deskripsi Meta, URL Logo, dan Favicon.
 *    - Konten Hero Banner: Badge Teks Header, Judul Utama (Hero Title), dan Subtitle/Deskripsi Banner.
 *    - Kontak & Footer: Email Kontak, Nomor Telepon, dan Alamat.
 * 2. Tombol "Simpan Perubahan" terhubung dengan updateSiteSettings(formData).
 * 3. Indikator loading saat pengiriman data dan notifikasi toast sukses.
 * 4. Tata letak rapi, responsif, hirarki visual intuitif, sesuai skema tabel site_settings.
 */
export const SiteSettings = () => {
  const [formData, setFormData] = useState({ ...DEFAULT_SITE_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Ambil data pengaturan yang tersimpan
  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getSiteSettings();
      setFormData(data || { ...DEFAULT_SITE_SETTINGS });
    } catch (err) {
      console.warn('Gagal memuat pengaturan situs:', err);
      setErrorMessage('Gagal memuat data dari database. Menggunakan data default.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 2. Simpan Perubahan ke Supabase via updateSiteSettings(formData)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await updateSiteSettings(formData);
      if (res.success) {
        setSaveSuccess(true);
        showToast('✅ Pengaturan website berhasil disimpan ke database Supabase!');
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saat menyimpan pengaturan:', err);
      const msg = err.message || 'Gagal menyimpan pengaturan ke Supabase.';
      setErrorMessage(msg);
      showToast('⚠️ ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan semua formulir pengaturan ke nilai default CTW?')) {
      setFormData({ ...DEFAULT_SITE_SETTINGS });
      showToast('Formulir direset ke pengaturan standar CTW.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Memuat konfigurasi situs dari Supabase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Pengaturan Website */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-wider mb-2 border border-blue-100">
            <Globe className="w-3.5 h-3.5" />
            <span>Konfigurasi Platform CMS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pengaturan Website
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Sesuaikan identitas brand, konten hero banner utama, serta informasi kontak &amp; footer CTW Interactive secara langsung ke database Supabase (`site_settings`).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Notifikasi Error jika ada */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Notifikasi Sukses */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan berhasil diperbarui secara permanen di database Supabase!</span>
        </div>
      )}

      {/* Form Pengaturan Website */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* KELOMPOK 1: IDENTITAS UMUM */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">1. Identitas Umum Website</h3>
              <p className="text-xs text-slate-500">Konfigurasi nama website, tagline, SEO meta, logo, dan favicon.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Judul Website (Site Title) *</label>
              <input
                type="text"
                required
                name="site_title"
                value={formData.site_title}
                onChange={handleChange}
                placeholder="CTW - Correct Answer Interactive Platform"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Tagline Website *</label>
              <input
                type="text"
                required
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Platform Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Deskripsi Meta (SEO &amp; OpenGraph) *</label>
              <textarea
                rows={2}
                required
                name="meta_description"
                value={formData.meta_description}
                onChange={handleChange}
                placeholder="Tuliskan deskripsi meta ringkas untuk mesin pencari..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">URL Logo Website</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder="/shock.png"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={formData.logo_url || '/shock.png'}
                    onError={(e) => { e.currentTarget.src = '/shock.svg'; }}
                    alt="Logo Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">URL Favicon</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="favicon_url"
                  value={formData.favicon_url}
                  onChange={handleChange}
                  placeholder="/favicon.ico"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={formData.favicon_url || '/favicon.ico'}
                    onError={(e) => { e.currentTarget.src = '/shock.svg'; }}
                    alt="Favicon Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KELOMPOK 2: KONTEN HERO BANNER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">2. Konten Hero Banner Utama</h3>
              <p className="text-xs text-slate-500">Pengaturan teks headline rekomendasi skrining di beranda aplikasi.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Badge Teks Header (Highlight Pill) *</label>
              <div className="relative">
                <Zap className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  name="hero_badge"
                  value={formData.hero_badge}
                  onChange={handleChange}
                  placeholder="Modul Skrining Terpopuler #1 CTW"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Judul Utama (Hero Title) *</label>
              <input
                type="text"
                required
                name="hero_title"
                value={formData.hero_title}
                onChange={handleChange}
                placeholder="Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Subtitle / Deskripsi Banner *</label>
              <textarea
                rows={3}
                required
                name="hero_subtitle"
                value={formData.hero_subtitle}
                onChange={handleChange}
                placeholder="Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Pratinjau Tampilan Hero Banner */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Pratinjau Visual Hero Banner:
            </span>
            <div className="p-6 rounded-2xl bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-md space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[10px] font-extrabold uppercase tracking-wider border border-white/20">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>{formData.hero_badge || 'Highlight Badge'}</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {formData.hero_title || 'Judul Utama Hero Banner'}
              </h4>
              <p className="text-blue-100 text-xs leading-relaxed max-w-xl">
                {formData.hero_subtitle || 'Deskripsi singkat banner...'}
              </p>
            </div>
          </div>
        </div>

        {/* KELOMPOK 3: KONTAK & FOOTER */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">3. Informasi Kontak &amp; Footer</h3>
              <p className="text-xs text-slate-500">Saluran bantuan pengguna serta teks hak cipta pada bagian footer website.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Kontak Resmi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="support@ctwinteractive.id"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nomor Telepon / WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+62 812-3456-7890"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Alamat Kantor / Workshop</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  name="contact_address"
                  value={formData.contact_address}
                  onChange={handleChange}
                  placeholder="Gedung Cyber Tower Lt. 5, Jl. Rasuna Said No. 12, Jakarta Selatan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Teks Hak Cipta Footer</label>
              <input
                type="text"
                name="footer_text"
                value={formData.footer_text}
                onChange={handleChange}
                placeholder="CTW • Correct Answer Interactive Diagnosis & Assessment Platform"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Perubahan akan langsung disinkronkan ke database Supabase dan memengaruhi seluruh halaman web.
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan ke Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
