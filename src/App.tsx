import React, { useState, useEffect } from 'react';
import { Quiz, Question, SubmissionResponse } from './types';
import { Header } from './components/Header';
import { QuizCatalog } from './components/QuizCatalog';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResult } from './components/QuizResult';
import { AdminCMS } from './components/AdminCMS';

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

  // Load quizzes from API
  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
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
      console.error('Failed to load quizzes:', err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [selectedCategory, searchKeyword]);

  // Check URL query param for direct quiz loading (e.g. ?id=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    if (quizId) {
      handleSelectQuiz(parseInt(quizId, 10));
    }
  }, []);

  // Start a quiz by ID
  const handleSelectQuiz = async (quizId: number) => {
    try {
      const res = await fetch(`/api/quiz-detail?id=${quizId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveQuiz(json.data.quiz);
        setQuestions(json.data.questions || []);
        setCurrentView('player');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      alert('Gagal memuat detail kuis: ' + err);
    }
  };

  // Submit answers to Server-Side Quiz Engine
  const handleSubmitAnswers = async (answers: { question_id: number; option_id: number }[]) => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: activeQuiz.id,
          session_id: 'guest_' + Math.random().toString(36).substring(2, 10),
          answers,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSubmissionResult(json.data);
        setCurrentView('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(json.message || 'Gagal menghitung hasil.');
      }
    } catch (err) {
      alert('Error saat mengirim jawaban: ' + err);
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

