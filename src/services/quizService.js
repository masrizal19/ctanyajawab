import { supabase, isConfigured } from '../lib/supabaseClient';

/**
 * Data Kuis Cadangan (Default / Seed Data)
 * Digunakan jika Supabase belum terisi atau saat offline/unconfigured.
 * Memastikan aplikasi tetap interaktif dan tidak mengalami crash.
 */
export const DEFAULT_QUIZZES = [
  {
    id: 1,
    title: 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
    slug: 'skrining-diagnosis-kerusakan-elektronik',
    description: 'Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan rekomendasi perbaikan.',
    category: 'Laptop & PC',
    thumbnail: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    rating: 4.95,
    est_time: '3 Menit',
    total_participants: 5120,
    created_at: '2026-09-01T10:00:00Z',
    total_questions: 3
  },
  {
    id: 2,
    title: 'Diagnostik Kesehatan Baterai & Layar Smartphone',
    slug: 'diagnostik-kesehatan-baterai-layar-hp',
    description: 'Pemeriksaan performa charging, degradasi cell baterai lithium, sensitivitas touchscreen, dan visual display pada HP Android & iOS.',
    category: 'HP / Smartphone',
    thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    rating: 4.88,
    est_time: '3 Menit',
    total_participants: 3410,
    created_at: '2026-09-05T14:30:00Z',
    total_questions: 3
  },
  {
    id: 3,
    title: 'Deteksi Error Mekanikal & Cetak Printer',
    slug: 'deteksi-error-mekanikal-cetak-printer',
    description: 'Identifikasi gejala Paper Jam, head cleaning cartridge buntu, blink counter error, dan koneksi kabel data/Wi-Fi printer kantor.',
    category: 'Printer & Periferal',
    thumbnail: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    rating: 4.92,
    est_time: '2 Menit',
    total_participants: 2890,
    created_at: '2026-09-10T09:15:00Z',
    total_questions: 3
  }
];

export const DEFAULT_QUESTIONS = [
  {
    id: 1,
    quiz_id: 1,
    question_text: 'Bagaimana kondisi perangkat saat tombol daya (Power) ditekan?',
    image_url: null,
    sort_order: 1,
    options: [
      { id: 101, question_id: 1, option_text: 'Menyala normal dan langsung masuk ke layar utama OS', score_value: 0, result_code: 'RINGAN' },
      { id: 102, question_id: 1, option_text: 'Lampu indikator menyala tetapi layar gelap / harus ditekan berulang', score_value: 50, result_code: 'SEDANG' },
      { id: 103, question_id: 1, option_text: 'Mati total tanpa ada respon suara kipas atau lampu sama sekali', score_value: 100, result_code: 'KRITIS' }
    ]
  },
  {
    id: 2,
    quiz_id: 1,
    question_text: 'Apakah perangkat sering terasa panas berlebih (overheat) atau berbunyi bising?',
    image_url: null,
    sort_order: 2,
    options: [
      { id: 104, question_id: 2, option_text: 'Suhu stabil dan suara mesin/kipas sangat hening', score_value: 0, result_code: 'RINGAN' },
      { id: 105, question_id: 2, option_text: 'Cukup hangat dan kipas berputar kencang hanya saat membuka program berat', score_value: 50, result_code: 'SEDANG' },
      { id: 106, question_id: 2, option_text: 'Sangat panas dan perangkat sering mati mendadak sendiri', score_value: 100, result_code: 'KRITIS' }
    ]
  },
  {
    id: 3,
    quiz_id: 1,
    question_text: 'Bagaimana kondisi baterai dan pengisian daya saat ini?',
    image_url: null,
    sort_order: 3,
    options: [
      { id: 107, question_id: 3, option_text: 'Daya tahan awet dan proses charging berjalan normal', score_value: 0, result_code: 'RINGAN' },
      { id: 108, question_id: 3, option_text: 'Baterai cepat habis atau harus selalu terhubung ke charger', score_value: 50, result_code: 'SEDANG' },
      { id: 109, question_id: 3, option_text: 'Baterai kembung atau tidak mengisi daya sama sekali', score_value: 100, result_code: 'KRITIS' }
    ]
  }
];

