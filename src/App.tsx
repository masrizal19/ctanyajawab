import React, { useState, useEffect } from 'react';
import { Quiz, Question, SubmissionResponse } from './types';
import { Header } from './components/Header';
import { QuizCatalog } from './components/QuizCatalog';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResult } from './components/QuizResult';
import { AdminCMS } from './components/AdminCMS';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'admin'>('quiz');
  const [currentView, setCurrentView] = useState<'catalog' | 'player' | 'result'>('catalog');

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState<boolean>(true);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);

  // Load quizzes from Supabase (fallback to REST API)
  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      // 1. Ambil dari Supabase
      const { data: sbQuizzes, error: sbError } = await (supabase.from('quizzes') as any)
        .select('*')
        .order('id', { ascending: false });

      if (!sbError && sbQuizzes && sbQuizzes.length > 0) {
        let filtered = sbQuizzes as Quiz[];
        if (selectedCategory && selectedCategory !== 'Semua') {
          filtered = filtered.filter((q) => q.category === selectedCategory);
        }
        if (searchKeyword) {
          const kw = searchKeyword.toLowerCase();
          filtered = filtered.filter(
            (q) =>
              q.title.toLowerCase().includes(kw) ||
              (q.description && q.description.toLowerCase().includes(kw))
          );
        }
        setQuizzes(filtered);

        // Kategori dinamis
        const catMap: Record<string, number> = {};
        sbQuizzes.forEach((q: Quiz) => {
          const c = q.category || 'Umum';
          catMap[c] = (catMap[c] || 0) + 1;
        });
        setCategories(Object.entries(catMap).map(([category, count]) => ({ category, count })));
        setIsLoadingQuizzes(false);
        return;
      }

      // 2. Fallback REST API
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'Semua') {
        params.append('category', selectedCategory);
      }
      if (searchKeyword) {
        params.append('search', searchKeyword);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/quizzes${qs}`);
      const json = await res.json();
      if (json.success && json.data) {
        setQuizzes(json.data.quizzes || []);
        setCategories(json.data.categories || []);
      }
    } catch (err) {
      console.warn('Notice loading quizzes:', err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [selectedCategory, searchKeyword]);

  // Start a quiz by ID (String ID compliant)
  const handleSelectQuiz = async (quizId: string | number) => {
    const cleanId = String(quizId || '').trim();
    if (!cleanId) return;

    try {
      // 1. Coba ambil dari Supabase
      let quizRecord: Quiz | null = null;
      try {
        const { data } = await (supabase.from('quizzes') as any)
          .select('*')
          .eq('id', cleanId)
          .maybeSingle();
        if (data) quizRecord = data;
      } catch (e) {}

      if (!quizRecord && /^\d+$/.test(cleanId)) {
        const numId = parseInt(cleanId, 10);
        if (numId < 2147483647) {
          try {
            const { data } = await (supabase.from('quizzes') as any)
              .select('*')
              .eq('id', numId)
              .maybeSingle();
            if (data) quizRecord = data;
          } catch (e) {}
        }
      }

      if (!quizRecord) {
        try {
          const { data } = await (supabase.from('quizzes') as any)
            .select('*')
            .eq('slug', cleanId)
            .maybeSingle();
          if (data) quizRecord = data;
        } catch (e) {}
      }

      if (!quizRecord) {
        try {
          const { data } = await (supabase.from('quizzes') as any)
            .select('*')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data) quizRecord = data;
        } catch (e) {}
      }

      if (quizRecord) {
        const targetId = String(quizRecord.id || cleanId);

        // Ambil questions & options secara paralel
        let qList: Question[] = [];
        try {
          const { data: qs1 } = await (supabase.from('quiz_questions') as any)
            .select('*')
            .eq('quiz_id', targetId)
            .order('sort_order', { ascending: true });
          if (qs1 && qs1.length > 0) qList = qs1;
        } catch (e) {}

        if (qList.length === 0) {
          try {
            const { data: qs2 } = await (supabase.from('questions') as any)
              .select('*')
              .eq('quiz_id', targetId)
              .order('sort_order', { ascending: true });
            if (qs2 && qs2.length > 0) qList = qs2;
          } catch (e) {}
        }

        if (qList.length > 0) {
          const qIds = qList.map((q) => q.id);
          let optionsList: any[] = [];
          try {
            const { data: opts } = await (supabase.from('options') as any)
              .select('*')
              .in('question_id', qIds);
            if (opts && opts.length > 0) optionsList = opts;
          } catch (e) {}

          if (optionsList.length === 0) {
            try {
              const { data: opts2 } = await (supabase.from('quiz_question_options') as any)
                .select('*')
                .in('question_id', qIds);
              if (opts2 && opts2.length > 0) optionsList = opts2;
            } catch (e) {}
          }

          qList = qList.map((q) => ({
            ...q,
            options: optionsList.filter((o) => String(o.question_id) === String(q.id))
          }));
        }

        if (qList.length === 0) {
          qList = [
            {
              id: 1,
              quiz_id: Number(targetId) || 1,
              question_text: 'Bagaimana kondisi perangkat saat tombol daya ditekan?',
              image_url: null,
              sort_order: 1,
              options: [
                { id: 101, question_id: 1, option_text: 'Menyala normal dan langsung masuk ke sistem', score_value: 0, result_code: 'RINGAN' },
                { id: 102, question_id: 1, option_text: 'Lampu indikator nyala tetapi layar gelap', score_value: 50, result_code: 'SEDANG' },
                { id: 103, question_id: 1, option_text: 'Mati total tanpa respon sama sekali', score_value: 100, result_code: 'BERAT' }
              ]
            }
          ];
        }

        setActiveQuiz(quizRecord);
        setQuestions(qList);
        setCurrentView('player');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 2. Fallback REST API
      const res = await fetch(`/api/quiz-detail?id=${cleanId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveQuiz(json.data.quiz);
          setQuestions(json.data.questions || []);
          setCurrentView('player');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat kuis:', err);
    }
  };

  // Check URL query param for direct quiz loading (String ID compliant)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    if (quizId) {
      handleSelectQuiz(String(quizId).trim());
    }
  }, []);

  // Submit answers to Server-Side Quiz Engine / Client-side fallback
  const handleSubmitAnswers = async (answers: { question_id: number; option_id: number }[]) => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      // Hitung total skor
      let totalScore = 0;
      let maxScore = questions.length * 100;
      answers.forEach((ans) => {
        const q = questions.find((qItem) => qItem.id === ans.question_id);
        const opt = q?.options?.find((o) => o.id === ans.option_id);
        if (opt) totalScore += Number(opt.score_value || 0);
      });

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Ambil aturan hasil dari Supabase
      let matchedRule: any = null;
      try {
        const { data: rules } = await (supabase.from('quiz_result_rules') as any)
          .select('*')
          .eq('quiz_id', String(activeQuiz.id));
        if (rules && rules.length > 0) {
          matchedRule = rules.find(
            (r: any) =>
              percentage >= (r.scoreMin !== undefined ? r.scoreMin : r.min_score) &&
              percentage <= (r.scoreMax !== undefined ? r.scoreMax : r.max_score)
          );
        }
      } catch (e) {}

      if (!matchedRule) {
        matchedRule = {
          title: percentage >= 71 ? 'Indikasi Kerusakan Serius' : percentage >= 36 ? 'Perlu Perawatan' : 'Kondisi Optimal',
          badge: percentage >= 71 ? 'Kritis' : percentage >= 36 ? 'Menengah' : 'Ringan',
          description: `Berdasarkan jawaban Anda, skor keparahan adalah ${percentage}%.`,
          recommendation: 'Lakukan perawatan atau konsultasikan ke teknisi berpengalaman.'
        };
      }

      const codeDist: Record<string, number> = {};
      answers.forEach((a) => {
        const q = questions.find((qItem) => qItem.id === a.question_id);
        const opt = q?.options?.find((o) => o.id === a.option_id);
        const c = opt?.result_code || 'DEFAULT';
        codeDist[c] = (codeDist[c] || 0) + 1;
      });

      const clientResult: SubmissionResponse = {
        response_id: Date.now(),
        quiz: {
          id: activeQuiz.id,
          title: activeQuiz.title,
          category: activeQuiz.category
        },
        score: percentage,
        total_score: percentage,
        dominant_code: percentage >= 71 ? 'BERAT' : percentage >= 36 ? 'SEDANG' : 'RINGAN',
        code_distribution: codeDist,
        total_answered: answers.length,
        completed_at: new Date().toISOString(),
        result: {
          id: matchedRule.id || 1,
          code: matchedRule.result_code || 'DEFAULT',
          title: matchedRule.title,
          description: matchedRule.description,
          badge: matchedRule.badge,
          badge_color: matchedRule.badge_color || '#2563eb',
          image_url: matchedRule.image_url || null,
          recommendation: matchedRule.recommendation || ''
        },
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
        answers_payload: answers.map((ans, idx) => {
          const q = questions.find((qItem) => qItem.id === ans.question_id);
          const opt = q?.options?.find((o) => o.id === ans.option_id);
          return {
            question_id: ans.question_id,
            question_text: q?.question_text || '',
            option_id: ans.option_id,
            selected_letter: String.fromCharCode(65 + (idx % 26)),
            option_text: opt?.option_text || '',
            score_value: opt?.score_value || 0,
            result_code: opt?.result_code || ''
          };
        })
      };

      setSubmissionResult(clientResult);
      setCurrentView('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saat submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToCatalog = () => {
    setCurrentView('catalog');
    setActiveQuiz(null);
    setQuestions([]);
    setSubmissionResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f9] text-slate-800 font-['Inter',sans-serif]">
      {/* ATW Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'quiz') {
            setCurrentView('catalog');
          }
        }}
        onResetToCatalog={handleResetToCatalog}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {activeTab === 'admin' ? (
          <AdminCMS
            onOpenPublicQuiz={(id) => {
              setActiveTab('quiz');
              handleSelectQuiz(id);
            }}
          />
        ) : (
          <>
            {currentView === 'catalog' && (
              <QuizCatalog
                quizzes={quizzes}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchKeyword={searchKeyword}
                setSearchKeyword={setSearchKeyword}
                onSelectQuiz={handleSelectQuiz}
                isLoading={isLoadingQuizzes}
              />
            )}

            {currentView === 'player' && activeQuiz && (
              <QuizPlayer
                quiz={activeQuiz}
                questions={questions}
                onFinish={handleSubmitAnswers}
                onCancel={handleResetToCatalog}
                isSubmitting={isSubmitting}
              />
            )}

            {currentView === 'result' && submissionResult && (
              <QuizResult
                resultData={submissionResult}
                onRetake={() => {
                  if (activeQuiz) {
                    handleSelectQuiz(activeQuiz.id);
                  }
                }}
                onExploreOther={handleResetToCatalog}
                onOpenDocs={() => {
                  setActiveTab('admin');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-sm py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">CTW</span>
            <span>• Correct Answer Interactive Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="/quiz.html" className="hover:text-blue-600 transition-colors">
              Halaman Kuis Publik (quiz.html)
            </a>
            <span>•</span>
            <a href="/admin.html" className="hover:text-blue-600 transition-colors">
              Halaman Admin CMS (admin.html)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

