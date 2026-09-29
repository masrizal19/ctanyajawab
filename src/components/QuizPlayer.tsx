import React, { useState } from 'react';
import { Quiz, Question } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizPlayerProps {
  quiz: Quiz;
  questions: Question[];
  onFinish: (answers: { question_id: number; option_id: number }[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  questions,
  onFinish,
  onCancel,
  isSubmitting,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-600 text-sm">Tidak ada pertanyaan pada kuis ini.</p>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const progressPct = Math.round(((currentIndex + 1) / total) * 100);
  const currentSelectedOptionId = selectedAnswers[currentQ.id];

  const handleSelectOption = (optionId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(selectedAnswers).map(([qid, oid]) => ({
      question_id: parseInt(qid, 10),
      option_id: oid,
    }));
    onFinish(formattedAnswers);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      
      {/* Quiz Header & Progress */}
      <div className="flex items-center justify-between">
        <button
          id="btn-cancel-quiz"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar dari Kuis</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Kemajuan:</span>
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {currentIndex + 1} / {total} Pertanyaan
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 rounded-full bg-[#f1f5f9] shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] p-0.5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* Animated Question Card Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl p-6 sm:p-10 bg-[#f1f5f9] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border border-white/80 space-y-6"
        >
          {/* Question Metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                {quiz.category}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-medium text-slate-500">
                {currentSelectedOptionId
                  ? (() => {
                      const opt = currentQ.options.find(o => o.id === currentSelectedOptionId);
                      const val = opt?.score_value ?? 0;
                      if (val <= 0) return 'Bobot Likelihood Bayes: 0% (Gejala Tidak Terindikasi / Normal)';
                      if (val <= 50) return 'Bobot Likelihood Bayes: 50% (Likelihood Gejala Sedang)';
                      return 'Bobot Likelihood Bayes: 100% (Likelihood Gejala Parah/Kritis)';
                    })()
                  : 'Pilih opsi yang paling mendeskripsikan kondisi perangkat'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {currentQ.question_text}
            </h3>
          </div>

          {/* Options List */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, idx) => {
              const isSelected = currentSelectedOptionId === opt.id;
              const letter = String.fromCharCode(65 + idx);
              const weightLabel = opt.score_value <= 0 
                ? '0% • Normal' 
                : opt.score_value <= 50 
                ? '50% • Sedang' 
                : '100% • Kritis';

              return (
                <button
                  key={opt.id}
                  id={`option-${opt.id}`}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full p-4 sm:p-5 rounded-2xl text-left flex items-start gap-4 transition-all duration-200 group active:scale-[0.99] ${
                    isSelected
                      ? 'bg-blue-50/90 border-2 border-blue-600 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff]'
                      : 'bg-[#f1f5f9] hover:bg-white border border-transparent hover:border-slate-200 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 shadow-xs group-hover:bg-blue-50'
                    }`}
                  >
                    {letter}
                  </span>

                  <div className="flex-1 pt-0.5 space-y-1">
                    <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                      isSelected ? 'text-blue-950 font-bold' : 'text-slate-700'
                    }`}>
                      {opt.option_text}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        opt.score_value <= 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : opt.score_value <= 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        Likelihood: {weightLabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation and Submission Buttons */}
          <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between">
            <button
              id="btn-prev-question"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIndex === total - 1 ? (
              <button
                id="btn-submit-quiz"
                onClick={handleSubmit}
                disabled={!currentSelectedOptionId || isSubmitting}
                className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-500/25 transition-all ${
                  !currentSelectedOptionId || isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-95 transform hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Jawaban...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Selesai &amp; Lihat Hasil CTW</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="btn-next-question"
                onClick={handleNext}
                disabled={!currentSelectedOptionId}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-extrabold shadow-sm transition-all ${
                  !currentSelectedOptionId
                    ? 'opacity-40 cursor-not-allowed'
                    : 'active:scale-95'
                }`}
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
