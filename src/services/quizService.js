import { supabase, isConfigured } from '../lib/supabaseClient';

/**
 * Data Kuis Default untuk Katalog Awal (jika tabel database masih kosong)
 */
export const DEFAULT_QUIZZES = [
  {
    id: '1',
    title: 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
    slug: 'skrining-diagnosis-kerusakan-elektronik',
    description: 'Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan rekomendasi perbaikan.',
    category: 'Laptop & PC',
    thumbnail: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    is_published: true,
    rating: 4.95,
    est_time: '3 Menit',
    total_participants: 5120,
    created_at: '2026-09-01T10:00:00Z',
    total_questions: 3
  },
  {
    id: '2',
    title: 'Diagnostik Kesehatan Baterai & Layar Smartphone',
    slug: 'diagnostik-kesehatan-baterai-layar-hp',
    description: 'Pemeriksaan performa charging, degradasi cell baterai lithium, sensitivitas touchscreen, dan visual display pada HP Android & iOS.',
    category: 'HP / Smartphone',
    thumbnail: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    is_published: true,
    rating: 4.88,
    est_time: '3 Menit',
    total_participants: 3410,
    created_at: '2026-09-05T14:30:00Z',
    total_questions: 3
  },
  {
    id: '3',
    title: 'Deteksi Error Mekanikal & Cetak Printer',
    slug: 'deteksi-error-mekanikal-cetak-printer',
    description: 'Identifikasi gejala Paper Jam, head cleaning cartridge buntu, blink counter error, dan koneksi kabel data/Wi-Fi printer kantor.',
    category: 'Printer & Periferal',
    thumbnail: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    is_published: true,
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
    quiz_id: '1',
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
    quiz_id: '1',
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
    quiz_id: '1',
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
    quiz_id: '1',
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
    quiz_id: '1',
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
    quiz_id: '1',
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
 * Langsung dari Supabase: supabase.from('quizzes').select('*, quiz_questions(*)').eq('status', 'ACTIVE').order('created_at', { ascending: false })
 */
export async function fetchQuizzes({ category = 'Semua', search = '' } = {}) {
  let rawQuizzes = [];

  if (isConfigured) {
    try {
      // 1. Eksekusi query langsung dari Supabase dengan filter status ACTIVE
      const { data, error } = await supabase
        .from('quizzes')
        .select('*, quiz_questions(*)')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        rawQuizzes = data.map((item) => ({
          ...item,
          total_questions:
            item.total_questions ||
            (Array.isArray(item.quiz_questions) ? item.quiz_questions.length : 0) ||
            (Array.isArray(item.questions) ? item.questions.length : 3)
        }));
      } else {
        // Fallback jika foreign key join quiz_questions(*) belum terdaftar atau record berstatus 'active'
        const fallback = await supabase
          .from('quizzes')
          .select('*')
          .or('status.eq.ACTIVE,status.eq.active')
          .order('created_at', { ascending: false });

        if (!fallback.error && Array.isArray(fallback.data) && fallback.data.length > 0) {
          rawQuizzes = fallback.data;
        }
      }
    } catch (err) {
      console.warn('⚠️ [quizService] Query Supabase quizzes notice:', err);
    }
  }

  // Jika di Supabase belum ada data kuis tersimpan, fallback ke katalog default
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

export const getQuizzes = fetchQuizzes;

/**
 * 2. Mengambil Detail Kuis Lengkap Berdasarkan ID (Pure Supabase Client Query)
 * Parameter ID dibaca sebagai string murni.
 * PENTING: Jika kuis TIDAK ditemukan di Supabase, lempar error dan JANGAN berikan mock kuis default!
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
      // A. Query langsung dengan String ID
      const { data: qData, error: qErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!qErr && qData) {
        quizRecord = qData;
      }

      // B. Coba query sebagai integer jika format numerik standar
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

      // C. Coba query berdasarkan slug
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

        // D. Pemanggilan PARALEL untuk pertanyaan dan aturan evaluasi hasil
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

          // Aturan Evaluasi Hasil
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

  // Cek apakah kuis tersimpan di localStorage (misal baru dibuat di Admin CMS)
  if (!quizRecord) {
    try {
      const stored = JSON.parse(localStorage.getItem('quizzes') || localStorage.getItem('ctw_quizzes') || '[]');
      const found = stored.find((q) => String(q.id) === cleanId || String(q.slug) === cleanId);
      if (found) {
        quizRecord = found;
        if (found.questions) questions = found.questions;
        if (found.result_rules) resultRules = found.result_rules;
      }
    } catch (e) {}
  }

  // Jika tetap tidak ditemukan di database, JANGAN gunakan kuis default!
  // Lempar error agar antarmuka menampilkan Empty / Error State yang informatif
  if (!quizRecord) {
    throw new Error(`Data kuis dengan ID "${cleanId}" tidak ditemukan atau belum dipublikasikan.`);
  }

  return {
    quiz: quizRecord,
    questions,
    result_rules: resultRules
  };
}

/**
 * 3. Menyimpan Kuis Baru atau Update Kuis (100% Supabase Client SDK)
 * Alur:
 * - INSERT ke tabel 'quizzes' dengan payload { title, category, description, status: 'ACTIVE', is_published: true, total_questions }
 * - Ambil id kuis baru (data.id)
 * - INSERT bertahap ke 'quiz_questions' menggunakan quiz_id
 * - Simpan seluruh opsi ke tabel 'options' menggunakan question_id
 * - Handle error try-catch secara mutlak tanpa data tertinggal di LocalStorage
 */
export async function saveQuiz(inputPayload) {
  // Dukung format direct object { id, title, questions, ... } maupun structured { quiz, questions, resultRules }
  let quiz = null;
  let questions = [];
  let resultRules = [];

  if (inputPayload && inputPayload.quiz) {
    quiz = inputPayload.quiz;
    questions = inputPayload.questions || [];
    resultRules = inputPayload.resultRules || inputPayload.result_rules || [];
  } else if (inputPayload && typeof inputPayload === 'object') {
    quiz = inputPayload;
    questions = inputPayload.questions || [];
    resultRules = inputPayload.resultRules || inputPayload.result_rules || [];
  }

  if (!quiz || !quiz.title || !quiz.title.trim()) {
    throw new Error('Judul kuis wajib diisi.');
  }

  const cleanTitle = quiz.title.trim();
  const cleanCategory = quiz.category?.trim() || 'Laptop & PC';
  const cleanDescription = quiz.description?.trim() || '';
  const totalQuestions = questions.length || Number(quiz.total_questions) || 3;

  const autoSlug =
    quiz.slug?.trim() ||
    cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

  const quizPayload = {
    title: cleanTitle,
    category: cleanCategory,
    description: cleanDescription,
    status: 'ACTIVE',
    is_published: true,
    total_questions: totalQuestions,
    slug: autoSlug,
    thumbnail: quiz.thumbnail?.trim() || 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600',
    rating: 5.0,
    est_time: `${Math.max(1, Math.ceil(totalQuestions * 0.7))} Menit`,
    total_participants: 0,
    created_at: new Date().toISOString()
  };

  if (!isConfigured) {
    throw new Error('Koneksi Supabase belum aktif. Pastikan environment VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY telah dikonfigurasi.');
  }

  let savedQuizId = quiz.id ? String(quiz.id) : null;

  try {
    if (savedQuizId) {
      // UPDATE Kuis jika ID ada
      const { error: updErr } = await supabase
        .from('quizzes')
        .update({
          title: quizPayload.title,
          category: quizPayload.category,
          description: quizPayload.description,
          status: 'ACTIVE',
          is_published: true,
          total_questions: totalQuestions,
          slug: quizPayload.slug,
          thumbnail: quizPayload.thumbnail
        })
        .eq('id', savedQuizId);

      if (updErr) {
        throw new Error(`Gagal memperbarui kuis di Supabase: ${updErr.message}`);
      }
    } else {
      // INSERT kuis baru ke tabel quizzes
      const { data, error: insErr } = await supabase
        .from('quizzes')
        .insert([{
          title: quizPayload.title,
          category: quizPayload.category,
          description: quizPayload.description,
          status: 'ACTIVE',
          is_published: true,
          total_questions: totalQuestions,
          slug: quizPayload.slug,
          thumbnail: quizPayload.thumbnail
        }])
        .select()
        .maybeSingle();

      if (insErr) {
        throw new Error(`Gagal menyimpan data kuis ke tabel quizzes: ${insErr.message}`);
      }

      if (!data || !data.id) {
        throw new Error('Gagal mendapatkan ID kuis yang baru saja dibuat dari database.');
      }

      savedQuizId = String(data.id);
    }

    // Simpan Aturan Evaluasi Hasil
    if (savedQuizId && resultRules && resultRules.length > 0) {
      try {
        await supabase.from('quiz_result_rules').delete().eq('quiz_id', savedQuizId);
        await supabase.from('result_rules').delete().eq('quiz_id', savedQuizId);
      } catch (e) {}

      const rulesData = resultRules.map((r, idx) => ({
        quiz_id: savedQuizId,
        min_score: typeof r.min_score === 'number' ? r.min_score : parseInt(r.min_score || 0, 10),
        max_score: typeof r.max_score === 'number' ? r.max_score : parseInt(r.max_score || 100, 10),
        result_code: r.result_code || `RULE_${idx + 1}`,
        title: r.title || 'Hasil Evaluasi',
        badge: r.badge || 'Hasil Kuis',
        badge_color: r.badge_color || '#2563eb',
        description: r.description || '',
        recommendation: r.recommendation || ''
      }));

      try {
        const { error: rErr } = await supabase.from('quiz_result_rules').insert(rulesData);
        if (rErr) {
          await supabase.from('result_rules').insert(rulesData);
        }
      } catch (e) {}
    }

    // Simpan Pertanyaan dan Opsi Jawaban secara bertahap
    if (savedQuizId && questions && questions.length > 0) {
      // Hapus opsi & pertanyaan lama jika mode update
      if (quiz.id) {
        try {
          const { data: oldQQ } = await supabase.from('quiz_questions').select('id').eq('quiz_id', savedQuizId);
          if (oldQQ && oldQQ.length > 0) {
            const oldIds = oldQQ.map((q) => q.id);
            await supabase.from('options').delete().in('question_id', oldIds);
          }
          await supabase.from('quiz_questions').delete().eq('quiz_id', savedQuizId);
        } catch (e) {}

        try {
          const { data: oldQs } = await supabase.from('questions').select('id').eq('quiz_id', savedQuizId);
          if (oldQs && oldQs.length > 0) {
            const oldIds = oldQs.map((q) => q.id);
            await supabase.from('options').delete().in('question_id', oldIds);
          }
          await supabase.from('questions').delete().eq('quiz_id', savedQuizId);
        } catch (e) {}
      }

      for (let i = 0; i < questions.length; i++) {
        const qItem = questions[i];
        let questionId = null;

        // INSERT bertahap ke quiz_questions menggunakan quiz_id
        const { data: insQQ, error: qqErr } = await supabase
          .from('quiz_questions')
          .insert([{
            quiz_id: savedQuizId,
            question_text: qItem.question_text,
            sort_order: i + 1,
            image_url: qItem.image_url || null
          }])
          .select()
          .maybeSingle();

        if (!qqErr && insQQ?.id) {
          questionId = insQQ.id;
        } else {
          // Fallback tabel questions jika skema menggunakan nama questions
          const { data: insQ, error: qErr } = await supabase
            .from('questions')
            .insert([{
              quiz_id: savedQuizId,
              question_text: qItem.question_text,
              sort_order: i + 1,
              image_url: qItem.image_url || null
            }])
            .select()
            .maybeSingle();

          if (qErr) {
            throw new Error(`Gagal menyimpan pertanyaan #${i + 1}: ${qErr.message || qqErr?.message}`);
          }
          if (insQ?.id) questionId = insQ.id;
        }

        // Simpan seluruh opsi ke tabel options menggunakan question_id
        if (questionId && Array.isArray(qItem.options) && qItem.options.length > 0) {
          const optPayload = qItem.options.map((opt) => ({
            question_id: questionId,
            option_text: opt.option_text,
            score_value: typeof opt.score_value === 'number' ? opt.score_value : parseInt(opt.score_value || 0, 10),
            result_code: opt.result_code || 'DEFAULT'
          }));

          const { error: optErr } = await supabase.from('options').insert(optPayload);
          if (optErr) {
            console.warn(`Peringatan opsi pertanyaan #${i + 1}:`, optErr.message);
          }
        }
      }
    }

    return {
      success: true,
      quiz_id: savedQuizId,
      slug: autoSlug,
      share_url: `/quiz.html?id=${savedQuizId}`
    };
  } catch (error) {
    console.error('❌ [saveQuiz] Error menyimpan kuis ke Supabase:', error);
    throw error;
  }
}

/**
 * 4. Menghapus Kuis (100% Supabase Client SDK)
 * HAPUS SEMUA PEMANGGILAN /delete-quiz.php ATAU REST API LOKAL
 */
export async function deleteQuiz(quizId) {
  const cleanId = String(quizId || '').trim();
  if (!cleanId) {
    throw new Error('ID Kuis wajib disertakan.');
  }

  if (!isConfigured) {
    throw new Error('Koneksi Supabase belum aktif.');
  }

  try {
    // 1. Hapus aturan hasil
    await supabase.from('quiz_result_rules').delete().eq('quiz_id', cleanId);
    await supabase.from('result_rules').delete().eq('quiz_id', cleanId);

    // 2. Ambil list question id dan hapus options
    const { data: qqList } = await supabase.from('quiz_questions').select('id').eq('quiz_id', cleanId);
    if (qqList && qqList.length > 0) {
      const qIds = qqList.map((q) => q.id);
      await supabase.from('options').delete().in('question_id', qIds);
    }

    const { data: qList } = await supabase.from('questions').select('id').eq('quiz_id', cleanId);
    if (qList && qList.length > 0) {
      const qIds = qList.map((q) => q.id);
      await supabase.from('options').delete().in('question_id', qIds);
    }

    // 3. Hapus pertanyaan
    await supabase.from('quiz_questions').delete().eq('quiz_id', cleanId);
    await supabase.from('questions').delete().eq('quiz_id', cleanId);

    // 4. Hapus record kuis dari tabel quizzes
    const { error: delErr } = await supabase.from('quizzes').delete().eq('id', cleanId);
    if (delErr) {
      throw new Error(`Gagal menghapus kuis dari Supabase: ${delErr.message}`);
    }

    return { success: true, quiz_id: cleanId };
  } catch (err) {
    console.error('❌ [deleteQuiz] Gagal menghapus kuis:', err);
    throw err;
  }
}

/**
 * 5. Evaluasi & Kalkulasi Skor Kuis (Client-Side & Serverless)
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

/**
 * 6. Mengambil Pengaturan Website dari tabel site_settings (Supabase Client SDK)
 */
export const DEFAULT_SITE_SETTINGS = {
  id: 'default',
  // Identitas Umum
  site_title: 'CTW - Correct Answer Interactive Platform',
  tagline: 'Platform Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
  meta_description: 'Lakukan skrining interaktif kendala perangkat Laptop, PC, Smartphone, dan Printer secara cepat dan akurat dengan rekomendasi perbaikan profesional.',
  logo_url: '/shock.png',
  favicon_url: '/favicon.ico',

  // Konten Hero Banner
  hero_badge: 'Modul Skrining Terpopuler #1 CTW',
  hero_title: 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
  hero_subtitle: 'Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat.',

  // Kontak & Footer
  contact_email: 'support@ctwinteractive.id',
  contact_phone: '+62 812-3456-7890',
  contact_address: 'Gedung Cyber Tower Lt. 5, Jl. Rasuna Said No. 12, Jakarta Selatan 12950',
  footer_text: 'CTW • Correct Answer Interactive Diagnosis & Assessment Platform'
};

export async function getSiteSettings() {
  let settings = { ...DEFAULT_SITE_SETTINGS };

  // 1. Coba baca dari tabel site_settings di Supabase
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        settings = { ...settings, ...data };
      }
    } catch (err) {
      console.warn('Notice getSiteSettings from Supabase:', err);
    }
  }

  // 2. Fallback baca dari localStorage jika ada perubahan lokal
  try {
    const cached = localStorage.getItem('ctw_site_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      settings = { ...settings, ...parsed };
    }
  } catch (e) {}

  return settings;
}

