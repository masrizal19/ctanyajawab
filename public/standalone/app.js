/**
 * ATW (Answer to Wrong) - Standalone Frontend Application
 * Pure Vanilla JavaScript (Modular ES6 / Clean Event Listeners)
 */

(function () {
  'use strict';

  // API Base URL - switches automatically whether running under PHP XAMPP (e.g. /backend/api) or Node Express (/api)
  const isPhpPath = window.location.pathname.includes('/backend/') || window.location.pathname.includes('/standalone/');
  const API_BASE = window.location.origin.includes(':3000') 
    ? '/api' 
    : (isPhpPath ? '../backend/api' : '/backend/api');

  // Application State
  const state = {
    activeView: 'catalog', // 'catalog' | 'quiz' | 'result' | 'doc'
    quizzes: [],
    categories: [],
    selectedCategory: 'Semua',
    searchKeyword: '',
    
    // Active Quiz Session State
    currentQuiz: null,
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswers: {}, // map question_id -> option_id
    scoreAccumulator: 0,
    isSubmitting: false,
    quizResult: null,

    // Error & Loading flags
    isLoading: false,
    errorMessage: null
  };

  // DOM Elements Cache
  const els = {
    viewCatalog: document.getElementById('view-catalog'),
    viewQuizPlayer: document.getElementById('view-quiz-player'),
    viewResult: document.getElementById('view-result'),
    viewApiDoc: document.getElementById('view-api-doc'),
    btnNavHome: document.getElementById('btn-nav-home'),
    btnNavApiDoc: document.getElementById('btn-nav-api-doc'),
    brandLink: document.getElementById('brand-link')
  };

  // ==========================================
  // VIEW ROUTER / SWITCHER
  // ==========================================
  function setView(viewName) {
    state.activeView = viewName;
    els.viewCatalog.classList.toggle('hidden', viewName !== 'catalog');
    els.viewQuizPlayer.classList.toggle('hidden', viewName !== 'quiz');
    els.viewResult.classList.toggle('hidden', viewName !== 'result');
    els.viewApiDoc.classList.toggle('hidden', viewName !== 'doc');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'catalog') {
      renderCatalog();
    } else if (viewName === 'quiz') {
      renderQuizQuestion();
    } else if (viewName === 'result') {
      renderResultView();
    } else if (viewName === 'doc') {
      renderApiDocView();
    }
  }

  // ==========================================
  // API CLIENT (FETCH SERVICES)
  // ==========================================
  async function fetchQuizzes() {
    state.isLoading = true;
    state.errorMessage = null;
    renderCatalog();

    try {
      let url = `${API_BASE}/quizzes`;
      // Support for PHP file endpoint format if running directly on raw PHP
      if (API_BASE.endsWith('/api') && window.location.port !== '3000') {
        url = `${API_BASE}/quizzes.php`;
      }

      const params = new URLSearchParams();
      if (state.selectedCategory && state.selectedCategory !== 'Semua') {
        params.append('category', state.selectedCategory);
      }
      if (state.searchKeyword) {
        params.append('search', state.searchKeyword);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        state.quizzes = json.data.quizzes || [];
        state.categories = json.data.categories || [];
      } else {
        throw new Error(json.message || 'Gagal memuat data kuis.');
      }
    } catch (err) {
      console.error('Fetch quizzes error:', err);
      state.errorMessage = 'Gagal terhubung ke API backend. Pastikan server PHP atau Express sudah berjalan.';
    } finally {
      state.isLoading = false;
      renderCatalog();
    }
  }

  async function startQuiz(quizId) {
    state.isLoading = true;
    state.errorMessage = null;
    state.currentQuestionIndex = 0;
    state.selectedAnswers = {};
    state.scoreAccumulator = 0;
    state.quizResult = null;

    let url = `${API_BASE}/quiz-detail?id=${quizId}`;
    if (API_BASE.endsWith('/api') && window.location.port !== '3000') {
      url = `${API_BASE}/quiz-detail.php?id=${quizId}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        state.currentQuiz = json.data.quiz;
        state.questions = json.data.questions || [];
        state.isLoading = false;
        setView('quiz');
      } else {
        throw new Error(json.message || 'Detail kuis tidak ditemukan.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
      state.isLoading = false;
    }
  }

  async function submitQuizAnswers() {
    if (state.isSubmitting) return;
    state.isSubmitting = true;
    renderQuizQuestion();

    // Format payload for Backend Engine
    const answersPayload = Object.entries(state.selectedAnswers).map(([qid, oid]) => ({
      question_id: parseInt(qid, 10),
      option_id: parseInt(oid, 10)
    }));

    let url = `${API_BASE}/submit-quiz`;
    if (API_BASE.endsWith('/api') && window.location.port !== '3000') {
      url = `${API_BASE}/submit-quiz.php`;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          quiz_id: state.currentQuiz.id,
          session_id: 'atw_sess_' + Math.random().toString(36).substring(2, 10),
          answers: answersPayload
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghitung hasil kuis.');
      }

      state.quizResult = json.data;
      setView('result');
    } catch (err) {
      alert('Gagal mengirim jawaban: ' + err.message);
    } finally {
      state.isSubmitting = false;
    }
  }

  // ==========================================
  // RENDERERS
  // ==========================================

  function renderCatalog() {
    if (state.isLoading) {
      els.viewCatalog.innerHTML = `
        <div class="py-20 text-center space-y-4">
          <div class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-medium text-slate-500">Memuat modul kuis interaktif ATW...</p>
        </div>
      `;
      return;
    }

    if (state.errorMessage) {
      els.viewCatalog.innerHTML = `
        <div class="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
          <div class="font-bold text-lg">Pemberitahuan Sistem</div>
          <p class="text-sm">${state.errorMessage}</p>
          <button id="btn-retry" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl">
            Coba Lagi
          </button>
        </div>
      `;
      document.getElementById('btn-retry')?.addEventListener('click', fetchQuizzes);
      return;
    }

    // Hero Section + Category Filter + Cards Grid
    const featuredQuiz = state.quizzes[0];

    els.viewCatalog.innerHTML = `
      <!-- Hero Recommendation Banner -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-8 md:p-12 shadow-xl">
        <div class="relative z-10 max-w-2xl space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide text-blue-100">
            <span>✨ Kuis Terpopuler Hari Ini</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Temukan Arah Karir & Gaya Kerja Terbaikmu
          </h1>
          <p class="text-blue-100 text-sm md:text-base leading-relaxed">
            Jawab pertanyaan interaktif dengan sistem dynamic scoring ATW untuk memetakan kepribadian, ritme fokus, dan rekomendasi peran digital terbaikmu.
          </p>
          <div class="flex flex-wrap items-center gap-4 pt-2">
            ${featuredQuiz ? `
              <button data-quiz-id="${featuredQuiz.id}" class="btn-start-hero px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                Mulai Kuis Sekarang →
              </button>
            ` : ''}
            <button id="btn-explore-anchor" class="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-sm transition-all">
              Jelajahi Semua Modul
            </button>
          </div>
        </div>
        
        <!-- Subtle floating graphics -->
        <div class="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      </section>

      <!-- Category Filter Bar -->
      <section class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800">Kategori Pilihan</h2>
            <p class="text-xs text-slate-500">Pilih topik kuis yang ingin kamu selesaikan</p>
          </div>
          
          <!-- Search input -->
          <div class="relative w-full sm:w-72">
            <input 
              type="text" 
              id="input-search"
              value="${state.searchKeyword}" 
              placeholder="Cari topik kuis..."
              class="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        <!-- Category pills -->
        <div class="flex flex-wrap gap-2 pt-1" id="category-pills">
          <button data-category="Semua" class="btn-cat-pill px-4 py-2 rounded-xl text-xs font-semibold transition-all ${state.selectedCategory === 'Semua' ? 'bg-blue-600 text-white shadow-md' : 'neu-surface text-slate-600 hover:text-slate-900'}">
            Semua (${state.quizzes.length})
          </button>
          ${state.categories.map(cat => `
            <button data-category="${cat.category}" class="btn-cat-pill px-4 py-2 rounded-xl text-xs font-semibold transition-all ${state.selectedCategory === cat.category ? 'bg-blue-600 text-white shadow-md' : 'neu-surface text-slate-600 hover:text-slate-900'}">
              ${cat.category}
            </button>
          `).join('')}
        </div>
      </section>

      <!-- Quiz Cards Grid -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${state.quizzes.map(quiz => `
          <div class="neu-surface rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  ${quiz.category}
                </span>
                <span class="text-xs font-semibold text-slate-400">
                  ★ ${quiz.rating || 4.9}
                </span>
              </div>

              <div class="w-full h-36 rounded-2xl overflow-hidden relative bg-slate-100">
                <img src="${quiz.thumbnail}" alt="${quiz.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-medium text-white">
                  ${quiz.total_questions || 5} Pertanyaan
                </div>
              </div>

              <div>
                <h3 class="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                  ${quiz.title}
                </h3>
                <p class="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  ${quiz.description}
                </p>
              </div>
            </div>

            <div class="pt-6 mt-4 border-t border-slate-200/60 flex items-center justify-between">
              <div class="text-[11px] text-slate-500">
                <span>⏱️ ~2 Menit</span>
              </div>
              <button data-quiz-id="${quiz.id}" class="btn-start-quiz px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm">
                Mulai Kuis →
              </button>
            </div>
          </div>
        `).join('')}
      </section>
    `;

    // Bind events
    document.querySelectorAll('.btn-start-quiz, .btn-start-hero').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qid = e.currentTarget.getAttribute('data-quiz-id');
        if (qid) startQuiz(qid);
      });
    });

    document.querySelectorAll('.btn-cat-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.selectedCategory = e.currentTarget.getAttribute('data-category') || 'Semua';
        fetchQuizzes();
      });
    });

    const searchInput = document.getElementById('input-search');
    let debounceTimer;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchKeyword = e.target.value;
        fetchQuizzes();
      }, 350);
    });

    document.getElementById('btn-explore-anchor')?.addEventListener('click', () => {
      document.querySelector('.grid')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function renderQuizQuestion() {
    if (!state.currentQuiz || state.questions.length === 0) {
      els.viewQuizPlayer.innerHTML = `<p class="text-center text-slate-500">Tidak ada pertanyaan pada kuis ini.</p>`;
      return;
    }

    const total = state.questions.length;
    const currentQ = state.questions[state.currentQuestionIndex];
    const progressPct = Math.round(((state.currentQuestionIndex + 1) / total) * 100);
    const selectedOptionId = state.selectedAnswers[currentQ.id];

    els.viewQuizPlayer.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-6">
        
        <!-- Header Progress -->
        <div class="flex items-center justify-between text-xs font-semibold text-slate-500">
          <button id="btn-abort-quiz" class="hover:text-slate-800 transition-colors flex items-center gap-1">
            ← Batalkan Kuis
          </button>
          <span>Pertanyaan ${state.currentQuestionIndex + 1} dari ${total}</span>
        </div>

        <!-- Animated Progress Bar -->
        <div class="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div class="h-full bg-blue-600 transition-all duration-300 rounded-full" style="width: ${progressPct}%"></div>
        </div>

        <!-- Question Card -->
        <div class="neu-surface rounded-3xl p-6 sm:p-8 space-y-6">
          <div class="space-y-2">
            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">${state.currentQuiz.category}</span>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              ${currentQ.question_text}
            </h2>
          </div>

          <!-- Options list -->
          <div class="space-y-3" id="options-container">
            ${currentQ.options.map((opt, idx) => {
              const isSelected = selectedOptionId === opt.id;
              const letter = String.fromCharCode(65 + idx);
              return `
                <button 
                  data-option-id="${opt.id}" 
                  class="option-item w-full p-4 rounded-2xl text-left flex items-start gap-4 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-50 border-2 border-blue-600 shadow-md' 
                      : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'
                  }">
                  <span class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }">
                    ${letter}
                  </span>
                  <span class="text-sm font-medium text-slate-800 pt-0.5 leading-relaxed">
                    ${opt.option_text}
                  </span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Action Bar -->
          <div class="pt-4 flex items-center justify-between">
            <button 
              id="btn-prev-q" 
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all ${
                state.currentQuestionIndex === 0 ? 'opacity-40 pointer-events-none' : ''
              }">
              ← Pertanyaan Sebelumnya
            </button>

            ${state.currentQuestionIndex === total - 1 ? `
              <button 
                id="btn-finish-quiz" 
                class="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md ${
                  !selectedOptionId || state.isSubmitting ? 'opacity-50 pointer-events-none' : ''
                }">
                ${state.isSubmitting ? 'Menganalisis Jawaban...' : 'Selesai & Lihat Hasil ✓'}
              </button>
            ` : `
              <button 
                id="btn-next-q" 
                class="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm ${
                  !selectedOptionId ? 'opacity-40 pointer-events-none' : ''
                }">
                Lanjut →
              </button>
            `}
          </div>

        </div>

      </div>
    `;

    // Option select event
    document.querySelectorAll('.option-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const oid = parseInt(e.currentTarget.getAttribute('data-option-id'), 10);
        state.selectedAnswers[currentQ.id] = oid;
        renderQuizQuestion();
      });
    });

    // Navigation events
    document.getElementById('btn-prev-q')?.addEventListener('click', () => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        renderQuizQuestion();
      }
    });

    document.getElementById('btn-next-q')?.addEventListener('click', () => {
      if (state.currentQuestionIndex < total - 1 && state.selectedAnswers[currentQ.id]) {
        state.currentQuestionIndex++;
        renderQuizQuestion();
      }
    });

    document.getElementById('btn-finish-quiz')?.addEventListener('click', () => {
      submitQuizAnswers();
    });

    document.getElementById('btn-abort-quiz')?.addEventListener('click', () => {
      if (confirm('Apakah kamu yakin ingin keluar dari sesi kuis ini?')) {
        setView('catalog');
      }
    });
  }

  function renderResultView() {
    if (!state.quizResult) {
      setView('catalog');
      return;
    }

    const res = state.quizResult;
    const rule = res.result;

    els.viewResult.innerHTML = `
      <div class="max-w-2xl mx-auto space-y-8 animate-fadeIn">
        
        <!-- Result Card -->
        <div class="neu-surface rounded-3xl p-8 text-center space-y-6">
          
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            ✓ Evaluasi Server-Side Selesai
          </div>

          <div class="space-y-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hasil Diagnosis Karakter</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              ${rule.title}
            </h1>
            <div class="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              🏷️ ${rule.badge}
            </div>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            ${rule.description}
          </p>

          <!-- Score & Dominant Code metric tiles -->
          <div class="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 border-t border-slate-200">
            <div class="p-4 rounded-2xl bg-white border border-slate-200">
              <div class="text-xs text-slate-400 font-medium">Akumulasi Skor</div>
              <div class="text-2xl font-black text-slate-800 mt-1">${res.total_score || res.score || 100} pts</div>
            </div>
            <div class="p-4 rounded-2xl bg-white border border-slate-200">
              <div class="text-xs text-slate-400 font-medium">Result Code Dominan</div>
              <div class="text-sm font-bold text-blue-600 mt-2 truncate">${res.dominant_code || rule.code || '-'}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-6 flex flex-wrap items-center justify-center gap-3">
            <button id="btn-restart-quiz" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md">
              🔄 Kerjakan Ulang
            </button>
            <button id="btn-back-catalog" class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
              Jelajahi Kuis Lain
            </button>
          </div>

        </div>

      </div>
    `;

    document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
      if (state.currentQuiz) {
        startQuiz(state.currentQuiz.id);
      }
    });

    document.getElementById('btn-back-catalog')?.addEventListener('click', () => {
      setView('catalog');
    });
  }

  function renderApiDocView() {
    els.viewApiDoc.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 class="text-2xl font-black text-slate-900">Arsitektur Sistem & Spesifikasi API ATW</h1>
          <p class="text-sm text-slate-500 mt-1">Dokumentasi integrasi database MySQL, backend PHP PDO, dan alur request.</p>
        </div>

        <!-- Section DDL & Schema -->
        <div class="neu-surface rounded-3xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-800">1. Skema Database Relasional (schema.sql)</h2>
            <span class="text-xs px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono">MySQL / MariaDB</span>
          </div>
          <p class="text-xs text-slate-600">
            Terdiri dari 6 tabel: <code class="bg-slate-200 px-1 py-0.5 rounded">users</code>, <code class="bg-slate-200 px-1 py-0.5 rounded">quizzes</code>, <code class="bg-slate-200 px-1 py-0.5 rounded">questions</code>, <code class="bg-slate-200 px-1 py-0.5 rounded">options</code>, <code class="bg-slate-200 px-1 py-0.5 rounded">result_rules</code>, dan <code class="bg-slate-200 px-1 py-0.5 rounded">user_responses</code>.
          </p>
          <pre class="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs overflow-x-auto font-mono"><code>-- Contoh Query DDL:
CREATE TABLE \`user_responses\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`user_id\` INT UNSIGNED DEFAULT NULL,
  \`session_id\` VARCHAR(100) DEFAULT NULL,
  \`quiz_id\` INT UNSIGNED NOT NULL,
  \`final_result_id\` INT UNSIGNED DEFAULT NULL,
  \`total_score\` INT NOT NULL DEFAULT 0,
  \`dominant_code\` VARCHAR(50) DEFAULT NULL,
  \`answers_payload\` JSON DEFAULT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
);</code></pre>
        </div>

        <!-- Section API Endpoints -->
        <div class="neu-surface rounded-3xl p-6 space-y-4">
          <h2 class="text-base font-bold text-slate-800">2. Endpoint REST API PHP PDO</h2>
          <div class="space-y-3 text-xs">
            <div class="p-3 bg-white rounded-xl border border-slate-200">
              <span class="font-bold text-emerald-600">GET</span> <code class="font-mono text-slate-800">/api/quizzes.php</code>
              <p class="text-slate-500 mt-1">Mengambil daftar kuis aktif dan daftar kategori untuk filter.</p>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-200">
              <span class="font-bold text-emerald-600">GET</span> <code class="font-mono text-slate-800">/api/quiz-detail.php?id={id}</code>
              <p class="text-slate-500 mt-1">Mengambil detail kuis, daftar pertanyaan, dan opsi jawaban terstruktur.</p>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-200">
              <span class="font-bold text-blue-600">POST</span> <code class="font-mono text-slate-800">/api/submit-quiz.php</code>
              <p class="text-slate-500 mt-1">Menerima jawaban, kalkulasi skor &amp; result_code dominan di server-side, menyimpan ke database, dan mengembalikan hasil.</p>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function init() {
    els.btnNavHome?.addEventListener('click', () => setView('catalog'));
    els.btnNavApiDoc?.addEventListener('click', () => setView('doc'));
    els.brandLink?.addEventListener('click', (e) => {
      e.preventDefault();
      setView('catalog');
    });

    fetchQuizzes();
  }

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
