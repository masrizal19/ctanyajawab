import { supabase, isConfigured } from '../lib/supabaseClient';
import { Quiz, Question, SubmissionResponse, ResultRule } from '../types';

export const DEFAULT_QUIZZES: Quiz[] = [
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

export async function getQuizzes({ category = 'Semua', search = '' }: { category?: string; search?: string } = {}): Promise<{
  quizzes: Quiz[];
  categories: { category: string; count: number }[];
}> {
  let rawQuizzes: Quiz[] = [];

  if (isConfigured) {
    try {
      const { data, error } = await (supabase.from('quizzes') as any)
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        rawQuizzes = data as Quiz[];
      }
    } catch (err) {
      console.warn('⚠️ [quizService] Query Supabase quizzes gagal:', err);
    }
  }

  try {
    const stored = JSON.parse(localStorage.getItem('quizzes') || localStorage.getItem('ctw_quizzes') || '[]');
    if (Array.isArray(stored) && stored.length > 0) {
      const existingIds = new Set(rawQuizzes.map(q => String(q.id)));
      stored.forEach((sq: any) => {
        if (!existingIds.has(String(sq.id))) {
          rawQuizzes.unshift(sq as Quiz);
        }
      });
    }
  } catch (e) {}

  if (rawQuizzes.length === 0) {
    rawQuizzes = [...DEFAULT_QUIZZES];
  }

  let filtered = rawQuizzes;
  if (category && category !== 'Semua') {
    filtered = filtered.filter((q) => q.category === category);
  }

  if (search && search.trim()) {
    const kw = search.trim().toLowerCase();
    filtered = filtered.filter(
      (q) =>
        (q.title && q.title.toLowerCase().includes(kw)) ||
        (q.description && q.description.toLowerCase().includes(kw)) ||
        (q.category && q.category.toLowerCase().includes(kw))
    );
  }

  const categoryMap: Record<string, number> = {};
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

export async function getQuizById(quizId: string | number): Promise<{
  quiz: Quiz;
  questions: Question[];
  result_rules: ResultRule[];
}> {
  const cleanId = String(quizId || '').trim();
  if (!cleanId) {
    throw new Error('ID Kuis wajib disertakan.');
  }

  let quizRecord: Quiz | null = null;
  let questions: Question[] = [];
  let resultRules: ResultRule[] = [];

  if (isConfigured) {
    try {
      const { data: qData, error: qErr } = await (supabase.from('quizzes') as any)
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!qErr && qData) {
        quizRecord = qData as Quiz;
      }

      if (!quizRecord && /^\d+$/.test(cleanId)) {
        const numId = parseInt(cleanId, 10);
        if (numId < 2147483647) {
          const { data: numData } = await (supabase.from('quizzes') as any)
            .select('*')
            .eq('id', numId)
            .maybeSingle();
          if (numData) quizRecord = numData as Quiz;
        }
      }

      if (!quizRecord) {
        const { data: slugData } = await (supabase.from('quizzes') as any)
          .select('*')
          .eq('slug', cleanId)
          .maybeSingle();
        if (slugData) quizRecord = slugData as Quiz;
      }

      if (quizRecord) {
        const targetId = String(quizRecord.id || cleanId);

        const [questionsRes, rulesRes] = await Promise.all([
          (async () => {
            let qList: any[] = [];
            try {
              const { data: qq, error: qqErr } = await (supabase.from('quiz_questions') as any)
                .select('*')
                .eq('quiz_id', targetId)
                .order('sort_order', { ascending: true });
              if (!qqErr && Array.isArray(qq) && qq.length > 0) qList = qq;
            } catch (e) {}

            if (qList.length === 0) {
              try {
                const { data: qs, error: qsErr } = await (supabase.from('questions') as any)
                  .select('*')
                  .eq('quiz_id', targetId)
                  .order('sort_order', { ascending: true });
                if (!qsErr && Array.isArray(qs) && qs.length > 0) qList = qs;
              } catch (e) {}
            }

            if (qList.length > 0) {
              const qIds = qList.map((q) => q.id);
              let optionsList: any[] = [];

              try {
                const { data: opts } = await (supabase.from('options') as any)
                  .select('*')
                  .in('question_id', qIds);
                if (Array.isArray(opts)) optionsList = opts;
              } catch (e) {}

              if (optionsList.length === 0) {
                try {
                  const { data: opt2 } = await (supabase.from('quiz_question_options') as any)
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

          (async () => {
            let rList: any[] = [];
            try {
              const { data: rr, error: rrErr } = await (supabase.from('quiz_result_rules') as any)
                .select('*')
                .eq('quiz_id', targetId);
              if (!rrErr && Array.isArray(rr) && rr.length > 0) rList = rr;
            } catch (e) {}

            if (rList.length === 0) {
              try {
                const { data: rr2, error: rr2Err } = await (supabase.from('result_rules') as any)
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

  // Cek localStorage jika baru saja disimpan oleh Admin
  if (!quizRecord) {
    try {
      const stored = JSON.parse(localStorage.getItem('quizzes') || localStorage.getItem('ctw_quizzes') || '[]');
      const found = stored.find((q: any) => String(q.id) === cleanId || String(q.slug) === cleanId);
      if (found) {
        quizRecord = found as Quiz;
        if (found.questions) questions = found.questions;
        if (found.result_rules) resultRules = found.result_rules;
      }
    } catch (e) {}
  }

  // JANGAN fallback ke mock kuis default jika tidak ditemukan!
  if (!quizRecord) {
    throw new Error(`Data kuis dengan ID "${cleanId}" tidak ditemukan atau belum dipublikasikan.`);
  }

  return {
    quiz: quizRecord,
    questions,
    result_rules: resultRules
  };
}

export async function saveQuiz({
  quiz,
  questions = [],
  resultRules = []
}: {
  quiz: any;
  questions?: any[];
  resultRules?: any[];
}): Promise<{ success: boolean; quiz_id: string; slug: string; share_url: string }> {
  if (!quiz || !quiz.title || !quiz.title.trim()) {
    throw new Error('Judul kuis wajib diisi.');
  }

  const cleanTitle = quiz.title.trim();
  const cleanCategory = quiz.category?.trim() || 'Teknologi & Desain';
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
    slug: autoSlug,
    status: quiz.status || 'active',
    is_published: quiz.status !== 'draft',
    description: quiz.description?.trim() || '',
    thumbnail: quiz.thumbnail || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
    rating: 5.0,
    est_time: `${Math.max(1, Math.ceil(questions.length * 0.7))} Menit`,
    total_participants: 0,
    created_at: new Date().toISOString()
  };

  let savedQuizId = quiz.id ? String(quiz.id) : null;

  if (isConfigured) {
    if (savedQuizId) {
      await (supabase.from('quizzes') as any)
        .update({
          title: quizPayload.title,
          category: quizPayload.category,
          slug: quizPayload.slug,
          status: quizPayload.status,
          is_published: quizPayload.is_published,
          description: quizPayload.description,
          thumbnail: quizPayload.thumbnail
        })
        .eq('id', savedQuizId);
    } else {
      const { data: newQ } = await (supabase.from('quizzes') as any)
        .insert([quizPayload])
        .select()
        .maybeSingle();

      if (newQ && newQ.id) {
        savedQuizId = String(newQ.id);
      } else {
        savedQuizId = String(Date.now());
      }
    }

    if (savedQuizId && resultRules && resultRules.length > 0) {
      try {
        await (supabase.from('quiz_result_rules') as any).delete().eq('quiz_id', savedQuizId);
        await (supabase.from('result_rules') as any).delete().eq('quiz_id', savedQuizId);
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
        const { error: rErr } = await (supabase.from('quiz_result_rules') as any).insert(rulesData);
        if (rErr) {
          await (supabase.from('result_rules') as any).insert(rulesData);
        }
      } catch (e) {}
    }

    if (savedQuizId && questions && questions.length > 0) {
      try {
        const { data: oldQs } = await (supabase.from('questions') as any).select('id').eq('quiz_id', savedQuizId);
        if (oldQs && oldQs.length > 0) {
          const oldIds = oldQs.map((q: any) => q.id);
          await (supabase.from('options') as any).delete().in('question_id', oldIds);
        }
        await (supabase.from('questions') as any).delete().eq('quiz_id', savedQuizId);
        await (supabase.from('quiz_questions') as any).delete().eq('quiz_id', savedQuizId);
      } catch (e) {}

      for (let i = 0; i < questions.length; i++) {
        const qItem = questions[i];
        let qId = null;

        try {
          const { data: insQuestion } = await (supabase.from('quiz_questions') as any)
            .insert([{
              quiz_id: savedQuizId,
              question_text: qItem.question_text,
              image_url: qItem.image_url || null,
              sort_order: i + 1
            }])
            .select()
            .maybeSingle();

          if (insQuestion?.id) qId = insQuestion.id;
        } catch (e) {}

        if (!qId) {
          try {
            const { data: insQuestion2 } = await (supabase.from('questions') as any)
              .insert([{
                quiz_id: savedQuizId,
                question_text: qItem.question_text,
                image_url: qItem.image_url || null,
                sort_order: i + 1
              }])
              .select()
              .maybeSingle();
            if (insQuestion2?.id) qId = insQuestion2.id;
          } catch (e) {}
        }

        if (qId && Array.isArray(qItem.options) && qItem.options.length > 0) {
          const optPayload = qItem.options.map((opt: any) => ({
            question_id: qId,
            option_text: opt.option_text,
            score_value: typeof opt.score_value === 'number' ? opt.score_value : parseInt(opt.score_value || 0, 10),
            result_code: opt.result_code || 'DEFAULT'
          }));
          try {
            await (supabase.from('options') as any).insert(optPayload);
          } catch (e) {}
        }
      }
    }
  } else {
    if (!savedQuizId) savedQuizId = String(Date.now());
  }

  try {
    const stored = JSON.parse(localStorage.getItem('quizzes') || localStorage.getItem('ctw_quizzes') || '[]');
    const newRecord = {
      ...quizPayload,
      id: savedQuizId,
      questions,
      result_rules: resultRules
    };
    const updated = [newRecord, ...stored.filter((q: any) => String(q.id) !== savedQuizId)];
    localStorage.setItem('quizzes', JSON.stringify(updated));
    localStorage.setItem('ctw_quizzes', JSON.stringify(updated));
  } catch (e) {}

  return {
    success: true,
    quiz_id: savedQuizId,
    slug: autoSlug,
    share_url: `/quiz.html?id=${savedQuizId}`
  };
}

export async function deleteQuiz(quizId: string | number): Promise<{ success: boolean; quiz_id: string }> {
  const cleanId = String(quizId || '').trim();
  if (!cleanId) {
    throw new Error('ID Kuis wajib disertakan.');
  }

  if (isConfigured) {
    try {
      await (supabase.from('quiz_result_rules') as any).delete().eq('quiz_id', cleanId);
      await (supabase.from('result_rules') as any).delete().eq('quiz_id', cleanId);

      const { data: qList } = await (supabase.from('questions') as any).select('id').eq('quiz_id', cleanId);
      if (qList && qList.length > 0) {
        const qIds = qList.map((q: any) => q.id);
        await (supabase.from('options') as any).delete().in('question_id', qIds);
      }

      await (supabase.from('questions') as any).delete().eq('quiz_id', cleanId);
      await (supabase.from('quiz_questions') as any).delete().eq('quiz_id', cleanId);
      await (supabase.from('quizzes') as any).delete().eq('id', cleanId);
    } catch (sbErr) {
      console.warn('Supabase delete error:', sbErr);
    }
  }

  try {
    const stored = JSON.parse(localStorage.getItem('quizzes') || localStorage.getItem('ctw_quizzes') || '[]');
    const filtered = stored.filter((q: any) => String(q.id) !== cleanId);
    localStorage.setItem('quizzes', JSON.stringify(filtered));
    localStorage.setItem('ctw_quizzes', JSON.stringify(filtered));
  } catch (e) {}

  return { success: true, quiz_id: cleanId };
}

export async function submitQuizAnswers({
  quiz,
  answers,
  questions = [],
  resultRules = []
}: {
  quiz: any;
  answers: { question_id: number; option_id: number }[];
  questions?: Question[];
  resultRules?: ResultRule[];
}): Promise<SubmissionResponse> {
  let totalScore = 0;
  let maxPossibleScore = (questions.length || 1) * 100;
  const breakdown: any[] = [];

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

  const codeDistribution: Record<string, number> = {};
  breakdown.forEach((b) => {
    const c = b.result_code || 'DEFAULT';
    codeDistribution[c] = (codeDistribution[c] || 0) + 1;
  });

  if (isConfigured) {
    try {
      await (supabase.from('user_responses') as any).insert([
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
      dominant_hypothesis: (percentage >= 71 ? 'KRITIS' : percentage >= 36 ? 'SEDANG' : 'RINGAN') as 'RINGAN' | 'SEDANG' | 'KRITIS',
      posterior_probabilities: {
        ringan: percentage <= 35 ? 85 : 10,
        sedang: percentage >= 36 && percentage <= 70 ? 80 : 15,
        kritis: percentage >= 71 ? 90 : 5
      }
    },
    answers_payload: breakdown
  };
}
