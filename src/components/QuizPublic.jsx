import React, { useState, useEffect } from 'react';
import { getQuizById, submitQuizAnswers } from '../services/quizService';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Share2,
  RotateCcw,
  Check,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

/**
 * Komponen QuizPublic.jsx (Halaman Kuis Publik CTW Interactive)
 * - Mengambil data kuis murni dari Supabase berdasarkan parameter URL 'id'.
 * - JANGAN memuat mock/fallback default kuis jika query gagal.
 * - Menampilkan Empty / Error State yang informatif dan bersih.
 */
export const QuizPublic = ({ quizId: propQuizId, onBackToCatalog }) => {
  // 1. Ambil Parameter ID dari Props atau URL Query
  const [activeQuizId] = useState(() => {
    if (propQuizId) return String(propQuizId).trim();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id');
      if (idParam) return String(idParam).trim();
    }
    return '';
  });

  // State Pemuatan & Error
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // State Data Kuis Murni
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [resultRules, setResultRules] = useState([]);

  // State Pengerjaan Kuis
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Load Data Kuis Murni dari Supabase
  const loadQuizData = async () => {
    const cleanId = String(activeQuizId || '').trim();

    if (!cleanId) {
      setErrorMessage('ID kuis tidak ditentukan pada URL tautan.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Ambil data murni dari Supabase Client SDK
      const data = await getQuizById(cleanId);

      if (!data || !data.quiz) {
        throw new Error(`Data kuis dengan ID "${cleanId}" tidak ditemukan di database.`);
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
  };

  useEffect(() => {
    loadQuizData();
  }, [activeQuizId]);

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

  // Submit & Evaluasi Skor
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
      alert('Terjadi kendala saat memproses hasil evaluasi kuis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Salin Ringkasan Hasil
  const handleCopyResult = () => {
    if (!finalResult) return;
    const ruleTitle = finalResult.result?.title || 'Hasil Evaluasi';
    const score = finalResult.score || 0;
    const summaryText = `[CTW Kuis - ${quiz?.title || 'Hasil Evaluasi'}]\nHasil: ${ruleTitle}\nSkor Keparahan: ${score}%\n\nTautan Kuis: ${window.location.href}`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  // Ulangi Pengerjaan Kuis
  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setFinalResult(null);
  };

  // -------------------------------------------------------------
  // STATE 1: LOADING STATE
  // -------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-white shadow-soft-card border border-slate-100 flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <h3 className="text-base font-extrabold text-slate-900">Memuat Kuis dari Supabase...</h3>
          <p className="text-xs text-slate-500 mt-1">
            Mengambil modul pertanyaan dan aturan evaluasi hasil secara asinkron.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: EMPTY / ERROR STATE (MURNI TANPA FALLBACK DEFAULT)
  // -------------------------------------------------------------
  if (errorMessage || !quiz || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
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
              onClick={() => {
                if (onBackToCatalog) onBackToCatalog();
                else window.location.href = '/quiz.html';
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Kembali ke Katalog Kuis
            </button>

            <button
              onClick={loadQuizData}
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
  // STATE 3: RESULT SCREEN (HASIL DIAGNOSIS)
  // -------------------------------------------------------------
  if (finalResult) {
    const resultItem = finalResult.result || {};
    const totalScore = finalResult.score || 0;
    const breakdown = finalResult.answers_payload || [];

    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (onBackToCatalog) onBackToCatalog();
              else window.location.href = '/quiz.html';
            }}
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
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                {resultItem.badge || 'Hasil Analisis CTW'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {resultItem.title || 'Evaluasi Selesai'}
              </h1>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
                {totalScore}%
              </span>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Indeks Kerusakan
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Deskripsi &amp; Indikasi Masalah
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-[#f8fafc] p-4 rounded-2xl border border-slate-100">
              {resultItem.description || 'Diagnosis telah diproses berdasarkan respon jawaban.'}
            </p>
          </div>

          {resultItem.recommendation && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Saran &amp; Rekomendasi Solusi
              </h4>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed">
                {resultItem.recommendation}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              onClick={handleRestartQuiz}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Kuis</span>
            </button>

            <button
              onClick={handleCopyResult}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Ringkasan Disalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan Hasil Kuis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breakdown Jawaban */}
        {breakdown.length > 0 && (
          <div className="p-6 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Rincian Jawaban ({breakdown.length} Pertanyaan)
            </h3>
            <div className="space-y-3">
              {breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">
                      {idx + 1}. {item.question_text}
                    </span>
                    <span className="text-slate-500 font-medium block">
                      Jawaban Terpilih: <strong className="text-blue-600">{item.option_text}</strong>
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 shrink-0">
                    +{item.score_value} Poin
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: ACTIVE QUIZ PLAYER
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQ) * 100);
  const currentSelectedOptId = currentQ ? selectedAnswers[currentQ.id] : undefined;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            if (onBackToCatalog) onBackToCatalog();
            else window.location.href = '/quiz.html';
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar ke Katalog</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Kemajuan:</span>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {currentIndex + 1} / {totalQ} Pertanyaan
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full bg-[#f1f5f9] shadow-soft-pressed p-0.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Card Pertanyaan Aktif */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#f1f5f9] shadow-soft-card border border-white space-y-6">
        <div className="border-b border-slate-200/80 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block mb-1">
            {quiz.category || 'Kuis Diagnostik CTW'}
          </span>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
            {quiz.title}
          </h1>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Pertanyaan {currentIndex + 1}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
            {currentQ?.question_text}
          </h3>
        </div>

        {/* Options List */}
        <div className="space-y-3 pt-2">
          {(currentQ?.options || []).map((opt, optIdx) => {
            const isSelected = currentSelectedOptId === opt.id;
            const letter = String.fromCharCode(65 + optIdx);

            return (
              <button
                key={opt.id || optIdx}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, opt.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 translate-x-1'
                    : 'bg-white hover:bg-slate-50 text-slate-700 shadow-sm border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {opt.option_text}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-white bg-white text-blue-600' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigasi Lanjut / Kembali */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Kembali
          </button>

          {currentIndex < totalQ - 1 ? (
            <button
              type="button"
              disabled={!currentSelectedOptId}
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!currentSelectedOptId || isSubmitting}
              onClick={handleSubmitQuiz}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lihat Hasil Diagnosis</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPublic;
