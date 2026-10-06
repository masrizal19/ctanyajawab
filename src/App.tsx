import React, { useState, useEffect } from 'react';
import { Quiz, Question, SubmissionResponse } from './types';
import { Header } from './components/Header';
import { QuizCatalog } from './components/QuizCatalog';
import { QuizPlayer } from './components/QuizPlayer';
import { QuizResult } from './components/QuizResult';
import { AdminCMS } from './components/AdminCMS';
import { getQuizzes, getQuizById, submitQuizAnswers } from './services/quizService';

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

  // Load quizzes from quizService (Pure Supabase Client query, no local HTTP fallback)
  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const { quizzes: loadedQuizzes, categories: loadedCategories } = await getQuizzes({
        category: selectedCategory,
        search: searchKeyword
      });
      setQuizzes(loadedQuizzes);
      setCategories(loadedCategories);
    } catch (err) {
      console.warn('Notice loading quizzes:', err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [selectedCategory, searchKeyword]);

  // Start a quiz by ID (String ID compliant via quizService)
  const handleSelectQuiz = async (quizId: string | number) => {
    const cleanId = String(quizId || '').trim();
    if (!cleanId) return;

    try {
      const { quiz: loadedQuiz, questions: loadedQuestions } = await getQuizById(cleanId);
      setActiveQuiz(loadedQuiz);
      setQuestions(loadedQuestions);
      setCurrentView('player');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Submit answers using quizService
  const handleSubmitAnswers = async (answers: { question_id: number; option_id: number }[]) => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const result = await submitQuizAnswers({
        quiz: activeQuiz,
        answers,
        questions
      });
      setSubmissionResult(result);
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

