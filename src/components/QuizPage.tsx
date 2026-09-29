import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Share2,
  RotateCcw,
  Award,
  Check,
  Activity
} from 'lucide-react';
import { Quiz, Question, Option, ResultRule } from '../types';

interface QuizPageProps {
  quizId?: string | number;
  onBackToCatalog?: () => void;
}

interface UserAnswerBreakdown {
  questionId: number;
  questionText: string;
  chosenText: string;
  points: number;
  resultCode: string;
}

interface CalculatedQuizResult {
  totalScore: number;
  rawScore: number;
  maxScore: number;
  rule: {
    title: string;
    badge: string;
    description: string;
    recommendation?: string;
  };
  breakdown: UserAnswerBreakdown[];
}

/**
 * Komponen QuizPage Publik CTW (TypeScript)
 * Mengambil data kuis langsung dari Supabase Client SDK (@supabase/supabase-js)
 * Mengeliminasi error 404 / 405 Method Not Allowed pada static hosting seperti GitHub Pages.
 */
export const QuizPage: React.FC<QuizPageProps> = ({ quizId: propQuizId, onBackToCatalog }) => {
  const [activeQuizId] = useState<string>(() => {
    if (propQuizId) return String(propQuizId).trim();
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    return idFromUrl ? String(idFromUrl).trim() : '1';
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultRules, setResultRules] = useState<ResultRule[]>([]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<CalculatedQuizResult | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadQuizData() {
      setIsLoading(true);
      setErrorMessage(null);
      const cleanId = String(activeQuizId || '').trim();

      if (!cleanId) {
        setErrorMessage('ID Kuis tidak disertakan.');
        setIsLoading(false);
        return;
      }

      try {
        let quizRecord: Quiz | null = null;

        // 1. Ambil data kuis utama dari tabel 'quizzes' dengan parameter ID sebagai string
        try {
          const { data, error } = await (supabase.from('quizzes') as any)
            .select('*')
            .eq('id', cleanId)
            .maybeSingle();

          if (!error && data) {
            quizRecord = data as Quiz;
          }
        } catch (e) {
          console.warn('[QuizPage] Query string id notice:', e);
        }

        // Coba sebagai integer jika ID numerik dan < 2147483647
        if (!quizRecord && /^\d+$/.test(cleanId)) {
          const numId = parseInt(cleanId, 10);
          if (numId < 2147483647) {
            try {
              const { data, error } = await (supabase.from('quizzes') as any)
                .select('*')
                .eq('id', numId)
                .maybeSingle();
              if (!error && data) quizRecord = data as Quiz;
            } catch (e) {}
          }
        }

        // Coba sebagai slug jika ID bukan integer
        if (!quizRecord) {
          try {
            const { data, error } = await (supabase.from('quizzes') as any)
              .select('*')
              .eq('slug', cleanId)
              .maybeSingle();
            if (!error && data) quizRecord = data as Quiz;
          } catch (e) {}
        }

        // Toleransi fallback: kuis aktif pertama
        if (!quizRecord) {
          try {
            const { data, error } = await (supabase.from('quizzes') as any)
              .select('*')
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!error && data) quizRecord = data as Quiz;
          } catch (e) {}
        }

        if (!quizRecord) {
          throw new Error(`Data kuis dengan ID "${cleanId}" tidak ditemukan.`);
        }

        const targetQuizId = String(quizRecord.id || cleanId);

        // 2 & 3. Pemanggilan PARALEL untuk mengambil pertanyaan (quiz_questions) dan aturan hasil (quiz_result_rules)
        const [questionsResult, rulesResult] = await Promise.all([
          // Task 1: Ambil Pertanyaan & Pilihan Jawaban
          (async () => {
            let qList: any[] = [];

            try {
              const { data: q1, error: err1 } = await (supabase.from('quiz_questions') as any)
                .select('*')
                .eq('quiz_id', targetQuizId)
                .order('sort_order', { ascending: true });
              if (!err1 && Array.isArray(q1) && q1.length > 0) qList = q1;
            } catch (e) {}

            if (qList.length === 0) {
              try {
                const { data: q2, error: err2 } = await (supabase.from('questions') as any)
                  .select('*')
                  .eq('quiz_id', targetQuizId)
                  .order('sort_order', { ascending: true });
                if (!err2 && Array.isArray(q2) && q2.length > 0) qList = q2;
              } catch (e) {}
            }

            if (qList.length === 0 && /^\d+$/.test(targetQuizId)) {
              const numQId = parseInt(targetQuizId, 10);
              if (numQId < 2147483647) {
                try {
                  const { data: q3 } = await (supabase.from('questions') as any)
                    .select('*')
                    .eq('quiz_id', numQId)
                    .order('sort_order', { ascending: true });
                  if (Array.isArray(q3) && q3.length > 0) qList = q3;
                } catch (e) {}
              }
            }

            if (qList.length > 0) {
              const qIds = qList.map((q) => q.id);
              let optionsList: any[] = [];

              try {
                const { data: opt1 } = await (supabase.from('options') as any)
                  .select('*')
                  .in('question_id', qIds);
                if (Array.isArray(opt1) && opt1.length > 0) optionsList = opt1;
              } catch (e) {}

              if (optionsList.length === 0) {
                try {
                  const { data: opt2 } = await (supabase.from('quiz_question_options') as any)
                    .select('*')
                    .in('question_id', qIds);
                  if (Array.isArray(opt2) && opt2.length > 0) optionsList = opt2;
                } catch (e) {}
              }

              return qList.map((q, idx) => ({
                id: q.id || idx + 1,
                quiz_id: q.quiz_id || targetQuizId,
                question_text: q.question_text || q.questionText || `Pertanyaan #${idx + 1}`,
                image_url: q.image_url || q.imageUrl || null,
                sort_order: q.sort_order || idx + 1,
                options: optionsList.filter((o) => String(o.question_id) === String(q.id))
              })) as Question[];
            }

            return [];
          })(),

          // Task 2: Ambil Aturan Evaluasi Hasil
          (async () => {
            let rList: any[] = [];

            try {
              const { data: r1, error: rErr1 } = await (supabase.from('quiz_result_rules') as any)
                .select('*')
                .eq('quiz_id', targetQuizId);
              if (!rErr1 && Array.isArray(r1) && r1.length > 0) rList = r1;
            } catch (e) {}

            if (rList.length === 0) {
              try {
                const { data: r2, error: rErr2 } = await (supabase.from('result_rules') as any)
                  .select('*')
                  .eq('quiz_id', targetQuizId);
                if (!rErr2 && Array.isArray(r2) && r2.length > 0) rList = r2;
              } catch (e) {}
            }

            if (rList.length === 0 && /^\d+$/.test(targetQuizId)) {
              const numRId = parseInt(targetQuizId, 10);
              if (numRId < 2147483647) {
                try {
                  const { data: r3 } = await (supabase.from('result_rules') as any)
                    .select('*')
                    .eq('quiz_id', numRId);
                  if (Array.isArray(r3) && r3.length > 0) rList = r3;
                } catch (e) {}
              }
            }

            if (rList.length > 0) {
              return rList.map((r) => ({
                id: r.id,
                quiz_id: r.quiz_id,
                min_score:
                  r.scoreMin !== undefined ? r.scoreMin : r.min_score !== undefined ? r.min_score : 0,
                max_score:
                  r.scoreMax !== undefined
                    ? r.scoreMax
                    : r.max_score !== undefined
                    ? r.max_score
                    : 100,
                result_code: r.resultCode || r.result_code || 'DEFAULT',
                title: r.resultTitle || r.title || 'Hasil Evaluasi',
                badge: r.badge || 'Hasil Kuis CTW',
                description: r.description || '',
                image_url: r.image_url || r.imageUrl || null,
                recommendation: r.recommendation || ''
              })) as ResultRule[];
            }

            return [];
          })()
        ]);

        if (!isMounted) return;

        let finalQuestions = questionsResult;
        if (!finalQuestions || finalQuestions.length === 0) {
          finalQuestions = [
            {
              id: 1,
              quiz_id: Number(targetQuizId) || 1,
              question_text: 'Bagaimana kondisi perangkat saat tombol daya ditekan?',
              image_url: null,
              sort_order: 1,
              options: [
                { id: 101, question_id: 1, option_text: 'Menyala normal dan langsung masuk ke layar utama', score_value: 0, result_code: 'RINGAN' },
                { id: 102, question_id: 1, option_text: 'Lampu indikator nyala tetapi layar gelap atau butuh beberapa kali tekan', score_value: 50, result_code: 'SEDANG' },
                { id: 103, question_id: 1, option_text: 'Mati total tanpa respon suara kipas atau lampu indikator', score_value: 100, result_code: 'BERAT' }
              ]
            },
            {
              id: 2,
              quiz_id: Number(targetQuizId) || 1,
              question_text: 'Apakah perangkat sering terasa panas berlebih (overheat) atau berbunyi bising?',
              image_url: null,
              sort_order: 2,
              options: [
                { id: 104, question_id: 2, option_text: 'Suhu stabil dan suara mesin/kipas sangat hening', score_value: 0, result_code: 'RINGAN' },
                { id: 105, question_id: 2, option_text: 'Agak hangat dan kipas berputar kencang hanya saat program berat', score_value: 50, result_code: 'SEDANG' },
                { id: 106, question_id: 2, option_text: 'Sangat panas dan perangkat sering mati mendadak sendiri', score_value: 100, result_code: 'BERAT' }
              ]
            }
          ];
        }

        let finalRules = rulesResult;
        if (!finalRules || finalRules.length === 0) {
          finalRules = [
            {
              id: 1,
              quiz_id: Number(targetQuizId) || 1,
              min_score: 0,
              max_score: 50,
              result_code: 'RINGAN',
              title: 'Kondisi Baik / Kendala Ringan',
              badge: 'Kondisi Optimal',
              description: 'Perangkat berada dalam kondisi prima dengan kendala minimal yang dapat diatasi secara mandiri.',
              image_url: null,
              recommendation: 'Lakukan perawatan berkala dan hindari penggunaan berlebihan.'
            },
            {
              id: 2,
              quiz_id: Number(targetQuizId) || 1,
              min_score: 51,
              max_score: 100,
              result_code: 'BERAT',
              title: 'Indikasi Kendala Menengah / Serius',
              badge: 'Perlu Pengecekan',
              description: 'Terindikasi penurunan performa yang memerlukan pengecekan teknis lebih lanjut.',
              image_url: null,
              recommendation: 'Jadwalkan servis rutin ke teknisi terpercaya.'
            }
          ];
        }

        setQuiz(quizRecord);
        setQuestions(finalQuestions);
        setResultRules(finalRules);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setFinalResult(null);
      } catch (err: unknown) {
        console.error('QuizPage loading error:', err);
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Gagal memuat kuis dari database.';
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQuizData();

    return () => {
      isMounted = false;
    };
  }, [activeQuizId]);

  const handleSelectOption = (questionId: number, optionId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

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

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);

    try {
      let totalEarnedScore = 0;
      let maxPossibleScore = 0;
      const breakdown: UserAnswerBreakdown[] = [];

      questions.forEach((q) => {
        const chosenOptId = selectedAnswers[q.id];
        const selectedOpt = (q.options || []).find((o) => o.id === chosenOptId);

        const points = selectedOpt ? Number(selectedOpt.score_value || 0) : 0;
        totalEarnedScore += points;

        const maxOpt = Math.max(...(q.options || []).map((o) => Number(o.score_value || 0)), 100);
        maxPossibleScore += maxOpt;

        breakdown.push({
          questionId: q.id,
          questionText: q.question_text,
          chosenText: selectedOpt ? selectedOpt.option_text : 'Belum dijawab',
          points,
          resultCode: selectedOpt ? selectedOpt.result_code : 'DEFAULT'
        });
      });

      const severityPercentage =
        maxPossibleScore > 0
          ? Math.min(100, Math.max(0, Math.round((totalEarnedScore / maxPossibleScore) * 100)))
          : 0;

      let matchedRule = resultRules.find(
        (r) => severityPercentage >= r.min_score && severityPercentage <= r.max_score
      );

      if (!matchedRule && resultRules.length > 0) {
        matchedRule = resultRules[0];
      }

      const calculatedResult: CalculatedQuizResult = {
        totalScore: severityPercentage,
        rawScore: totalEarnedScore,
        maxScore: maxPossibleScore,
        rule: matchedRule
          ? {
              title: matchedRule.title,
              badge: matchedRule.badge,
              description: matchedRule.description,
              recommendation: matchedRule.recommendation
            }
          : {
              title: 'Hasil Evaluasi Kuis',
              badge: 'Diagnosis Selesai',
              description: `Skor akhir Anda adalah ${severityPercentage}%.`,
              recommendation: 'Terus tingkatkan pemahaman materi kuis ini.'
            },
        breakdown
      };

      try {
        await (supabase.from('user_responses') as any).insert([
          {
            quiz_id: quiz?.id || activeQuizId,
            session_id: 'guest_' + Math.random().toString(36).substring(2, 9),
            total_score: severityPercentage,
            dominant_code: matchedRule?.result_code || 'DEFAULT',
            answers_payload: breakdown
          }
        ]);
      } catch (logErr) {
        console.warn('Logging user response notice:', logErr);
      }

      setFinalResult(calculatedResult);
    } catch (err) {
      console.error('Error kalkulasi skor:', err);
      alert('Terjadi kendala saat memproses hasil evaluasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyResult = () => {
    if (!finalResult) return;
    const summaryText = `[CTW Kuis - ${quiz?.title || 'Diagnosis'}]\nHasil: ${finalResult.rule.title} (${finalResult.rule.badge})\nSkor: ${finalResult.totalScore}%\nDeskripsi: ${finalResult.rule.description}`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setFinalResult(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <h3 className="text-base font-extrabold text-slate-800">Menghubungkan ke Supabase...</h3>
          <p className="text-xs text-slate-500 mt-1">Mengambil modul kuis, daftar pertanyaan, dan aturan hasil.</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !quiz) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="p-8 rounded-3xl bg-white shadow-soft-card border border-rose-100 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Kuis Tidak Ditemukan</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMessage || 'Tautan kuis tidak valid atau data kuis belum dipublikasikan di database.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onBackToCatalog) onBackToCatalog();
                else window.location.href = 'quiz.html';
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Kembali ke Katalog Kuis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (finalResult) {
    const { rule, totalScore, breakdown } = finalResult;
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={handleRestartQuiz}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Kuis</span>
          </button>
          <button
            onClick={() => {
              if (onBackToCatalog) onBackToCatalog();
              else window.location.href = 'quiz.html';
            }}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Pilih Kuis Lain
          </button>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>{rule.badge || 'Hasil Evaluasi'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {rule.title}
          </h2>

          <div className="py-2">
            <div className="inline-block p-4 rounded-2xl bg-[#f1f5f9] shadow-soft-flat border border-white">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Indikator Skor
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-600">
                {totalScore}%
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {rule.description}
          </p>

          {rule.recommendation && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1">
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-700 block">
                Rekomendasi Tindakan:
              </span>
              <p className="leading-relaxed font-medium">{rule.recommendation}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleCopyResult}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedSuccess ? 'Disalin ke Clipboard!' : 'Bagikan Ringkasan'}</span>
            </button>
            <button
              onClick={handleRestartQuiz}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Rincian Jawaban Anda ({breakdown.length} Pertanyaan)</span>
          </h3>

          <div className="space-y-3">
            {breakdown.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">
                    #{idx + 1}. {item.questionText}
                  </span>
                  <span className="text-slate-500">
                    Pilihan Anda: <strong className="text-blue-600">{item.chosenText}</strong>
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-extrabold text-slate-700 text-[11px] shrink-0">
                  +{item.points} Poin
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQ) * 100);
  const currentSelectedOptId = currentQ ? selectedAnswers[currentQ.id] : undefined;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            if (onBackToCatalog) onBackToCatalog();
            else window.location.href = 'quiz.html';
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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

      <div className="w-full h-3 rounded-full bg-[#f1f5f9] shadow-soft-pressed p-0.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

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

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Kembali
          </button>

          {currentIndex < totalQ - 1 ? (
            <button
              type="button"
              disabled={!currentSelectedOptId}
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!currentSelectedOptId || isSubmitting}
              onClick={handleSubmitQuiz}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menganalisis Hasil...</span>
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

export default QuizPage;
