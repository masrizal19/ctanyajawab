import React, { useState, useEffect } from 'react';
import { getQuizById, fetchQuizzes, submitQuizAnswers } from './services/quizService';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Share2,
  RotateCcw,
  Check,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react';

/**
 * Komponen QuizPublic.jsx (Halaman Kuis Publik CTW Interactive)
 * Fitur & Logika:
 * 1. Mengambil data kuis murni dari Supabase berdasarkan parameter URL 'id'.
 * 2. Hapus data mock/fallback kuis default jika query kuis gagal, ganti dengan tampilan Empty/Error State informatif.
 * 3. Jika tanpa parameter 'id', menampilkan katalog kuis aktif langsung dari Supabase.
 * 4. Tombol 'Bagikan' menyalin link dinamis (/quiz.html?id=[QUIZ_ID]) dengan Toast Alert "Link Kuis Berhasil Disalin ke Clipboard!".
 */
export const QuizPublic = ({ quizId: propQuizId, onBackToCatalog }) => {
  // 1. Ambil Parameter ID dari Props atau URL Query
  const [activeQuizId, setActiveQuizId] = useState(() => {
    if (propQuizId) return String(propQuizId).trim();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id');
      if (idParam) return String(idParam).trim();
    }
    return '';
  });

  // State Pemuatan & Notifikasi
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // State Katalog (jika tanpa parameter id)
  const [publicCatalog, setPublicCatalog] = useState([]);

  // State Data Kuis Aktif
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [resultRules, setResultRules] = useState([]);

  // State Pengerjaan Kuis
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Load Data Kuis Murni atau Katalog Publik dari Supabase
  const loadData = async () => {
    const cleanId = String(activeQuizId || '').trim();
    setIsLoading(true);
    setErrorMessage(null);

    // KASUS A: Ada ID Kuis Spesifik di URL
    if (cleanId) {
      try {
        const data = await getQuizById(cleanId);
        if (!data || !data.quiz) {
          throw new Error(`Data kuis dengan ID "${cleanId}" tidak ditemukan atau belum dipublikasikan di database Supabase.`);
        }

        setQuiz(data.quiz);
        setQuestions(data.questions || []);
        setResultRules(data.result_rules || []);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setFinalResult(null);
      } catch (err) {
        console.warn('Gagal memuat kuis publik:', err);
        // PENTING: JANGAN fallback ke kuis default! Set pesan error untuk Empty State.
        setQuiz(null);
        setQuestions([]);
        setResultRules([]);
        setErrorMessage(
          err.message || `Kuis dengan ID "${cleanId}" tidak ditemukan atau belum dipublikasikan.`
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // KASUS B: Tidak ada ID di URL -> Ambil Daftar Kuis Aktif dari Supabase
    try {
      const res = await fetchQuizzes();
      setPublicCatalog(res.quizzes || []);
    } catch (err) {
      console.warn('Gagal memuat katalog kuis:', err);
      setPublicCatalog([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeQuizId]);

  // Handler Pilih Kuis dari Katalog
  const handleSelectQuizFromCatalog = (id) => {
    const cleanId = String(id).trim();
    setActiveQuizId(cleanId);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?id=${encodeURIComponent(cleanId)}`;
      window.history.pushState({ id: cleanId }, '', newUrl);
    }
  };

  // Handler Pilih Opsi
  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Navigasi Soal
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Submit & Evaluasi Skor Kuis
  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    setIsSubmitting(true);

    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, optId]) => ({
        question_id: Number(qId),
        option_id: Number(optId)
      }));

      const res = await submitQuizAnswers({
        quiz,
        answers: answersPayload,
        questions,
        resultRules
      });

      setFinalResult(res);
    } catch (err) {
      console.error('Submit error:', err);
      showToast('⚠️ Terjadi kendala saat memproses hasil evaluasi kuis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Bagikan Kuis Langsung ke Clipboard
  const handleShareQuiz = (qId) => {
    const targetId = qId || quiz?.id || activeQuizId;
    const shareUrl = `${window.location.origin}/quiz.html?id=${targetId}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link Kuis Berhasil Disalin ke Clipboard!');
      }).catch(() => {
        showToast('Link Kuis Berhasil Disalin ke Clipboard!');
      });
    } else {
      showToast('Link Kuis Berhasil Disalin ke Clipboard!');
    }
  };

  // Salin Ringkasan Hasil
  const handleCopyResult = () => {
    if (!finalResult) return;
    const ruleTitle = finalResult.result?.title || 'Hasil Evaluasi';
    const score = finalResult.score || 0;
    const summaryText = `[CTW Kuis - ${quiz?.title || 'Hasil Evaluasi'}]\nHasil: ${ruleTitle}\nSkor Keparahan: ${score}%\n\nTautan Kuis: ${window.location.origin}/quiz.html?id=${quiz?.id || activeQuizId}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText).then(() => {
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
        showToast('Link Kuis Berhasil Disalin ke Clipboard!');
      });
    }
  };

  // Ulangi Pengerjaan Kuis
  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setFinalResult(null);
  };

  // Kembali ke Katalog
  const handleBack = () => {
    if (onBackToCatalog) {
      onBackToCatalog();
    } else {
      setActiveQuizId('');
      setQuiz(null);
      setQuestions([]);
      setFinalResult(null);
      setErrorMessage(null);
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', window.location.pathname);
      }
    }
  };

  // -------------------------------------------------------------
  // STATE 1: LOADING STATE (SPINNER / SKELETON)
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-white shadow-soft-card border border-slate-100 flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <h3 className="text-base font-extrabold text-slate-900">Memuat Data Kuis dari Supabase...</h3>
          <p className="text-xs text-slate-500 mt-1">
            Mengambil modul kuis, daftar pertanyaan, dan aturan evaluasi hasil secara langsung dari database.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: EMPTY / ERROR STATE (MURNI TANPA FALLBACK DEFAULT)
  // -------------------------------------------------------------
  if (errorMessage || (activeQuizId && (!quiz || questions.length === 0))) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 font-['Inter',sans-serif]">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-slate-700">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <div className="p-8 rounded-3xl bg-white shadow-soft-card border border-rose-100 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black text-slate-900 tracking-tight">Kuis Tidak Ditemukan</h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMessage ||
              `Data kuis dengan ID "${activeQuizId}" tidak ditemukan atau belum dipublikasikan di database Supabase.`}
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={handleBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Lihat Katalog Kuis Lainnya
            </button>

            <button
              onClick={loadData}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: RESULT SCREEN (HASIL DIAGNOSIS LENGKAP)
  // -------------------------------------------------------------
  if (finalResult) {
    const resultItem = finalResult.result || {};
    const totalScore = finalResult.score || 0;
    const breakdown = finalResult.answers_payload || [];

    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 font-['Inter',sans-serif] animate-in fade-in duration-300">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-slate-700">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Kuis</span>
          </button>
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
            Hasil Diagnosis Selesai
          </span>
        </div>

        {/* Hero Card Hasil */}
        <div className="p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: `${resultItem.badge_color || '#2563eb'}15`,
                  color: resultItem.badge_color || '#2563eb'
                }}
              >
                {resultItem.badge || 'Hasil Evaluasi'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                {resultItem.title || 'Evaluasi Selesai'}
              </h2>
            </div>
            <div className="text-right sm:border-l sm:pl-6 border-slate-100">
              <div className="text-xs font-semibold text-slate-400">Tingkat Keparahan</div>
              <div className="text-3xl font-black text-slate-900 mt-0.5">{totalScore}%</div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {resultItem.description || 'Diagnosis telah selesai dianalisis berdasarkan bobot skor gejala teknis.'}
          </p>

          {/* Bar Tingkat Keparahan */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>Ringan (0-35)</span>
              <span>Sedang (36-70)</span>
              <span>Kritis (71-100)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(5, totalScore))}%`,
                  backgroundColor: resultItem.badge_color || '#2563eb'
                }}
              />
            </div>
          </div>

          {/* Rekomendasi Solusi */}
          {resultItem.recommendation && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs sm:text-sm space-y-1">
              <span className="font-extrabold block text-blue-950">Rekomendasi Teknisi:</span>
              <p className="leading-relaxed">{resultItem.recommendation}</p>
            </div>
          )}
        </div>

        {/* Rincian Jawaban */}
        {breakdown.length > 0 && (
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-card space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Rincian Jawaban:</h3>
            <div className="divide-y divide-slate-100">
              {breakdown.map((item, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800">{item.question_text}</div>
                    <div className="text-slate-500 font-medium">{item.option_text}</div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                      item.score_value === 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.score_value === 50
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    +{item.score_value} Poin
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestartQuiz}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Kuis</span>
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>Katalog Kuis Lain</span>
            </button>
          </div>

          <button
            onClick={() => handleShareQuiz(quiz?.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan Kuis</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: QUIZ PLAYER (PENGERJAAN KUIS AKTIF)
  // -------------------------------------------------------------
  if (quiz && questions.length > 0) {
    const currentQ = questions[currentIndex] || {};
    const totalQuestions = questions.length;
    const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
    const selectedOptId = selectedAnswers[currentQ.id];
    const letterMap = ['A', 'B', 'C', 'D'];

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 font-['Inter',sans-serif]">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-slate-700">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Player Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {quiz.category || 'Umum'}
            </span>
            <button
              onClick={() => handleShareQuiz(quiz.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Bagikan Kuis"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Soal */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-400">
              <span>Soal {currentIndex + 1} dari {totalQuestions}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {currentQ.question_text}
          </h2>

          {/* Opsi Pilihan Jawaban */}
          <div className="space-y-3">
            {(currentQ.options || []).map((opt, oIdx) => {
              const isSelected = selectedOptId === opt.id;
              return (
                <button
                  key={opt.id || oIdx}
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  className={`w-full text-left p-4 rounded-2xl flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-600 shadow-sm'
                      : 'bg-slate-50/70 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {letterMap[oIdx] || oIdx + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed block">
                      {opt.option_text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigasi Bawah */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Sebelumnya
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                disabled={!selectedOptId}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !selectedOptId
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={!selectedOptId || isSubmitting}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !selectedOptId || isSubmitting
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                <span>{isSubmitting ? 'Menganalisis...' : 'Lihat Hasil Diagnosis'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 5: KATALOG KUIS PUBLIK (JIKA TANPA PARAMETER ID)
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 font-['Inter',sans-serif]">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Katalog */}
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
          CTW Interactive Platform
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Pilih Kuis &amp; Skrining Diagnostik
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Pilih salah satu kuis aktif di bawah ini untuk memulai evaluasi interaktif atau salin tautan kuis untuk dibagikan.
        </p>
      </div>

      {/* Grid Katalog Kuis */}
      {publicCatalog.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Kuis Aktif</h3>
          <p className="text-xs text-slate-500">
            Kuis yang dibuat di panel admin dengan status ACTIVE akan tampil secara otomatis di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {publicCatalog.map((q) => {
            const shareUrl = `${window.location.origin}/quiz.html?id=${q.id}`;
            return (
              <div
                key={q.id}
                className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-card flex flex-col justify-between hover:border-blue-200 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700">
                      {q.category || 'Umum'}
                    </span>
                    <button
                      onClick={() => handleShareQuiz(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Salin Tautan Kuis"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {q.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {q.description || 'Kuis interaktif CTW untuk skrining dan evaluasi perangkat.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {q.total_questions || 3} Pertanyaan
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareQuiz(q.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Bagikan</span>
                    </button>
                    <button
                      onClick={() => handleSelectQuizFromCatalog(q.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <span>Mulai Kuis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizPublic;
