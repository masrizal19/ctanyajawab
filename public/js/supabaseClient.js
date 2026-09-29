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

  // Initial attempt and auto-fetch from server API config if available
  function checkAndInitConfig() {
    initSupabaseClient();
    if (!isSupabaseConfigured() && typeof fetch === 'function') {
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
   * A. READ - Ambil detail kuis, pertanyaan, dan pilihan jawaban relasional sekaligus
   * Relational query: quizzes -> questions -> options, result_rules
   * @param {number|string} quizId
   */
  async function fetchQuizDetail(quizId) {
    const client = getClient();

    if (isSupabaseConfigured() && client) {
      try {
        const { data, error } = await client
          .from('quizzes')
          .select('*, questions(*, options(*)), result_rules(*)')
          .eq('id', quizId)
          .single();

        if (error) throw error;

        if (data) {
          // Sort questions berdasarkan sort_order atau id
          if (Array.isArray(data.questions)) {
            data.questions.sort((a, b) => (a.sort_order || a.id) - (b.sort_order || b.id));
          }
          return {
            quiz: data,
            questions: data.questions || [],
            result_rules: data.result_rules || []
          };
        }
      } catch (err) {
        console.error('[Supabase Error fetchQuizDetail]:', err);
      }
    }

    // Fallback REST API
    try {
      let res = await fetch(`/api/get-quiz?id=${quizId}`);
      if (!res.ok) res = await fetch(`/api/quiz-detail?id=${quizId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            quiz: json.data.quiz,
            questions: json.data.questions || [],
            result_rules: json.data.result_rules || []
          };
        }
      }
    } catch (e) {
      console.warn('Fallback get quiz detail failed:', e);
    }

    throw new Error(`Kuis #${quizId} tidak ditemukan.`);
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