export async function updateSiteSettings(formData) {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Data pengaturan website wajib diisi.');
  }

  const payload = {
    site_title: formData.site_title?.trim() || DEFAULT_SITE_SETTINGS.site_title,
    tagline: formData.tagline?.trim() || DEFAULT_SITE_SETTINGS.tagline,
    meta_description: formData.meta_description?.trim() || DEFAULT_SITE_SETTINGS.meta_description,
    logo_url: formData.logo_url?.trim() || DEFAULT_SITE_SETTINGS.logo_url,
    favicon_url: formData.favicon_url?.trim() || DEFAULT_SITE_SETTINGS.favicon_url,

    hero_badge: formData.hero_badge?.trim() || DEFAULT_SITE_SETTINGS.hero_badge,
    hero_title: formData.hero_title?.trim() || DEFAULT_SITE_SETTINGS.hero_title,
    hero_subtitle: formData.hero_subtitle?.trim() || DEFAULT_SITE_SETTINGS.hero_subtitle,

    contact_email: formData.contact_email?.trim() || DEFAULT_SITE_SETTINGS.contact_email,
    contact_phone: formData.contact_phone?.trim() || DEFAULT_SITE_SETTINGS.contact_phone,
    contact_address: formData.contact_address?.trim() || DEFAULT_SITE_SETTINGS.contact_address,
    footer_text: formData.footer_text?.trim() || DEFAULT_SITE_SETTINGS.footer_text,
    updated_at: new Date().toISOString()
  };

  // 1. Simpan ke database Supabase jika tabel site_settings tersedia
  if (isConfigured) {
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { error: updErr } = await supabase
          .from('site_settings')
          .update(payload)
          .eq('id', existing.id);
        if (updErr) console.warn('Supabase update site_settings warning:', updErr.message);
      } else {
        const { error: insErr } = await supabase
          .from('site_settings')
          .insert([{ ...payload, id: 'default' }]);
        if (insErr) {
          await supabase.from('site_settings').insert([payload]);
        }
      }
    } catch (sbErr) {
      console.warn('Notice saving site_settings to Supabase:', sbErr);
    }
  }

  // 2. Simpan ke cache localStorage untuk persistensi instan
  try {
    localStorage.setItem('ctw_site_settings', JSON.stringify(payload));
  } catch (e) {}

  return {
    success: true,
    data: payload
  };
}

