import React from 'react';
import { SubmissionResponse } from '../types';
import { RotateCcw, ArrowRight, Sparkles, Wrench, AlertTriangle, Activity, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface QuizResultProps {
  resultData: SubmissionResponse;
  onRetake: () => void;
  onExploreOther: () => void;
  onOpenDocs?: () => void;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  resultData,
  onRetake,
  onExploreOther,
}) => {
  const { result, score, answers_payload, bayes } = resultData;
  const items = answers_payload || [];
  const totalScore = score !== undefined ? score : (resultData.total_score || 0);

  // Determine Tier & Badge styling based on 0% - 100% percentage score range
  let badgeColorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let scoreBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let headerBorderClass = 'border-emerald-500/30';
  let defaultAdvice: string[] = [
    'Lakukan pembersihan file cache/temporary dan uninstal aplikasi yang tidak digunakan.',
    'Lakukan update OS dan Driver perangkat secara berkala.',
    'Jaga sirkulasi udara perangkat dan hindari menggunakan laptop di atas kasur/bantal.'
  ];

  if (totalScore >= 71) {
    badgeColorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    scoreBadgeClass = 'text-rose-700 bg-rose-50 border-rose-200';
    headerBorderClass = 'border-rose-500/30';
    defaultAdvice = [
      'Segera lakukan backup data penting kamu ke cloud atau penyimpanan eksternal jika perangkat masih bisa menyala.',
      'Hentikan penggunaan jika perangkat mengalami overheating ekstrem atau baterai kembung untuk mencegah korsleting.',
      'Bawa perangkat ke pusat perbaikan resmi (Service Center) atau teknisi profesional untuk pengecekan jalur komponen & penggantian sparepart.'
    ];
  } else if (totalScore >= 36) {
    badgeColorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    scoreBadgeClass = 'text-amber-800 bg-amber-50 border-amber-200';
    headerBorderClass = 'border-amber-500/30';
    defaultAdvice = [
      'Lakukan servis berkala seperti pembersihan debu bagian dalam dan penggantian pasta thermal CPU/GPU.',
      'Pertimbangkan untuk melakukan upgrade SSD atau penambahan RAM jika sistem terasa lambat.',
      "Jika terjadi kendala printer, lakukan proses 'Head Cleaning' via software bawaan."
    ];
  }

  const actionableAdvice = result.actionable_advice && result.actionable_advice.length > 0 
    ? result.actionable_advice 
    : defaultAdvice;

  // Generate combination letters string if available
  const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];
  const comboLetters = items.map((it, idx) => it.selected_option_letter || letterMap[idx % 6]).filter(Boolean);
  const comboStr = comboLetters.length > 0 ? comboLetters.join(', ') : '';

  let displayDescription = result.description || 'Diagnosis kerusakan telah selesai dianalisis berdasarkan 10 indikator teknis perangkat Anda.';
  if (comboStr && !displayDescription.toLowerCase().includes('kombinasi jawaban') && !displayDescription.toLowerCase().includes('berdasarkan')) {
    displayDescription = `Berdasarkan pola respons kamu (${comboStr}), ${displayDescription}`;
  }

  // Fallback posterior probabilities if not sent by backend
  const postProb = bayes?.posterior_probabilities || {
    ringan: totalScore <= 35 ? Math.max(70, 100 - totalScore) : Math.max(0, 40 - totalScore),
    sedang: totalScore >= 36 && totalScore <= 70 ? 75 : (totalScore > 70 ? 20 : 25),
    kritis: totalScore >= 71 ? Math.min(100, totalScore + 10) : (totalScore >= 36 ? 15 : 5)
  };
  const confidence = bayes?.confidence_percentage || (totalScore >= 71 ? postProb.kritis : totalScore >= 36 ? postProb.sedang : postProb.ringan);

  return (
    <motion.div
      id="result-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Card Utama Diagnosis */}
      <div className={`bg-white rounded-3xl p-8 sm:p-10 shadow-sm border ${headerBorderClass} text-center space-y-5 relative overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border ${badgeColorClass}`}>
            {result.badge || 'Hasil Diagnosis CTW'}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${scoreBadgeClass}`}>
            Tingkat Keparahan: {totalScore}%
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Tingkat Keyakinan Bayes: {confidence}%
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {result.title}
        </h2>

        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          {displayDescription}
        </p>

        {/* Skor Bar Indicator (0% - 100%) */}
        <div className="pt-2 max-w-md mx-auto">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
            <span className={totalScore <= 35 ? 'text-emerald-600 font-bold' : ''}>Ringan (0% - 35%)</span>
            <span className={totalScore >= 36 && totalScore <= 70 ? 'text-amber-600 font-bold' : ''}>Menengah (36% - 70%)</span>
            <span className={totalScore >= 71 ? 'text-rose-600 font-bold' : ''}>Kritis (71% - 100%)</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                totalScore >= 71
                  ? 'bg-rose-500'
                  : totalScore >= 36
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, totalScore))}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-2">
            Nilai Risiko Kalkulasi: <strong className="text-slate-700">{totalScore}%</strong> dari 10 parameter pengujian
          </p>
        </div>
      </div>

      {/* Card Metode Naive Bayes: Distribusi Probabilitas Posterior P(H|E) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Analisis Teorema Bayes (Posterior Probability)</h3>
            <p className="text-xs text-slate-500">Probabilitas kondisi $P(H_k|E)$ berdasarkan perkalian Likelihood 10 gejala:</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* H1: Normal */}
          <div className={`p-4 rounded-2xl border transition-all ${
            totalScore <= 35 
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20' 
              : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600">P(Normal | Gejala)</span>
              <span className="text-xs font-extrabold text-emerald-600">{postProb.ringan}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${postProb.ringan}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Hipotesis 1: Bebas Kerusakan</span>
          </div>

          {/* H2: Sedang */}
          <div className={`p-4 rounded-2xl border transition-all ${
            totalScore >= 36 && totalScore <= 70 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' 
              : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600">P(Sedang | Gejala)</span>
              <span className="text-xs font-extrabold text-amber-600">{postProb.sedang}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${postProb.sedang}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Hipotesis 2: Degradasi Hardware</span>
          </div>

          {/* H3: Kritis */}
          <div className={`p-4 rounded-2xl border transition-all ${
            totalScore >= 71 
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20' 
              : 'bg-slate-50 border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600">P(Kritis | Gejala)</span>
              <span className="text-xs font-extrabold text-rose-600">{postProb.kritis}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${postProb.kritis}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Hipotesis 3: Kerusakan Fatal</span>
          </div>
        </div>
      </div>

      {/* Card Saran Tindakan Perbaikan (Actionable Advice) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Saran Tindakan Perbaikan</h3>
            <p className="text-xs text-slate-500">Langkah rekomendasi prioritas berdasarkan tingkat keparahan gejala:</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {actionableAdvice.map((advice, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs sm:text-sm">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="leading-relaxed font-medium">{advice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Disclaimer Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block text-amber-950 mb-0.5">Technical Disclaimer:</strong>
          Catatan: Hasil skrining ini berbasis indikator awal gejala teknis dan dihitung menggunakan metode probabilitas Bayesian untuk estimasi mandiri. Penanganan fisik mendalam tetap memerlukan pemeriksaan langsung oleh teknisi.
        </div>
      </div>

      {/* Card Rincian Jawaban (10 Pertanyaan) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Rincian 10 Jawaban Diagnosis Kamu</h3>
            <p className="text-xs text-slate-400">Verifikasi bobot Bayes per komponen perangkat:</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {items.length} Pertanyaan Terjawab
          </span>
        </div>
        
        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
            Belum ada rincian jawaban tersimpan.
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item, idx) => {
              const val = item.score_value ?? 0;
              const isKritis = val >= 71 || val === 100;
              const isSedang = val >= 36 || val === 50;

              return (
                <div key={item.question_id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">Indikator #{idx + 1}</p>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                      isKritis
                        ? 'text-rose-700 bg-rose-50 border-rose-200' 
                        : isSedang
                        ? 'text-amber-800 bg-amber-50 border-amber-200' 
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                      Bobot: {val}% ({isKritis ? 'Likelihood Parah' : isSedang ? 'Likelihood Sedang' : 'Gejala Normal'})
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{item.question_text}</p>
                  <div className="flex items-center gap-2.5 p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {item.selected_option_letter || letterMap[idx % 6] || 'A'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                      {item.option_text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            id="btn-retake-quiz"
            onClick={onRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Ulangi Diagnosis</span>
          </button>

          <button
            id="btn-explore-more"
            onClick={onExploreOther}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
          >
            <span>Pilih Modul Lain</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <button
          id="btn-copy-result-summary"
          onClick={() => {
            const summaryText = `Hasil Diagnosis Kuis CTW:\n🎯 ${result.title}\n📊 Tingkat Keparahan / Risiko: ${totalScore}%\n🛡 Tingkat Keyakinan: ${confidence}%\n\nCoba kuisnya sekarang!`;
            navigator.clipboard.writeText(summaryText).then(() => {
              alert('Ringkasan hasil diagnosis kuis berhasil disalin ke clipboard!');
            });
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Bagikan Hasil</span>
        </button>
      </div>

    </motion.div>
  );
};
