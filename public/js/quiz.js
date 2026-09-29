/**
 * ATW (Answer to Wrong) - Public Interactive Quiz Logic
 * Vanilla JavaScript (ES6 Modular & Clean Event Listeners)
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentQuiz: null,
    questions: [],
    currentIndex: 0,
    userAnswers: {}, // { [questionId]: optionId }
    isSubmitting: false,
    finalResult: null
  };

  // Temporary array to store user's selected answers during the quiz
  let userSelections = [
    // Format: { questionId: 1, questionText: "...", selectedOption: "A", optionText: "...", points: 10, category: "..." }
  ];

  // DOM Elements
  const els = {
    viewLoading: document.getElementById('view-loading'),
    viewCatalog: document.getElementById('view-catalog'),
    viewQuizPlayer: document.getElementById('view-quiz-player'),
    viewQuizResult: document.getElementById('result-screen') || document.getElementById('view-quiz-result'),
    
    catalogGrid: document.getElementById('catalog-grid'),
    btnCatalogToggle: document.getElementById('btn-catalog-toggle'),

    // Player Elements
    playerCategory: document.getElementById('player-category'),
    playerQuizTitle: document.getElementById('player-quiz-title'),
    playerProgressCounter: document.getElementById('player-progress-counter'),
    playerProgressBar: document.getElementById('player-progress-bar'),
    playerQuestionNumber: document.getElementById('player-question-number'),
    playerQuestionText: document.getElementById('player-question-text'),
    playerOptionsContainer: document.getElementById('player-options-container'),
    playerValidationAlert: document.getElementById('player-validation-alert'),

    btnPrevQuestion: document.getElementById('btn-prev-question'),
    btnNextQuestion: document.getElementById('btn-next-question'),
    btnSubmitQuiz: document.getElementById('btn-submit-quiz'),

    // Result Elements (Kartu Utama & Rincian Jawaban)
    resultBadge: document.getElementById('result-badge'),
    resultTitle: document.getElementById('result-title'),
    resultScore: document.getElementById('result-score'),
    resultDescription: document.getElementById('result-description'),
    resultStrengthsList: document.getElementById('result-strengths-list'),
    resultRecommendation: document.getElementById('result-recommendation'),
    resultAdviceCard: document.getElementById('result-advice-card'),
    resultAdviceList: document.getElementById('result-advice-list'),
    resultScoreBar: document.getElementById('result-score-bar'),

    breakdownCounterBadge: document.getElementById('breakdown-counter-badge'),
    resultAnswersBreakdown: document.getElementById('result-answers-breakdown'),

    btnRetakeQuiz: document.getElementById('btn-retake-quiz'),
    btnBackToCatalog: document.getElementById('btn-back-to-catalog'),
    btnCopyResultLink: document.getElementById('btn-copy-result-link'),
    copyResultText: document.getElementById('copy-result-text')
  };

  // Helper: Show View
  function showView(viewName) {
    if (els.viewLoading) els.viewLoading.classList.add('hidden');
    if (els.viewCatalog) els.viewCatalog.classList.add('hidden');
    if (els.viewQuizPlayer) els.viewQuizPlayer.classList.add('hidden');
    if (els.viewQuizResult) els.viewQuizResult.classList.add('hidden');

    if (viewName === 'loading' && els.viewLoading) els.viewLoading.classList.remove('hidden');
    if (viewName === 'catalog' && els.viewCatalog) els.viewCatalog.classList.remove('hidden');
    if (viewName === 'player' && els.viewQuizPlayer) els.viewQuizPlayer.classList.remove('hidden');
    if (viewName === 'result' && els.viewQuizResult) els.viewQuizResult.classList.remove('hidden');
  }

  // Fetch Public Quiz Catalog via Supabase SDK Client
  async function loadCatalog() {
    showView('loading');
    try {
      // Direct Supabase query:
      // const { data, error } = await supabase.from('quizzes').select('*').eq('is_published', true);
      const quizzes = await window.ATWSupabase.fetchPublishedQuizzes();
      renderCatalog(quizzes);
      showView('catalog');
    } catch (err) {
      console.error('Gagal memuat katalog:', err);
      renderCatalog([]);
      showView('catalog');
    }
  }

  // Render Catalog Grid
  function renderCatalog(quizzes) {
    if (!els.catalogGrid) return;
    els.catalogGrid.innerHTML = '';

    if (!quizzes || quizzes.length === 0) {
      els.catalogGrid.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white rounded-3xl p-8 border border-slate-200">
          <p class="text-slate-500 font-semibold">Belum ada kuis yang dipublikasikan saat ini.</p>
          <a href="admin.html" class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Buat Kuis di Panel Admin
          </a>
        </div>
      `;
      return;
    }

    quizzes.forEach(q => {
      const card = document.createElement('div');
      card.className = 'flex flex-col justify-between p-6 rounded-3xl bg-[#f1f5f9] shadow-soft-flat border border-white/80 hover:shadow-soft-card transition-all duration-300 group';
      
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">
              ${escapeHtml(q.category || 'Umum')}
            </span>
            <span class="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ${q.est_time || '3 Menit'}
            </span>
          </div>

          <h3 class="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            ${escapeHtml(q.title)}
          </h3>

          <p class="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            ${escapeHtml(q.description || 'Kuis interaktif dengan penentuan hasil dinamis.')}
          </p>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">
            ${q.total_questions || 5} Pertanyaan
          </span>
          <button data-id="${q.id}" class="btn-start-quiz flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all">
            <span>Mulai Kuis</span>
            <span>&rarr;</span>
          </button>
        </div>
      `;

      card.querySelector('.btn-start-quiz').addEventListener('click', () => {
        loadQuiz(q.id);
      });

      els.catalogGrid.appendChild(card);
    });
  }

  // Load Single Quiz by ID or Slug via Supabase SDK Client
  async function loadQuiz(quizId) {
    showView('loading');
    try {
      // Update URL query without full page reload
      const newUrl = `${window.location.pathname}?id=${quizId}`;
      window.history.pushState({ id: quizId }, '', newUrl);

      // Relational Supabase query:
      // const { data, error } = await supabase
      //   .from('quizzes')
      //   .select('*, questions(*, options(*)), result_rules(*)')
      //   .eq('id', quizId)
      //   .single();
      const quizData = await window.ATWSupabase.fetchQuizDetail(quizId);

      state.currentQuiz = quizData.quiz;
      state.questions = quizData.questions || [];
      state.resultRules = quizData.result_rules || [];
      state.currentIndex = 0;
      state.userAnswers = {};
      userSelections = [];
      state.finalResult = null;

      if (state.questions.length === 0) {
        alert('Kuis ini belum memiliki daftar pertanyaan.');
        loadCatalog();
        return;
      }

      initPlayer();
      showView('player');
    } catch (err) {
      console.error('Gagal memuat kuis:', err);
      alert('Maaf, kuis tidak ditemukan atau gagal dimuat: ' + err.message);
      loadCatalog();
    }
  }

  // Init Interactive Player
  function initPlayer() {
    if (els.playerCategory) els.playerCategory.textContent = state.currentQuiz.category || 'Kuis CTW';
    if (els.playerQuizTitle) els.playerQuizTitle.textContent = state.currentQuiz.title;
    renderCurrentQuestion();
  }

  // Render Current Question
  function renderCurrentQuestion() {
    const q = state.questions[state.currentIndex];
    if (!q) return;

    const total = state.questions.length;
    const currentNum = state.currentIndex + 1;
    const progressPercent = Math.round((currentNum / total) * 100);

    // Update Progress
    if (els.playerProgressCounter) els.playerProgressCounter.textContent = `Pertanyaan ${currentNum} dari ${total}`;
    if (els.playerProgressBar) els.playerProgressBar.style.width = `${progressPercent}%`;
    if (els.playerQuestionNumber) els.playerQuestionNumber.textContent = currentNum;
    if (els.playerQuestionText) els.playerQuestionText.textContent = q.question_text;

    // Hide validation alert
    if (els.playerValidationAlert) els.playerValidationAlert.classList.add('hidden');

    // Render Options
    if (els.playerOptionsContainer) {
      els.playerOptionsContainer.innerHTML = '';
      const selectedOptionId = state.userAnswers[q.id];
      const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];

      (q.options || []).forEach((opt, idx) => {
        const isSelected = selectedOptionId === opt.id;
        const letter = letterMap[idx] || (idx + 1);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-full text-left p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 transition-all duration-200 ${
          isSelected 
            ? 'bg-blue-50/90 border-2 border-blue-600 shadow-sm' 
            : 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs'
        }`;

        btn.innerHTML = `
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }">
            ${letter}
          </span>
          <span class="text-xs sm:text-sm font-medium leading-relaxed ${
            isSelected ? 'text-blue-900 font-semibold' : 'text-slate-800'
          }">
            ${escapeHtml(opt.option_text)}
          </span>
        `;

        btn.addEventListener('click', () => {
          state.userAnswers[q.id] = opt.id;

          // Record selection in userSelections array
          const existingIdx = userSelections.findIndex(item => item.questionId === q.id);
          const selectionItem = {
            questionId: q.id,
            questionText: q.question_text,
            selectedOption: letter,
            optionText: opt.option_text,
            points: opt.score_value || 0,
            category: opt.result_code || ''
          };

          if (existingIdx >= 0) {
            userSelections[existingIdx] = selectionItem;
          } else {
            userSelections.push(selectionItem);
          }

          if (els.playerValidationAlert) els.playerValidationAlert.classList.add('hidden');
          renderCurrentQuestion();
        });

        els.playerOptionsContainer.appendChild(btn);
      });
    }

    // Update Navigation Buttons State
    if (els.btnPrevQuestion) {
      els.btnPrevQuestion.disabled = state.currentIndex === 0;
    }

    const isLast = state.currentIndex === total - 1;
    if (els.btnNextQuestion) {
      els.btnNextQuestion.classList.toggle('hidden', isLast);
    }
    if (els.btnSubmitQuiz) {
      els.btnSubmitQuiz.classList.toggle('hidden', !isLast);
    }
  }

  // Next Question Handler
  function handleNext() {
    const q = state.questions[state.currentIndex];
    if (!state.userAnswers[q.id]) {
      if (els.playerValidationAlert) els.playerValidationAlert.classList.remove('hidden');
      return;
    }
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      renderCurrentQuestion();
    }
  }

  // Previous Question Handler
  function handlePrev() {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderCurrentQuestion();
    }
  }

  // Finish Quiz Handler - invoked when finishing the last question
  async function finishQuiz() {
    const q = state.questions[state.currentIndex];
    if (!state.userAnswers[q.id]) {
      if (els.playerValidationAlert) els.playerValidationAlert.classList.remove('hidden');
      return;
    }
    await handleSubmit();
  }

  // Submit Quiz Answers Handler
  async function handleSubmit() {
    const q = state.questions[state.currentIndex];
    if (!state.userAnswers[q.id]) {
      if (els.playerValidationAlert) els.playerValidationAlert.classList.remove('hidden');
      return;
    }

    // Format answers array
    const answersPayload = Object.entries(state.userAnswers).map(([qId, optId]) => ({
      question_id: parseInt(qId, 10),
      option_id: parseInt(optId, 10)
    }));

    showView('loading');
    state.isSubmitting = true;

    try {
      // Direct Supabase Client-Side Scoring & Diagnosis Calculation:
      // - Hitung total skor dari pilihan user secara client-side
      // - Ambil data result_rules dari Supabase mencakup rentang min_score dan max_score
      // - Simpan jawaban dan skor ke tabel 'user_responses'
      const diagnosisResult = await window.ATWSupabase.submitQuizAndDiagnose(
        state.currentQuiz.id,
        state.userAnswers,
        state.questions,
        state.resultRules
      );

      // Mapping user selections untuk tampilan breakdown review
      if (Array.isArray(diagnosisResult.answers_payload)) {
        userSelections = diagnosisResult.answers_payload.map(ans => ({
          questionId: ans.question_id,
          questionText: ans.question_text,
          selectedOption: ans.selected_letter || 'A',
          optionText: ans.option_text,
          points: ans.score_value,
          category: ans.result_code || ''
        }));
      }

      state.finalResult = diagnosisResult;
      renderResultScreen(diagnosisResult, userSelections);
    } catch (err) {
      console.error('Submit kuis gagal:', err);
      alert('Gagal mengirimkan kuis: ' + (err.message || 'Periksa koneksi database.'));
      showView('player');
    } finally {
      state.isSubmitting = false;
    }
  }

  // Render Result Screen & Answer Review Breakdown
  function renderResultScreen(data, selections) {
    const resultObj = data.result || {};
    const totalScore = data.total_score || 0;
    const items = selections || userSelections || [];

    // Hide quiz container and reveal Result Screen
    showView('result');

    // Sort items by question index
    const sortedItems = [...items].sort((a, b) => {
      const idxA = state.questions.findIndex(qu => qu.id === a.questionId);
      const idxB = state.questions.findIndex(qu => qu.id === b.questionId);
      return idxA - idxB;
    });

    // 1. CARD UTAMA DIAGNOSIS
    if (els.resultBadge) {
      els.resultBadge.textContent = resultObj.badge || 'Hasil Diagnosis';
      if (resultObj.badge_color) {
        els.resultBadge.style.backgroundColor = `${resultObj.badge_color}18`;
        els.resultBadge.style.color = resultObj.badge_color;
        els.resultBadge.style.borderColor = `${resultObj.badge_color}40`;
      }
    }
    if (els.resultTitle) {
      els.resultTitle.textContent = resultObj.title || 'Evaluasi Profil Karakter CTW';
    }
    if (els.resultScore) {
      els.resultScore.textContent = `Tingkat Keparahan: ${totalScore}%`;
    }

    const confEl = document.getElementById('result-confidence');
    const bayesData = data.bayes || {};
    const postProb = bayesData.posterior_probabilities || {
      ringan: totalScore <= 35 ? Math.max(70, 100 - totalScore) : Math.max(0, 40 - totalScore),
      sedang: totalScore >= 36 && totalScore <= 70 ? 75 : (totalScore > 70 ? 20 : 25),
      kritis: totalScore >= 71 ? Math.min(100, totalScore + 10) : (totalScore >= 36 ? 15 : 5)
    };
    const confVal = bayesData.confidence_percentage || (totalScore >= 71 ? postProb.kritis : totalScore >= 36 ? postProb.sedang : postProb.ringan);
    if (confEl) {
      confEl.textContent = `Keyakinan Bayes: ${confVal}%`;
    }

    // Update Posterior Probability bars if element exists
    const pRingan = document.getElementById('bayes-prob-ringan');
    const bRingan = document.getElementById('bayes-bar-ringan');
    const pSedang = document.getElementById('bayes-prob-sedang');
    const bSedang = document.getElementById('bayes-bar-sedang');
    const pKritis = document.getElementById('bayes-prob-kritis');
    const bKritis = document.getElementById('bayes-bar-kritis');

    if (pRingan && bRingan) {
      pRingan.textContent = `${postProb.ringan}%`;
      bRingan.style.width = `${postProb.ringan}%`;
    }
    if (pSedang && bSedang) {
      pSedang.textContent = `${postProb.sedang}%`;
      bSedang.style.width = `${postProb.sedang}%`;
    }
    if (pKritis && bKritis) {
      pKritis.textContent = `${postProb.kritis}%`;
      bKritis.style.width = `${postProb.kritis}%`;
    }

    // Score Bar Progress & Color (Scale 0% - 100%)
    if (els.resultScoreBar) {
      const pct = Math.min(100, Math.max(3, Math.round(totalScore)));
      els.resultScoreBar.style.width = `${pct}%`;
      if (totalScore <= 35) {
        els.resultScoreBar.className = 'h-full rounded-full bg-emerald-500 transition-all duration-700';
      } else if (totalScore <= 70) {
        els.resultScoreBar.className = 'h-full rounded-full bg-amber-500 transition-all duration-700';
      } else {
        els.resultScoreBar.className = 'h-full rounded-full bg-rose-500 transition-all duration-700';
      }
    }

    // Kombinasi huruf jawaban (misal: A, B, C)
    const comboLetters = sortedItems.map(it => it.selectedOption).filter(Boolean);
    const comboStr = comboLetters.length > 0 ? comboLetters.join(', ') : '';
    let descText = resultObj.description || 'Kondisi perangkat telah dianalisis berdasarkan parameter uji teknis.';
    if (comboStr && !descText.toLowerCase().includes('kombinasi jawaban')) {
      descText = `Berdasarkan pola pilihan jawaban kamu (${comboStr}): ${descText}`;
    }
    if (els.resultDescription) {
      els.resultDescription.textContent = descText;
    }

    // Actionable Advice List
    if (els.resultAdviceList) {
      els.resultAdviceList.innerHTML = '';
      const adviceItems = resultObj.actionable_advice || resultObj.strengths || [];
      if (Array.isArray(adviceItems) && adviceItems.length > 0) {
        if (els.resultAdviceCard) els.resultAdviceCard.classList.remove('hidden');
        adviceItems.forEach((adv, idx) => {
          const itemDiv = document.createElement('div');
          itemDiv.className = 'flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700';
          itemDiv.innerHTML = `
            <span class="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
              ${idx + 1}
            </span>
            <span class="leading-relaxed font-medium">${escapeHtml(adv)}</span>
          `;
          els.resultAdviceList.appendChild(itemDiv);
        });
      } else if (els.resultAdviceCard) {
        els.resultAdviceCard.classList.add('hidden');
      }
    }

    // 2. CARD RINCIAN JAWABAN (ANSWER BREAKDOWN / REVIEW SECTION)
    if (els.breakdownCounterBadge) {
      els.breakdownCounterBadge.textContent = `${sortedItems.length} Pertanyaan Terjawab`;
    }

    if (els.resultAnswersBreakdown) {
      els.resultAnswersBreakdown.innerHTML = '';

      if (!sortedItems || sortedItems.length === 0) {
        els.resultAnswersBreakdown.innerHTML = `
          <div class="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-slate-200">
            Belum ada rincian jawaban tersimpan.
          </div>
        `;
      } else {
        // Iterasi pada userSelections untuk merender elemen HTML Rincian Jawaban sesuai format
        sortedItems.forEach((item, index) => {
          const card = document.createElement('div');
          card.className = 'p-4 rounded-2xl bg-slate-50 space-y-2 border border-slate-100/80 shadow-2xs';

          card.innerHTML = `
            <!-- Pertanyaan Number & Points -->
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-slate-500">Pertanyaan ${index + 1}</p>
              ${item.points !== undefined ? `
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  item.points >= 71 || item.points === 100
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : item.points >= 36 || item.points === 50
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }">
                  Bobot: ${item.points}% (${item.points <= 0 ? 'Normal' : item.points <= 50 ? 'Sedang' : 'Kritis'})
                </span>
              ` : ''}
            </div>

            <!-- Teks Pertanyaan -->
            <p class="text-sm font-bold text-slate-800 leading-snug">
              ${escapeHtml(item.questionText)}
            </p>

            <!-- Opsi Jawaban Pilihan Pengguna -->
            <div class="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span class="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                ${escapeHtml(item.selectedOption || 'A')}
              </span>
              <span class="text-xs font-medium text-blue-900 leading-relaxed">
                ${escapeHtml(item.optionText)}
              </span>
            </div>
          `;

          els.resultAnswersBreakdown.appendChild(card);
        });
      }
    }

    // Scroll to top of result page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Utility: HTML Escaper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bind Event Listeners
  function bindEvents() {
    if (els.btnCatalogToggle) {
      els.btnCatalogToggle.addEventListener('click', () => {
        const newUrl = window.location.pathname;
        window.history.pushState({}, '', newUrl);
        loadCatalog();
      });
    }

    if (els.btnNextQuestion) {
      els.btnNextQuestion.addEventListener('click', handleNext);
    }

    if (els.btnPrevQuestion) {
      els.btnPrevQuestion.addEventListener('click', handlePrev);
    }

    if (els.btnSubmitQuiz) {
      els.btnSubmitQuiz.addEventListener('click', finishQuiz);
    }

    if (els.btnRetakeQuiz) {
      els.btnRetakeQuiz.addEventListener('click', () => {
        if (state.currentQuiz) {
          state.currentIndex = 0;
          state.userAnswers = {};
          userSelections = [];
          initPlayer();
          showView('player');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (els.btnBackToCatalog) {
      els.btnBackToCatalog.addEventListener('click', () => {
        const newUrl = window.location.pathname;
        window.history.pushState({}, '', newUrl);
        loadCatalog();
      });
    }

    if (els.btnCopyResultLink) {
      els.btnCopyResultLink.addEventListener('click', () => {
        const title = state.finalResult?.result?.title || 'Hasil Kuis CTW';
        const score = state.finalResult?.total_score || 0;
        const answeredCount = userSelections.length;
        const textToCopy = `Hasil Diagnosis Kuis CTW (Correct Answer):\n🎯 ${title}\n📊 Total Skor: ${score} Poin (${answeredCount} Pertanyaan Selesai)\n\nCoba kuisnya sekarang di: ${window.location.href}`;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
          if (els.copyResultText) {
            const oldText = els.copyResultText.textContent;
            els.copyResultText.textContent = 'Ringkasan Berhasil Disalin!';
            setTimeout(() => {
              els.copyResultText.textContent = oldText;
            }, 2500);
          }
        }).catch(() => {
          alert('Berhasil disalin ke clipboard:\n' + textToCopy);
        });
      });
    }
  }

  // App Initialization
  function init() {
    bindEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (quizId) {
      loadQuiz(parseInt(quizId, 10));
    } else {
      loadCatalog();
    }
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
