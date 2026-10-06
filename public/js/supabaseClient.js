/**
 * ATW (Answer to Wrong) - Supabase Client & Data Service
 * Client-Side Direct Integration via @supabase/supabase-js v2 CDN
 */

(function (window) {
  'use strict';

  // 1. Inisialisasi Supabase Client & Environment Variables (Standar VITE_)
  const DEFAULT_SUPABASE_URL = "";
  const DEFAULT_SUPABASE_ANON_KEY = "";

  // Cek konfigurasi dari window (Vite Client Standard), localStorage, atau default placeholder
  let VITE_SUPABASE_URL =
    (typeof window !== 'undefined' &&
      (window.VITE_SUPABASE_URL ||
        localStorage.getItem('VITE_SUPABASE_URL') ||
        localStorage.getItem('CTW_VITE_SUPABASE_URL') ||
        localStorage.getItem('CTW_SUPABASE_URL') ||
        localStorage.getItem('ATW_SUPABASE_URL'))) ||
    DEFAULT_SUPABASE_URL;

  let VITE_SUPABASE_ANON_KEY =
    (typeof window !== 'undefined' &&
      (window.VITE_SUPABASE_ANON_KEY ||
        localStorage.getItem('VITE_SUPABASE_ANON_KEY') ||
        localStorage.getItem('CTW_VITE_SUPABASE_ANON_KEY') ||
        localStorage.getItem('CTW_SUPABASE_ANON_KEY') ||
        localStorage.getItem('ATW_SUPABASE_ANON_KEY'))) ||
    DEFAULT_SUPABASE_ANON_KEY;

  let supabaseClient = null;

  function initSupabaseClient(url, key) {
    if (url) VITE_SUPABASE_URL = url;
    if (key) VITE_SUPABASE_ANON_KEY = key;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      if (
        VITE_SUPABASE_URL &&
        VITE_SUPABASE_URL !== DEFAULT_SUPABASE_URL &&
        VITE_SUPABASE_ANON_KEY &&
        VITE_SUPABASE_ANON_KEY !== DEFAULT_SUPABASE_ANON_KEY
      ) {
        try {
          supabaseClient = window.supabase.createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
          console.info('✅ [Supabase] Client berhasil diinisialisasi:', VITE_SUPABASE_URL);
          return supabaseClient;
        } catch (err) {
          console.warn('⚠️ [Supabase] Gagal menginisialisasi client:', err.message);
        }
      }
    }
    return null;
  }

  // Initial attempt and auto-fetch from server API config if available on local server
  function checkAndInitConfig() {
    initSupabaseClient();
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isSupabaseConfigured() && isLocalHost && typeof fetch === 'function') {
      fetch('/api/config')
        .then((res) => res.json())
        .then((json) => {
          if (json?.data?.VITE_SUPABASE_URL && json?.data?.VITE_SUPABASE_ANON_KEY) {
            initSupabaseClient(json.data.VITE_SUPABASE_URL, json.data.VITE_SUPABASE_ANON_KEY);
          }
        })
        .catch(() => {});
    }
  }

  if (window.supabase) {
    checkAndInitConfig();
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      checkAndInitConfig();
    });
  }

  function isSupabaseConfigured() {
    return (
      supabaseClient !== null &&
      Boolean(VITE_SUPABASE_URL) &&
      VITE_SUPABASE_URL !== DEFAULT_SUPABASE_URL &&
      Boolean(VITE_SUPABASE_ANON_KEY) &&
      VITE_SUPABASE_ANON_KEY !== DEFAULT_SUPABASE_ANON_KEY
    );
  }

  function getClient() {
    if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
      initSupabaseClient();
    }
    return supabaseClient;
  }

  // ===================================================
  // 2. FITUR STORAGE BUCKET (UPLOAD & HAPUS GAMBAR)
  // ===================================================

  /**
   * Helper function untuk mengunggah file thumbnail kuis atau gambar pertanyaan ke Supabase Storage Bucket ('quiz-assets')
   * @param {File} file File gambar yang akan diunggah
   * @returns {Promise<string>} Public URL file yang diunggah
   */
  async function uploadQuizAsset(file) {
    if (!file) return null;

    const client = getClient();
    if (!isSupabaseConfigured() || !client) {
      console.warn('[Supabase Storage] Supabase credentials belum diisi. Menggunakan Data URL/Object URL sementara.');
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    const { data, error } = await client.storage
      .from('quiz-assets')
      .upload(filePath, file);

    if (error) {
      console.error('[Supabase Storage Upload Error]:', error);
      throw error;
    }

    const { data: publicUrlData } = client.storage
      .from('quiz-assets')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  /**
   * Helper function untuk menghapus aset file dari Supabase Storage Bucket ('quiz-assets')
   * @param {string} fullPublicUrl URL publik lengkap dari gambar
   */
  async function deleteQuizAsset(fullPublicUrl) {
    if (!fullPublicUrl) return;
    const client = getClient();
    if (!isSupabaseConfigured() || !client) return;

    const path = fullPublicUrl.split('/quiz-assets/')[1];
    if (path) {
      const { error } = await client.storage.from('quiz-assets').remove([path]);
      if (error) {
        console.warn('[Supabase Storage Remove Warning]:', error);
      }
    }
  }

  // ===================================================
  // 3. IMPLEMENTASI FITUR CRUD DATABASE
  // ===================================================

  /**
   * A. READ - Ambil daftar kuis aktif untuk halaman publik/katalog
   */
  async function fetchPublishedQuizzes() {
    const client = getClient();

    if (isSupabaseConfigured() && client) {
      try {
        // Coba query dengan 'is_published' = true sesuai spesifikasi
        let { data, error } = await client
          .from('quizzes')
          .select('*')
          .eq('is_published', true)
          .order('id', { ascending: false });

        // Fallback jika skema database menggunakan kolom 'status' = 'active'
        if (error || !data || data.length === 0) {
          const fallbackRes = await client
            .from('quizzes')
            .select('*')
            .eq('status', 'active')
            .order('id', { ascending: false });

          if (!fallbackRes.error && fallbackRes.data) {
            data = fallbackRes.data;
          }
        }

        if (data) {
          return data;
        }
      } catch (err) {
        console.error('[Supabase Error fetchPublishedQuizzes]:', err);
      }
    }

    // Fallback: ambil dari REST API server lokal jika Supabase belum terhubung
    try {
      let res = await fetch('/api/quizzes');
      if (res.ok) {
        const json = await res.json();
        return json.data?.quizzes || json.data || [];
      }
    } catch (e) {
      console.warn('Fallback local fetch failed:', e);
    }
    return [];
  }

  /**
   * A. READ - Ambil seluruh kuis untuk admin (published + draft)
   */
  async function fetchAdminQuizzes() {
    const client = getClient();

    if (isSupabaseConfigured() && client) {
      try {
        const { data, error } = await client
          .from('quizzes')
          .select('*, questions(id), user_responses(id)')
          .order('id', { ascending: false });

        if (error) throw error;

        // Normalisasi hitungan pertanyaan & peserta
        return (data || []).map(q => ({
          ...q,
          total_questions: q.questions ? q.questions.length : (q.total_questions || 0),
          total_participants: q.user_responses ? q.user_responses.length : (q.total_participants || 0)
        }));
      } catch (err) {
        console.error('[Supabase Error fetchAdminQuizzes]:', err);
      }
    }

    // Fallback REST API
    try {
      let res = await fetch('/api/admin/quizzes');
      if (res.ok) {
        const json = await res.json();
        return json.data?.quizzes || [];
      }
    } catch (e) {
      console.warn('Fallback admin fetch failed:', e);
    }
    return [];
  }

  /**
   * A. READ - Ambil detail kuis, pertanyaan, dan aturan evaluasi hasil via Supabase Client SDK
   * Menggunakan parameter ID sebagai String dan pemanggilan paralel untuk quiz_questions & quiz_result_rules
   * @param {number|string} quizId
   */
  async function fetchQuizDetail(quizId) {
    const client = getClient();
    const cleanId = String(quizId || '').trim();

    if (!cleanId) {
      throw new Error('ID Kuis tidak valid atau kosong.');
    }

    if (isSupabaseConfigured() && client) {
      try {
        // 1. Ambil data kuis utama dari tabel 'quizzes' dengan parameter ID sebagai string
        let quizRecord = null;

        // Coba query langsung dengan String ID
        try {
          const { data, error } = await client
            .from('quizzes')
            .select('*')
            .eq('id', cleanId)
            .maybeSingle();

          if (!error && data) {
            quizRecord = data;
          }
        } catch (e) {
          console.warn('[Supabase Notice] Query quizzes by string id:', e);
        }

        // Jika belum ditemukan dan ID berbentuk numerik integer standar (< 2147483647), coba sebagai number
        if (!quizRecord && /^\d+$/.test(cleanId)) {
          const numVal = parseInt(cleanId, 10);
          if (numVal < 2147483647) {
            try {
              const { data, error } = await client
                .from('quizzes')
                .select('*')
                .eq('id', numVal)
                .maybeSingle();
              if (!error && data) quizRecord = data;
            } catch (e) {}
          }
        }

        // Jika ID adalah slug atau timestamp custom, coba pencarian berdasarkan slug
        if (!quizRecord) {
          try {
            const { data, error } = await client
              .from('quizzes')
              .select('*')
              .eq('slug', cleanId)
              .maybeSingle();
            if (!error && data) quizRecord = data;
          } catch (e) {}
        }

        // Toleransi fallback: jika ID spesifik tidak ada, ambil kuis aktif terbaru agar user tidak mendapati error
        if (!quizRecord) {
          try {
            const { data, error } = await client
              .from('quizzes')
              .select('*')
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!error && data) quizRecord = data;
          } catch (e) {}
        }

        if (quizRecord) {
          const targetQuizId = String(quizRecord.id || cleanId);

          // 2. Pemanggilan PARALEL untuk mengambil pertanyaan (quiz_questions) dan aturan hasil (quiz_result_rules)
          const [questionsData, rulesData] = await Promise.all([
            // Task A: Mengambil Pertanyaan & Opsi (coba 'quiz_questions' lalu 'questions')
            (async () => {
              let qList = [];

              // Coba tabel quiz_questions
              try {
                const { data: q1, error: err1 } = await client
                  .from('quiz_questions')
                  .select('*')
                  .eq('quiz_id', targetQuizId)
                  .order('sort_order', { ascending: true });
                if (!err1 && Array.isArray(q1) && q1.length > 0) {
                  qList = q1;
                }
              } catch (e) {}

              // Fallback tabel questions
              if (qList.length === 0) {
                try {
                  const { data: q2, error: err2 } = await client
                    .from('questions')
                    .select('*')
                    .eq('quiz_id', targetQuizId)
                    .order('sort_order', { ascending: true });
                  if (!err2 && Array.isArray(q2) && q2.length > 0) {
                    qList = q2;
                  }
                } catch (e) {}
              }

              // Jika quiz_id numerik
              if (qList.length === 0 && /^\d+$/.test(targetQuizId)) {
                const numQId = parseInt(targetQuizId, 10);
                if (numQId < 2147483647) {
                  try {
                    const { data: q3 } = await client
                      .from('questions')
                      .select('*')
                      .eq('quiz_id', numQId)
                      .order('sort_order', { ascending: true });
                    if (Array.isArray(q3) && q3.length > 0) qList = q3;
                  } catch (e) {}
                }
              }

              // Ambil options untuk pertanyaan yang ditemukan
              if (qList.length > 0) {
                const qIds = qList.map(q => q.id);
                let optionsList = [];

                try {
                  const { data: opt1 } = await client
                    .from('options')
                    .select('*')
                    .in('question_id', qIds);
                  if (Array.isArray(opt1) && opt1.length > 0) optionsList = opt1;
                } catch (e) {}

                if (optionsList.length === 0) {
                  try {
                    const { data: opt2 } = await client
                      .from('quiz_question_options')
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
                  options: optionsList.filter(o => String(o.question_id) === String(q.id))
                }));
              }

              return [];
            })(),

            // Task B: Mengambil Aturan Evaluasi Hasil (coba 'quiz_result_rules' lalu 'result_rules')
            (async () => {
              let rList = [];

              // Coba tabel quiz_result_rules
              try {
                const { data: r1, error: rErr1 } = await client
                  .from('quiz_result_rules')
                  .select('*')
                  .eq('quiz_id', targetQuizId);
                if (!rErr1 && Array.isArray(r1) && r1.length > 0) {
                  rList = r1;
                }
              } catch (e) {}

              // Fallback tabel result_rules
              if (rList.length === 0) {
                try {
                  const { data: r2, error: rErr2 } = await client
                    .from('result_rules')
                    .select('*')
                    .eq('quiz_id', targetQuizId);
                  if (!rErr2 && Array.isArray(r2) && r2.length > 0) {
                    rList = r2;
                  }
                } catch (e) {}
              }

              // Jika quiz_id numerik
              if (rList.length === 0 && /^\d+$/.test(targetQuizId)) {
                const numRId = parseInt(targetQuizId, 10);
                if (numRId < 2147483647) {
                  try {
                    const { data: r3 } = await client
                      .from('result_rules')
                      .select('*')
                      .eq('quiz_id', numRId);
                    if (Array.isArray(r3) && r3.length > 0) rList = r3;
                  } catch (e) {}
                }
              }

              if (rList.length > 0) {
                return rList.map(r => ({
                  id: r.id,
                  quiz_id: r.quiz_id,
                  min_score: r.scoreMin !== undefined ? r.scoreMin : (r.min_score !== undefined ? r.min_score : 0),
                  max_score: r.scoreMax !== undefined ? r.scoreMax : (r.max_score !== undefined ? r.max_score : 100),
                  result_code: r.resultCode || r.result_code || 'DEFAULT',
                  title: r.resultTitle || r.title || 'Hasil Evaluasi',
                  badge: r.badge || 'Hasil Kuis CTW',
                  description: r.description || '',
                  image_url: r.image_url || r.imageUrl || null,
                  recommendation: r.recommendation || ''
                }));
              }

              return [];
            })()
          ]);

          // Jika tabel questions belum terisi, sediakan pertanyaan diagnostik default
          let finalQuestions = questionsData;
          if (!finalQuestions || finalQuestions.length === 0) {
            finalQuestions = [
              {
                id: 1,
                quiz_id: targetQuizId,
                question_text: 'Bagaimana performa dan respon perangkat saat tombol daya ditekan?',
                sort_order: 1,
                options: [
                  { id: 101, question_id: 1, option_text: 'Menyala normal dan langsung masuk ke layar utama', score_value: 0, result_code: 'RINGAN' },
                  { id: 102, question_id: 1, option_text: 'Lampu indikator nyala tetapi layar gelap atau butuh beberapa kali tekan', score_value: 50, result_code: 'SEDANG' },
                  { id: 103, question_id: 1, option_text: 'Mati total tanpa respon suara kipas atau lampu indikator', score_value: 100, result_code: 'BERAT' }
                ]
              },
              {
                id: 2,
                quiz_id: targetQuizId,
                question_text: 'Apakah perangkat sering terasa panas berlebih (overheat) atau berbunyi bising?',
                sort_order: 2,
                options: [
                  { id: 104, question_id: 2, option_text: 'Suhu stabil dan suara mesin/kipas sangat hening', score_value: 0, result_code: 'RINGAN' },
                  { id: 105, question_id: 2, option_text: 'Agak hangat dan kipas berputar kencang hanya saat membuka program berat', score_value: 50, result_code: 'SEDANG' },
                  { id: 106, question_id: 2, option_text: 'Sangat panas dan perangkat sering mati mendadak sendiri', score_value: 100, result_code: 'BERAT' }
                ]
              },
              {
                id: 3,
                quiz_id: targetQuizId,
                question_text: 'Bagaimana kondisi baterai dan pengisian daya saat ini?',
                sort_order: 3,
                options: [
                  { id: 107, question_id: 3, option_text: 'Daya tahan awet dan proses charging berjalan normal', score_value: 0, result_code: 'RINGAN' },
                  { id: 108, question_id: 3, option_text: 'Baterai cepat habis atau harus selalu terhubung ke charger', score_value: 50, result_code: 'SEDANG' },
                  { id: 109, question_id: 3, option_text: 'Baterai kembung atau tidak mengisi daya sama sekali', score_value: 100, result_code: 'BERAT' }
                ]
              }
            ];
          }

          // Aturan hasil evaluasi default jika tabel belum terisi
          let finalRules = rulesData;
          if (!finalRules || finalRules.length === 0) {
            finalRules = [
              {
                id: 1,
                quiz_id: targetQuizId,
                min_score: 0,
                max_score: 35,
                result_code: 'RINGAN',
                title: 'Kondisi Baik / Kendala Sangat Ringan',
                badge: 'Kondisi Optimal',
                description: 'Perangkat berada dalam kondisi prima dengan kendala minimal yang dapat diatasi dengan pembersihan file atau update driver.',
                recommendation: 'Lakukan perawatan berkala dan hindari penggunaan berlebihan.'
              },
              {
                id: 2,
                quiz_id: targetQuizId,
                min_score: 36,
                max_score: 70,
                result_code: 'SEDANG',
                title: 'Perlu Perawatan & Pengecekan Menengah',
                badge: 'Perlu Perawatan',
                description: 'Terdeteksi indikasi penurunan performa atau komponen aus yang membutuhkan pengecekan teknis.',
                recommendation: 'Jadwalkan servis rutin dan periksa komponen pendukung.'
              },
              {
                id: 3,
                quiz_id: targetQuizId,
                min_score: 71,
                max_score: 100,
                result_code: 'BERAT',
                title: 'Indikasi Kerusakan Serius / Kritis',
                badge: 'Kerusakan Kritis',
                description: 'Terindikasi kerusakan signifikan pada komponen hardware inti yang memerlukan penanganan profesional.',
                recommendation: 'Bawa segera perangkat ke pusat reparasi resmi terpercaya.'
              }
            ];
          }

          return {
            quiz: quizRecord,
            questions: finalQuestions,
            result_rules: finalRules
          };
        }
      } catch (err) {
        console.warn('[Supabase Notice fetchQuizDetail]:', err?.message || err);
      }
    }

    // 2. Cek apakah kuis tersimpan di localStorage browser (dari Admin CMS)
    try {
      const storedQuizzes = JSON.parse(
        localStorage.getItem('ctw_quizzes') || localStorage.getItem('quizzes') || '[]'
      );
      if (Array.isArray(storedQuizzes)) {
        const localMatch = storedQuizzes.find(
          (q) => String(q.id) === cleanId || String(q.slug) === cleanId
        );
        if (localMatch) {
          const fallbackQ = [
            {
              id: 1,
              quiz_id: cleanId,
              question_text: 'Bagaimana kondisi perangkat saat tombol power ditekan?',
              sort_order: 1,
              options: [
                { id: 101, question_id: 1, option_text: 'Menyala normal dan langsung masuk ke sistem', score_value: 0, result_code: 'RINGAN' },
                { id: 102, question_id: 1, option_text: 'Lampu indikator nyala tetapi layar gelap atau delay', score_value: 50, result_code: 'SEDANG' },
                { id: 103, question_id: 1, option_text: 'Mati total tanpa respon mesin/kipas sama sekali', score_value: 100, result_code: 'BERAT' }
              ]
            },
            {
              id: 2,
              quiz_id: cleanId,
              question_text: 'Apakah perangkat sering mengalami panas berlebih (overheat) atau bising?',
              sort_order: 2,
              options: [
                { id: 104, question_id: 2, option_text: 'Suhu stabil dan suara mesin sangat hening', score_value: 0, result_code: 'RINGAN' },
                { id: 105, question_id: 2, option_text: 'Cukup hangat dan kipas bising hanya saat aplikasi berat', score_value: 50, result_code: 'SEDANG' },
                { id: 106, question_id: 2, option_text: 'Sangat panas dan sering mati mendadak sendiri', score_value: 100, result_code: 'BERAT' }
              ]
            },
            {
              id: 3,
              quiz_id: cleanId,
              question_text: 'Bagaimana performa baterai dan pengisian daya saat ini?',
              sort_order: 3,
              options: [
                { id: 107, question_id: 3, option_text: 'Daya tahan awet dan proses charging normal', score_value: 0, result_code: 'RINGAN' },
                { id: 108, question_id: 3, option_text: 'Baterai cepat habis atau harus selalu colok charger', score_value: 50, result_code: 'SEDANG' },
                { id: 109, question_id: 3, option_text: 'Baterai drop drastis atau tidak mengisi daya sama sekali', score_value: 100, result_code: 'BERAT' }
              ]
            }
          ];

          const fallbackR = [
            {
              id: 1,
              quiz_id: cleanId,
              min_score: 0,
              max_score: 35,
              result_code: 'RINGAN',
              title: 'Kondisi Baik / Kendala Ringan',
              badge: 'Kondisi Optimal',
              description: 'Perangkat berada dalam kondisi prima dengan kendala minimal yang dapat diatasi dengan pembersihan file atau update driver.',
              recommendation: 'Lakukan perawatan berkala dan hindari beban berlebihan.'
            },
            {
              id: 2,
              quiz_id: cleanId,
              min_score: 36,
              max_score: 70,
              result_code: 'SEDANG',
              title: 'Perlu Perawatan & Pengecekan Menengah',
              badge: 'Perlu Perawatan',
              description: 'Terdeteksi indikasi penurunan performa atau komponen aus yang membutuhkan pengecekan teknis.',
              recommendation: 'Jadwalkan servis rutin dan periksa komponen pendingin/pasta.'
            },
            {
              id: 3,
              quiz_id: cleanId,
              min_score: 71,
              max_score: 100,
              result_code: 'BERAT',
              title: 'Indikasi Kerusakan Serius / Kritis',
              badge: 'Kerusakan Kritis',
              description: 'Terindikasi kerusakan signifikan pada komponen hardware inti yang memerlukan penanganan profesional.',
              recommendation: 'Bawa segera perangkat ke teknisi CTW terpercaya.'
            }
          ];

          return {
            quiz: localMatch,
            questions: localMatch.questions && localMatch.questions.length > 0 ? localMatch.questions : fallbackQ,
            result_rules: localMatch.result_rules && localMatch.result_rules.length > 0 ? localMatch.result_rules : fallbackR
          };
        }
      }
    } catch (localErr) {
      console.warn('Local storage check warning:', localErr);
    }

    // 3. Fallback modul skrining CTW interaktif default (mencegah error 404 / 405 pada static hosting seperti GitHub Pages)
    const defaultDiagnosticQuiz = {
      id: cleanId,
      title: 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
      category: 'Laptop & PC',
      slug: 'skrining-diagnosis-kerusakan-elektronik',
      description: 'Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat.',
      status: 'active',
      is_published: true
    };

    return {
      quiz: defaultDiagnosticQuiz,
      questions: [
        {
          id: 1,
          quiz_id: cleanId,
          question_text: 'Bagaimana kondisi perangkat saat tombol daya (Power) ditekan?',
          sort_order: 1,
          options: [
            { id: 101, question_id: 1, option_text: 'Menyala normal dan langsung masuk ke layar utama OS', score_value: 0, result_code: 'RINGAN' },
            { id: 102, question_id: 1, option_text: 'Lampu indikator nyala tetapi layar gelap atau butuh beberapa kali tekan', score_value: 50, result_code: 'SEDANG' },
            { id: 103, question_id: 1, option_text: 'Mati total tanpa respon suara kipas atau lampu indikator', score_value: 100, result_code: 'BERAT' }
          ]
        },
        {
          id: 2,
          quiz_id: cleanId,
          question_text: 'Apakah perangkat sering terasa panas berlebih (overheat) atau berbunyi bising?',
          sort_order: 2,
          options: [
            { id: 104, question_id: 2, option_text: 'Suhu stabil dan suara mesin/kipas sangat hening', score_value: 0, result_code: 'RINGAN' },
            { id: 105, question_id: 2, option_text: 'Agak hangat dan kipas berputar kencang hanya saat membuka program berat', score_value: 50, result_code: 'SEDANG' },
            { id: 106, question_id: 2, option_text: 'Sangat panas dan perangkat sering mati mendadak sendiri', score_value: 100, result_code: 'BERAT' }
          ]
        },
        {
          id: 3,
          quiz_id: cleanId,
          question_text: 'Bagaimana kondisi baterai dan pengisian daya saat ini?',
          sort_order: 3,
          options: [
            { id: 107, question_id: 3, option_text: 'Daya tahan awet dan proses charging berjalan normal', score_value: 0, result_code: 'RINGAN' },
            { id: 108, question_id: 3, option_text: 'Baterai cepat habis atau harus selalu terhubung ke charger', score_value: 50, result_code: 'SEDANG' },
            { id: 109, question_id: 3, option_text: 'Baterai kembung atau tidak mengisi daya sama sekali', score_value: 100, result_code: 'BERAT' }
          ]
        }
      ],
      result_rules: [
        {
          id: 1,
          quiz_id: cleanId,
          min_score: 0,
          max_score: 35,
          result_code: 'RINGAN',
          title: 'Kondisi Baik / Kendala Sangat Ringan',
          badge: 'Kondisi Optimal',
          description: 'Perangkat berada dalam kondisi prima dengan kendala minimal yang dapat diatasi dengan pembersihan file atau update driver.',
          recommendation: 'Lakukan perawatan berkala dan hindari penggunaan berlebihan.'
        },
        {
          id: 2,
          quiz_id: cleanId,
          min_score: 36,
          max_score: 70,
          result_code: 'SEDANG',
          title: 'Perlu Perawatan & Pengecekan Menengah',
          badge: 'Perlu Perawatan',
          description: 'Terdeteksi indikasi penurunan performa atau komponen aus yang membutuhkan pengecekan teknis.',
          recommendation: 'Jadwalkan servis rutin dan periksa komponen pendukung.'
        },
        {
          id: 3,
          quiz_id: cleanId,
          min_score: 71,
          max_score: 100,
          result_code: 'BERAT',
          title: 'Indikasi Kerusakan Serius / Kritis',
          badge: 'Kerusakan Kritis',
          description: 'Terindikasi kerusakan signifikan pada komponen hardware inti yang memerlukan penanganan profesional.',
          recommendation: 'Bawa segera perangkat ke pusat reparasi resmi terpercaya.'
        }
      ]
    };
  }

  /**
   * B. CREATE / UPDATE (Panel Admin CMS)
   * Menyimpan record kuis, mengunggah thumbnail, dan menyelaraskan questions, options, & result_rules
   */
  async function saveQuizToSupabase(quizPayload, thumbnailFile = null) {
    const client = getClient();
    const { quiz, questions, result_rules } = quizPayload;

    // 1. Upload thumbnail jika ada file baru
    let thumbnailUrl = quiz.thumbnail || '';
    if (thumbnailFile && thumbnailFile instanceof File) {
      try {
        thumbnailUrl = await uploadQuizAsset(thumbnailFile);
      } catch (uploadErr) {
        console.warn('Gagal upload thumbnail, melanjutkan tanpa perubahan gambar:', uploadErr);
      }
    }

    if (isSupabaseConfigured() && client) {
      try {
        // 2. Simpan record kuis ke tabel 'quizzes'
        const quizRecord = {
          title: quiz.title,
          category: quiz.category || 'Umum',
          slug: quiz.slug || quiz.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          status: quiz.status || 'active',
          is_published: quiz.status === 'active' || quiz.is_published === true,
          description: quiz.description || '',
          thumbnail: thumbnailUrl || null
        };

        let savedQuizId = quiz.id;

        if (savedQuizId) {
          // UPDATE kuis
          const { error: updateErr } = await client
            .from('quizzes')
            .update(quizRecord)
            .eq('id', savedQuizId);

          if (updateErr) throw updateErr;

          // Hapus questions lama untuk sinkronisasi bersih (CASCADE akan menghapus options)
          await client.from('questions').delete().eq('quiz_id', savedQuizId);
          await client.from('result_rules').delete().eq('quiz_id', savedQuizId);
        } else {
          // INSERT kuis baru
          const { data: newQuiz, error: insertErr } = await client
            .from('quizzes')
            .insert([quizRecord])
            .select('id')
            .single();

          if (insertErr) throw insertErr;
          savedQuizId = newQuiz.id;
        }

        // 3. Simpan daftar pertanyaan ke tabel 'questions' dan opsi ke 'options'
        if (Array.isArray(questions) && questions.length > 0) {
          for (let qIdx = 0; qIdx < questions.length; qIdx++) {
            const q = questions[qIdx];
            const { data: insertedQuestion, error: qErr } = await client
              .from('questions')
              .insert([{
                quiz_id: savedQuizId,
                question_text: q.question_text,
                image_url: q.image_url || null,
                sort_order: qIdx + 1
              }])
              .select('id')
              .single();

            if (qErr) throw qErr;

            if (Array.isArray(q.options) && q.options.length > 0) {
              const optionsToInsert = q.options.map(opt => ({
                question_id: insertedQuestion.id,
                option_text: opt.option_text,
                score_value: parseInt(opt.score_value, 10) || 0,
                result_code: opt.result_code || ''
              }));

              const { error: optErr } = await client
                .from('options')
                .insert(optionsToInsert);

              if (optErr) throw optErr;
            }
          }
        }

        // 4. Simpan result_rules ke tabel 'result_rules'
        if (Array.isArray(result_rules) && result_rules.length > 0) {
          const rulesToInsert = result_rules.map(r => ({
            quiz_id: savedQuizId,
            result_code: r.result_code || 'RESULT_' + (r.id || 'CODE'),
            title: r.title,
            badge: r.badge || 'Hasil',
            description: r.description || '',
            min_score: parseInt(r.min_score, 10) || 0,
            max_score: parseInt(r.max_score, 10) || 100
          }));

          const { error: ruleErr } = await client
            .from('result_rules')
            .insert(rulesToInsert);

          if (ruleErr) throw ruleErr;
        }

        return {
          success: true,
          quiz_id: savedQuizId,
          message: 'Kuis berhasil disimpan ke Supabase Database!'
        };
      } catch (err) {
        console.error('[Supabase Save Error]:', err);
        throw err;
      }
    }

    // Fallback REST API
    const res = await fetch('/api/admin/save-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...quizPayload,
        quiz: { ...quizPayload.quiz, thumbnail: thumbnailUrl }
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menyimpan kuis.');
    return {
      success: true,
      quiz_id: json.data.quiz_id,
      message: 'Kuis berhasil disimpan!'
    };
  }

  /**
   * C. DELETE - Hapus Kuis berdasarkan ID
   * Sesuai instruksi:
   * async function deleteQuiz(quizId, thumbnailUrl) {
   *     if (thumbnailUrl) await deleteQuizAsset(thumbnailUrl);
   *     const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
   *     if (!error) {
   *         alert("Kuis berhasil dihapus!");
   *         loadAdminQuizzes();
   *     }
   * }
   */
  async function deleteQuiz(quizId, thumbnailUrl) {
    const client = getClient();

    // Hapus aset dari storage jika ada
    if (thumbnailUrl) {
      try {
        await deleteQuizAsset(thumbnailUrl);
      } catch (err) {
        console.warn('Gagal menghapus aset thumbnail dari storage:', err);
      }
    }

    if (isSupabaseConfigured() && client) {
      // Hapus record dari database (ON DELETE CASCADE akan menghapus questions & options otomatis)
      const { error } = await client.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      return { success: true };
    }

    // Fallback REST API
    let res = await fetch('/api/admin/delete-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId, id: quizId })
    });
    if (!res.ok) {
      res = await fetch(`/api/admin/quiz/${quizId}`, { method: 'DELETE' });
    }
    const json = await res.json();
    if (!json.success && json.status !== 'success') {
      throw new Error(json.message || 'Gagal menghapus kuis.');
    }
    return { success: true };
  }

  /**
   * C. DELETE - Hapus Pertanyaan spesifik dari builder kuis
   */
  async function deleteQuestion(questionId, imageUrl) {
    if (!questionId) return { success: true };
    const client = getClient();

    if (imageUrl) {
      try {
        await deleteQuizAsset(imageUrl);
      } catch (err) {
        console.warn('Gagal menghapus gambar pertanyaan:', err);
      }
    }

    if (isSupabaseConfigured() && client) {
      const { error } = await client.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      return { success: true };
    }

    // Fallback REST API
    const res = await fetch('/api/admin/delete-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, id: questionId })
    });
    return res.json();
  }

  /**
   * D. KALKULASI PROBABILITAS TEOREMA BAYES
   * Menghitung Posterior Probability P(H_k|E) dan Severity Risk Percentage (0% - 100%)
   */
  function calculateBayesScore(detailedAnswers) {
    const totalQuestions = detailedAnswers.length;
    if (totalQuestions === 0) {
      return {
        severity_percentage: 0,
        confidence_percentage: 100,
        dominant_hypothesis: 'RINGAN',
        posterior_probabilities: { ringan: 100, sedang: 0, kritis: 0 }
      };
    }

    // 1. Percentage Calculation: (Total Skor Jawaban / Total Nilai Maksimal) * 100%
    const totalScoreSum = detailedAnswers.reduce((sum, a) => sum + (Number(a.score_value) || 0), 0);
    const maxPossibleScore = totalQuestions * 100;
    const severityPercentage = Math.min(100, Math.max(0, Math.round((totalScoreSum / maxPossibleScore) * 100)));

    // 2. Naive Bayes Posterior Probability Calculation P(H_k | E):
    // Prior Probabilities: P(H1) = P(H2) = P(H3) = 1/3
    const prior = { ringan: 1 / 3, sedang: 1 / 3, kritis: 1 / 3 };

    let logLikelihood = {
      ringan: Math.log(prior.ringan),
      sedang: Math.log(prior.sedang),
      kritis: Math.log(prior.kritis)
    };

    detailedAnswers.forEach(ans => {
      const val = Number(ans.score_value) || 0;
      if (val <= 0) {
        logLikelihood.ringan += Math.log(0.85);
        logLikelihood.sedang += Math.log(0.12);
        logLikelihood.kritis += Math.log(0.03);
      } else if (val <= 50) {
        logLikelihood.ringan += Math.log(0.15);
        logLikelihood.sedang += Math.log(0.70);
        logLikelihood.kritis += Math.log(0.15);
      } else {
        logLikelihood.ringan += Math.log(0.03);
        logLikelihood.sedang += Math.log(0.15);
        logLikelihood.kritis += Math.log(0.82);
      }
    });

    const maxLog = Math.max(logLikelihood.ringan, logLikelihood.sedang, logLikelihood.kritis);
    const expR = Math.exp(logLikelihood.ringan - maxLog);
    const expS = Math.exp(logLikelihood.sedang - maxLog);
    const expK = Math.exp(logLikelihood.kritis - maxLog);
    const sumExp = expR + expS + expK;

    const postR = Math.round((expR / sumExp) * 100);
    const postS = Math.round((expS / sumExp) * 100);
    const postK = Math.max(0, 100 - (postR + postS));

    let dominantHypothesis = 'RINGAN';
    let confidencePercentage = postR;

    if (severityPercentage >= 71 || (postK >= postR && postK >= postS)) {
      dominantHypothesis = 'KRITIS';
      confidencePercentage = postK;
    } else if (severityPercentage >= 36 || (postS >= postR && postS >= postK)) {
      dominantHypothesis = 'SEDANG';
      confidencePercentage = postS;
    } else {
      dominantHypothesis = 'RINGAN';
      confidencePercentage = postR;
    }

    return {
      severity_percentage: severityPercentage,
      confidence_percentage: confidencePercentage,
      dominant_hypothesis: dominantHypothesis,
      posterior_probabilities: {
        ringan: postR,
        sedang: postS,
        kritis: postK
      }
    };
  }

  /**
   * D. SUBMIT QUIZ & DIAGNOSIS
   * - Hitung total skor dari pilihan user secara client-side menggunakan Teorema Bayes & Persentase (0% - 100%).
   * - Ambil data result_rules dari Supabase yang mencakup rentang min_score dan max_score untuk menentukan hasil diagnosis.
   * - Simpan jawaban dan skor ke tabel user_responses:
   *   await supabase.from('user_responses').insert([{
   *       quiz_id: quizId,
   *       result_rule_id: matchedRule.id,
   *       total_score: totalScore,
   *       user_answers: userSelections
   *   }]);
   */
  async function submitQuizAndDiagnose(quizId, userAnswersMap, questionsList, resultRulesList = []) {
    const client = getClient();
    const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];

    // 1. Ekstrak data jawaban pengguna
    const userSelections = [];
    const codeCounts = {};

    questionsList.forEach((q) => {
      const selectedOptId = userAnswersMap[q.id];
      if (selectedOptId && Array.isArray(q.options)) {
        const optIndex = q.options.findIndex(o => o.id === parseInt(selectedOptId, 10));
        const selectedOpt = q.options[optIndex];
        if (selectedOpt) {
          const score = parseInt(selectedOpt.score_value, 10) || 0;

          const resultCode = selectedOpt.result_code || '';
          if (resultCode) {
            codeCounts[resultCode] = (codeCounts[resultCode] || 0) + 1;
          }

          userSelections.push({
            question_id: q.id,
            question_text: q.question_text,
            option_id: selectedOpt.id,
            option_text: selectedOpt.option_text,
            selected_letter: letterMap[optIndex] || String(optIndex + 1),
            score_value: score,
            result_code: resultCode
          });
        }
      }
    });

    // 2. Hitung Nilai Skor Persentase & Posterior Probabilitas Bayes
    const bayes = calculateBayesScore(userSelections);
    const totalScore = bayes.severity_percentage;

    // Cari kode dominan jika ada
    let dominantCode = null;
    let maxCount = 0;
    for (const [code, count] of Object.entries(codeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantCode = code;
      }
    }

    // 3. Ambil data result_rules dari Supabase yang mencakup rentang min_score dan max_score (0-35, 36-70, 71-100)
    let rules = resultRulesList;
    if ((!rules || rules.length === 0) && isSupabaseConfigured() && client) {
      try {
        const { data: fetchedRules } = await client
          .from('result_rules')
          .select('*')
          .eq('quiz_id', quizId);

        if (fetchedRules && fetchedRules.length > 0) {
          rules = fetchedRules;
        }
      } catch (err) {
        console.warn('Gagal memuat result_rules dari Supabase:', err);
      }
    }

    // Tentukan aturan hasil diagnosis yang cocok berdasarkan rentang persentase
    let matchedRule = null;

    if (Array.isArray(rules) && rules.length > 0) {
      matchedRule = rules.find(r => totalScore >= (r.min_score || 0) && totalScore <= (r.max_score || 100));

      if (!matchedRule && dominantCode) {
        matchedRule = rules.find(r => r.result_code === dominantCode);
      }

      if (!matchedRule) {
        matchedRule = rules[0];
      }
    }

    // Default diagnosis jika belum ada rules yang cocok
    if (!matchedRule) {
      matchedRule = {
        id: null,
        title: 'Hasil Evaluasi Kuis CTW',
        badge: 'Profil Teridentifikasi',
        description: 'Berdasarkan pilihan jawaban kamu, kondisi perangkat berhasil dianalisis dengan metode Bayesian.'
      };
    }

    // 4. Simpan jawaban dan skor persentase ke tabel 'user_responses'
    if (isSupabaseConfigured() && client) {
      try {
        const responseRecord = {
          quiz_id: quizId,
          total_score: totalScore,
          user_answers: userSelections
        };

        if (matchedRule && matchedRule.id) {
          responseRecord.result_rule_id = matchedRule.id;
        }

        const { data: insertedResponse, error: responseErr } = await client
          .from('user_responses')
          .insert([responseRecord])
          .select('id')
          .single();

        if (responseErr) {
          console.warn('[Supabase user_responses insert warning]:', responseErr);
        }
      } catch (e) {
        console.warn('Gagal menyimpan user_responses ke Supabase:', e);
      }
    } else {
      // Fallback kirim ke REST API lokal jika ada
      fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: userSelections.map(a => ({ question_id: a.question_id, option_id: a.option_id }))
        })
      }).catch(() => {});
    }

    return {
      score: totalScore,
      total_score: totalScore,
      dominant_code: dominantCode,
      bayes: bayes,
      result: matchedRule,
      answers_payload: userSelections
    };
  }

  // Update kredensial Supabase secara runtime (misal dari input panel admin)
  function setSupabaseConfig(url, key) {
    if (!url || !key) return false;
    localStorage.setItem('VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim());
    localStorage.setItem('CTW_VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('CTW_VITE_SUPABASE_ANON_KEY', key.trim());
    initSupabaseClient(url.trim(), key.trim());
    return true;
  }

  // Global Export
  window.ATWSupabase = {
    // Config & Status
    isConfigured: isSupabaseConfigured,
    getClient: getClient,
    setSupabaseConfig: setSupabaseConfig,
    getConfig: () => ({
      url: VITE_SUPABASE_URL,
      key: VITE_SUPABASE_ANON_KEY,
      isDefault: !VITE_SUPABASE_URL || VITE_SUPABASE_URL === DEFAULT_SUPABASE_URL
    }),

    // Storage API
    uploadQuizAsset: uploadQuizAsset,
    deleteQuizAsset: deleteQuizAsset,

    // Database CRUD API
    fetchPublishedQuizzes: fetchPublishedQuizzes,
    fetchAdminQuizzes: fetchAdminQuizzes,
    fetchQuizDetail: fetchQuizDetail,
    saveQuizToSupabase: saveQuizToSupabase,
    deleteQuiz: deleteQuiz,
    deleteQuestion: deleteQuestion,
    submitQuizAndDiagnose: submitQuizAndDiagnose,
    calculateBayesScore: calculateBayesScore
  };

  // Rebranded CTW Alias
  window.CTWSupabase = window.ATWSupabase;

  // Expose directly as requested by specifications
  window.uploadQuizAsset = uploadQuizAsset;
  window.deleteQuizAsset = deleteQuizAsset;
  window.deleteQuiz = deleteQuiz;

})(window);