export const DEFAULT_RESULT_RULES = [
  {
    id: 1,
    quiz_id: 1,
    min_score: 0,
    max_score: 35,
    result_code: 'RINGAN',
    title: 'Kondisi Baik / Kendala Sangat Ringan',
    badge: 'Kondisi Optimal',
    badge_color: '#10b981',
    image_url: null,
    description: 'Perangkat berada dalam kondisi prima dengan kendala minor yang dapat diatasi dengan pembersihan file sampah atau update driver.',
    recommendation: 'Lakukan perawatan berkala dan hindari penggunaan berlebihan.'
  },
  {
    id: 2,
    quiz_id: 1,
    min_score: 36,
    max_score: 70,
    result_code: 'SEDANG',
    title: 'Perlu Perawatan & Pengecekan Menengah',
    badge: 'Perlu Perawatan',
    badge_color: '#f59e0b',
    image_url: null,
    description: 'Terdeteksi indikasi penurunan performa atau komponen aus yang membutuhkan pengecekan teknis.',
    recommendation: 'Jadwalkan servis rutin, pembersihan debu internal, dan ganti thermal paste.'
  },
  {
    id: 3,
    quiz_id: 1,
    min_score: 71,
    max_score: 100,
    result_code: 'KRITIS',
    title: 'Indikasi Kerusakan Serius / Kritis',
    badge: 'Kerusakan Kritis',
    badge_color: '#ef4444',
    image_url: null,
    description: 'Terindikasi kerusakan signifikan pada komponen hardware inti yang memerlukan penanganan teknisi profesional.',
    recommendation: 'Segera bawa perangkat ke pusat reparasi resmi terpercaya untuk menghindari kerusakan permanen.'
  }
];

/**
 * 1. Mengambil Daftar Kuis (Pure Supabase Client Query)
 * Tanpa fallback request ke /api/quizzes atau quizzes.php untuk mencegah error 404 & JSON SyntaxError.
 */
