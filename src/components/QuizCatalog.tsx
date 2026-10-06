import React, { useState, useEffect } from 'react';
import { Quiz } from '../types';
import { Search, Clock, HelpCircle, Star, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
// @ts-ignore
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from '../services/quizService';

interface QuizCatalogProps {
  quizzes: Quiz[];
  categories: { category: string; count: number }[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  onSelectQuiz: (quizId: number) => void;
  isLoading: boolean;
}

export const QuizCatalog: React.FC<QuizCatalogProps> = ({
  quizzes,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchKeyword,
  setSearchKeyword,
  onSelectQuiz,
  isLoading,
}) => {
  const featuredQuiz = quizzes[0];
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    getSiteSettings().then((res) => {
      if (res) setSiteSettings(res);
    });
  }, []);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero Banner Section */}
      <section
        id="hero-recommendation-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-8 md:p-12 shadow-2xl border border-blue-500/20"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide text-blue-100 border border-white/20">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{siteSettings.hero_badge || 'Modul Skrining Terpopuler #1 CTW'}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
              {siteSettings.hero_title || 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik'}
            </h1>

            <p className="text-blue-100/90 text-sm md:text-base leading-relaxed max-w-xl">
              {siteSettings.hero_subtitle || 'Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-blue-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                10 Pertanyaan Diagnosis
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                Estimasi 3 Menit
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                Hasil &amp; Saran Instan
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              {featuredQuiz && (
                <button
                  id="btn-hero-start"
                  onClick={() => onSelectQuiz(featuredQuiz.id)}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-blue-700 font-extrabold text-sm hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Mulai Diagnosis Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                id="btn-hero-scroll"
                onClick={() => {
                  const el = document.getElementById('catalog-grid-heading');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md transition-all border border-white/10"
              >
                Jelajahi Semua Modul
              </button>
            </div>
          </div>

          {/* Right Column: Mini Interactive Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 backdrop-blur-xl text-slate-800 rounded-2xl p-6 shadow-2xl border border-white/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    Q1
                  </div>
                  <span className="text-xs font-bold text-slate-500">Preview Pertanyaan 1</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Power &amp; Daya
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 leading-snug">
                "Bagaimana kondisi perangkat saat tombol daya (Power) ditekan?"
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-400 text-blue-700 text-xs font-medium flex items-center justify-between">
                  <span>A. Nyala normal dan langsung masuk ke layar utama</span>
                  <span className="text-blue-600 font-bold text-[11px]">+5 Poin</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-center justify-between">
                  <span>B. Lampu indikator nyala, layar gelap/butuh berkali tekan</span>
                  <span className="text-slate-400 font-bold text-[11px]">+15 Poin</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Skrining hardware &amp; software otomatis</span>
                <span className="font-bold text-emerald-600">Akurat &amp; Gratis</span>
              </div>
            </div>
          </div>

        </div>

        {/* Ambient background blur elements */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="catalog-grid-heading" className="text-2xl font-black text-slate-900 tracking-tight">
              Kategori Pilihan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kuis diagnosis berdasarkan tipe perangkat elektronikmu
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-quiz-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari kendala, laptop, hp, printer..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f1f5f9] border border-slate-300/80 shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['Semua', 'Laptop & PC', 'HP / Smartphone', 'Printer & Periferal'].map((catName) => {
            const isSelected = selectedCategory === catName;
            return (
              <button
                key={catName}
                id={`cat-pill-${catName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                onClick={() => setSelectedCategory(catName)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-[#f1f5f9] text-slate-600 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:text-slate-900'
                }`}
              >
                {catName === 'Semua' ? 'Semua Modul' : catName}
              </button>
            );
          })}
        </div>
      </section>

      {/* Quiz Cards Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-800">
            Daftar Kuis Tersedia
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {quizzes.length} Modul Terverifikasi
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Memuat modul kuis CTW...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">Tidak ada kuis yang cocok</h4>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                id={`quiz-card-${quiz.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="rounded-3xl p-6 bg-[#f1f5f9] shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] border border-white/60 flex flex-col justify-between hover:shadow-[12px_12px_24px_#cbd5e1,-12px_-12px_24px_#ffffff] transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100/70 text-blue-700">
                      {quiz.category}
                    </span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {quiz.rating || 4.9}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-full h-40 rounded-2xl overflow-hidden relative bg-slate-200">
                    <img
                      src={quiz.thumbnail}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>{quiz.total_questions || 5} Pertanyaan</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {quiz.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-6 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{quiz.est_time || '2 Menit'}</span>
                  </span>

                  <button
                    id={`btn-start-${quiz.id}`}
                    onClick={() => onSelectQuiz(quiz.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <span>Mulai Kuis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