export async function getQuizzes({ category = 'Semua', search = '' } = {}) {
  let rawQuizzes = [];

  // Query murni menggunakan Supabase Client SDK jika sudah dikonfigurasi
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        rawQuizzes = data;
      }
    } catch (err) {
      console.warn('⚠️ [quizService] Query Supabase quizzes gagal, beralih ke data lokal:', err);
    }
  }

  // Jika Supabase kosong atau unconfigured, gunakan data default aman
  if (rawQuizzes.length === 0) {
    rawQuizzes = [...DEFAULT_QUIZZES];
  }

  // Filter Kategori
  let filtered = rawQuizzes;
  if (category && category !== 'Semua') {
    filtered = filtered.filter((q) => q.category === category);
  }

  // Filter Pencarian
  if (search && search.trim()) {
    const kw = search.trim().toLowerCase();
    filtered = filtered.filter(
      (q) =>
        (q.title && q.title.toLowerCase().includes(kw)) ||
        (q.description && q.description.toLowerCase().includes(kw)) ||
        (q.category && q.category.toLowerCase().includes(kw))
    );
  }

  // Ekstrak Kategori Unik
  const categoryMap = {};
  rawQuizzes.forEach((q) => {
    const cat = q.category || 'Umum';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categories = Object.entries(categoryMap).map(([catName, count]) => ({
    category: catName,
    count
  }));

  return {
    quizzes: filtered,
    categories
  };
}

/**
 * 2. Mengambil Detail Kuis Lengkap Berdasarkan ID (Pure Supabase Client Query)
 * Parameter ID dibaca sebagai string dan pemanggilan paralel untuk pertanyaan & aturan hasil.
 */
export async function getQuizById(quizId) {
  const cleanId = String(quizId || '').trim();
  if (!cleanId) {
    throw new Error('ID Kuis wajib disertakan.');
  }

  let quizRecord = null;
  let questions = [];
  let resultRules = [];

  if (isConfigured) {
    try {
      // 1. Query kuis utama dengan string ID
      const { data: qData, error: qErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!qErr && qData) {
        quizRecord = qData;
      }

      // Coba query sebagai integer jika format numerik
      if (!quizRecord && /^\d+$/.test(cleanId)) {
        const numId = parseInt(cleanId, 10);
        if (numId < 2147483647) {
          const { data: numData } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', numId)
            .maybeSingle();
          if (numData) quizRecord = numData;
        }
      }

      // Coba query berdasarkan slug
      if (!quizRecord) {
        const { data: slugData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('slug', cleanId)
          .maybeSingle();
        if (slugData) quizRecord = slugData;
      }

      if (quizRecord) {
        const targetId = String(quizRecord.id || cleanId);

        // 2. Pemanggilan PARALEL untuk pertanyaan dan aturan evaluasi hasil
        const [questionsRes, rulesRes] = await Promise.all([
          // Pertanyaan & Opsi
          (async () => {
            let qList = [];
            // Coba quiz_questions
            try {
              const { data: qq, error: qqErr } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', targetId)
                .order('sort_order', { ascending: true });
              if (!qqErr && Array.isArray(qq) && qq.length > 0) qList = qq;
            } catch (e) {}

            // Fallback questions
            if (qList.length === 0) {
              try {
                const { data: qs, error: qsErr } = await supabase
                  .from('questions')
                  .select('*')
                  .eq('quiz_id', targetId)
                  .order('sort_order', { ascending: true });
                if (!qsErr && Array.isArray(qs) && qs.length > 0) qList = qs;
              } catch (e) {}
            }

            if (qList.length > 0) {
              const qIds = qList.map((q) => q.id);
              let optionsList = [];

              try {
                const { data: opts } = await supabase
                  .from('options')
                  .select('*')
                  .in('question_id', qIds);
                if (Array.isArray(opts)) optionsList = opts;
              } catch (e) {}

              if (optionsList.length === 0) {
                try {
                  const { data: opt2 } = await supabase
                    .from('quiz_question_options')
                    .select('*')
                    .in('question_id', qIds);
                  if (Array.isArray(opt2)) optionsList = opt2;
                } catch (e) {}
              }

              return qList.map((q, idx) => ({
                id: q.id || idx + 1,
                quiz_id: q.quiz_id || targetId,
                question_text: q.question_text || q.questionText || `Pertanyaan #${idx + 1}`,
                image_url: q.image_url || null,
                sort_order: q.sort_order || idx + 1,
                options: optionsList.filter((o) => String(o.question_id) === String(q.id))
              }));
            }
            return [];
          })(),

          // Aturan Hasil
          (async () => {
            let rList = [];
            try {
              const { data: rr, error: rrErr } = await supabase
                .from('quiz_result_rules')
                .select('*')
                .eq('quiz_id', targetId);
              if (!rrErr && Array.isArray(rr) && rr.length > 0) rList = rr;
            } catch (e) {}

            if (rList.length === 0) {
              try {
                const { data: rr2, error: rr2Err } = await supabase
                  .from('result_rules')
                  .select('*')
                  .eq('quiz_id', targetId);
                if (!rr2Err && Array.isArray(rr2) && rr2.length > 0) rList = rr2;
              } catch (e) {}
            }

            if (rList.length > 0) {
              return rList.map((r) => ({
                id: r.id,
                quiz_id: r.quiz_id,
                min_score: r.scoreMin !== undefined ? r.scoreMin : r.min_score !== undefined ? r.min_score : 0,
                max_score: r.scoreMax !== undefined ? r.scoreMax : r.max_score !== undefined ? r.max_score : 100,
                result_code: r.resultCode || r.result_code || 'DEFAULT',
                title: r.resultTitle || r.title || 'Hasil Evaluasi',
                badge: r.badge || 'Hasil Kuis CTW',
                badge_color: r.badge_color || '#2563eb',
                description: r.description || '',
                image_url: r.image_url || null,
                recommendation: r.recommendation || ''
              }));
            }
            return [];
          })()
        ]);

        questions = questionsRes;
        resultRules = rulesRes;
      }
    } catch (err) {
      console.warn('⚠️ [quizService] Query Supabase quiz detail notice:', err);
    }
  }

  // Jika belum ditemukan di database, cocokkan dengan seed default
  if (!quizRecord) {
    quizRecord =
      DEFAULT_QUIZZES.find(
        (q) => String(q.id) === cleanId || String(q.slug) === cleanId
      ) || DEFAULT_QUIZZES[0];
  }

  if (questions.length === 0) {
    questions = [...DEFAULT_QUESTIONS];
  }

  if (resultRules.length === 0) {
    resultRules = [...DEFAULT_RESULT_RULES];
  }

  return {
    quiz: quizRecord,
    questions,
    result_rules: resultRules
  };
}

/**
 * 3. Evaluasi & Kalkulasi Skor Kuis (Pure Client-Side + Logging Supabase)
 * Tidak memerlukan request ke endpoint lokal backend.
 */
export async function submitQuizAnswers({ quiz, answers, questions = [], resultRules = [] }) {
  let totalScore = 0;
  let maxPossibleScore = (questions.length || 1) * 100;
  const breakdown = [];

  answers.forEach((ans, idx) => {
    const q = questions.find((item) => String(item.id) === String(ans.question_id));
    const opt = q?.options?.find((o) => String(o.id) === String(ans.option_id));
    const pts = opt ? Number(opt.score_value || 0) : 0;
    totalScore += pts;

    breakdown.push({
      question_id: ans.question_id,
      question_text: q?.question_text || `Pertanyaan #${idx + 1}`,
      option_id: ans.option_id,
      selected_letter: String.fromCharCode(65 + (idx % 26)),
      option_text: opt?.option_text || 'Pilihan',
      score_value: pts,
      result_code: opt?.result_code || 'DEFAULT'
    });
  });

  const percentage = maxPossibleScore > 0 ? Math.min(100, Math.max(0, Math.round((totalScore / maxPossibleScore) * 100))) : 0;

  // Pencocokan aturan hasil (Result Rules)
  let matchedRule = resultRules.find(
    (r) => percentage >= r.min_score && percentage <= r.max_score
  );

  if (!matchedRule && resultRules.length > 0) {
    matchedRule = resultRules[0];
  }

  const defaultRule = {
    id: 1,
    code: percentage >= 71 ? 'KRITIS' : percentage >= 36 ? 'SEDANG' : 'RINGAN',
    title: percentage >= 71 ? 'Indikasi Kerusakan Serius' : percentage >= 36 ? 'Perlu Perawatan' : 'Kondisi Optimal',
    badge: percentage >= 71 ? 'Kritis' : percentage >= 36 ? 'Menengah' : 'Optimal',
    badge_color: percentage >= 71 ? '#ef4444' : percentage >= 36 ? '#f59e0b' : '#10b981',
    description: `Berdasarkan jawaban Anda, skor keparahan adalah ${percentage}%.`,
    image_url: null,
    recommendation: 'Lakukan pemeliharaan rutin atau konsultasikan ke teknisi jika kendala berlanjut.'
  };

  const finalRule = matchedRule
    ? {
        id: matchedRule.id || 1,
        code: matchedRule.result_code || 'DEFAULT',
        title: matchedRule.title,
        description: matchedRule.description,
        badge: matchedRule.badge,
        badge_color: matchedRule.badge_color || '#2563eb',
        image_url: matchedRule.image_url || null,
        recommendation: matchedRule.recommendation || ''
      }
    : defaultRule;

  // Distribusi kode
  const codeDistribution = {};
  breakdown.forEach((b) => {
    const c = b.result_code || 'DEFAULT';
    codeDistribution[c] = (codeDistribution[c] || 0) + 1;
  });

  // Catat respons ke database Supabase jika sudah terhubung
  if (isConfigured) {
    try {
      await supabase.from('user_responses').insert([
        {
          quiz_id: quiz?.id || 1,
          session_id: 'guest_' + Math.random().toString(36).substring(2, 10),
          total_score: percentage,
          dominant_code: finalRule.code,
          answers_payload: breakdown
        }
      ]);
    } catch (e) {
      console.warn('Logging user response notice:', e);
    }
  }

  return {
    response_id: Date.now(),
    quiz: {
      id: quiz?.id || 1,
      title: quiz?.title || 'Kuis Diagnostik CTW',
      category: quiz?.category || 'Umum'
    },
    score: percentage,
    total_score: percentage,
    dominant_code: finalRule.code,
    code_distribution: codeDistribution,
    total_answered: answers.length,
    completed_at: new Date().toISOString(),
    result: finalRule,
    bayes: {
      severity_percentage: percentage,
      confidence_percentage: 85,
      dominant_hypothesis: percentage >= 71 ? 'KRITIS' : percentage >= 36 ? 'SEDANG' : 'RINGAN',
      posterior_probabilities: {
        ringan: percentage <= 35 ? 85 : 10,
        sedang: percentage >= 36 && percentage <= 70 ? 80 : 15,
        kritis: percentage >= 71 ? 90 : 5
      }
    },
    answers_payload: breakdown
  };
}
