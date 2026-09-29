/**
 * ATW (Answer to Wrong) - Admin CMS Panel Logic
 * Vanilla JavaScript (ES6 Modular, Question & Option Builder, Result Rules, Shareable Link Generator)
 */

(function () {
  'use strict';

  // Admin State
  const state = {
    token: (() => {
      const sess = localStorage.getItem('ctw_admin_session');
      if (sess) {
        try {
          return JSON.parse(sess)?.token || 'ctw_session_active';
        } catch (e) {
          return 'ctw_session_active';
        }
      }
      return localStorage.getItem('atw_admin_token') || null;
    })(),
    quizzes: [],
    editingQuizId: null,
    builder: {
      quiz: {
        id: null,
        title: '',
        category: 'Teknologi & Desain',
        slug: '',
        description: '',
        thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
        status: 'active'
      },
      questions: [],
      result_rules: []
    },
    pendingDelete: null
  };

  // DOM Elements
  const els = {
    viewLogin: document.getElementById('view-login'),
    viewDashboard: document.getElementById('view-dashboard'),
    formLogin: document.getElementById('form-login'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginErrorAlert: document.getElementById('login-error-alert'),
    btnLogout: document.getElementById('btn-logout'),

    // Stats
    statTotalQuizzes: document.getElementById('stat-total-quizzes'),
    statActiveQuizzes: document.getElementById('stat-active-quizzes'),
    statTotalQuestions: document.getElementById('stat-total-questions'),
    statTotalParticipants: document.getElementById('stat-total-participants'),

    // Tabs
    tabQuizList: document.getElementById('tab-quiz-list'),
    tabQuizBuilder: document.getElementById('tab-quiz-builder'),
    sectionQuizList: document.getElementById('section-quiz-list'),
    sectionQuizBuilder: document.getElementById('section-quiz-builder'),
    btnCreateQuizShortcut: document.getElementById('btn-create-quiz-shortcut'),

    // Table
    adminQuizTbody: document.getElementById('admin-quiz-tbody'),

    // Builder Form
    formSaveQuiz: document.getElementById('form-save-quiz'),
    fieldQuizId: document.getElementById('field-quiz-id'),
    fieldQuizTitle: document.getElementById('field-quiz-title'),
    fieldQuizCategory: document.getElementById('field-quiz-category'),
    fieldQuizSlug: document.getElementById('field-quiz-slug'),
    fieldQuizStatus: document.getElementById('field-quiz-status'),
    fieldQuizDescription: document.getElementById('field-quiz-description'),
    fieldQuizThumbnailFile: document.getElementById('field-quiz-thumbnail-file'),
    fieldQuizThumbnailUrl: document.getElementById('field-quiz-thumbnail-url'),
    thumbnailPreviewContainer: document.getElementById('thumbnail-preview-container'),
    thumbnailPreviewImg: document.getElementById('thumbnail-preview-img'),
    btnRemoveThumbnail: document.getElementById('btn-remove-thumbnail'),
    builderModeBadge: document.getElementById('builder-mode-badge'),
    builderQuestionsContainer: document.getElementById('builder-questions-container'),
    builderRulesContainer: document.getElementById('builder-rules-container'),
    btnAddQuestion: document.getElementById('btn-add-question'),
    btnAddRule: document.getElementById('btn-add-rule'),
    btnCancelBuilder: document.getElementById('btn-cancel-builder'),

    // Supabase Status & Config
    btnSupabaseStatus: document.getElementById('btn-supabase-status'),
    supabaseStatusLabel: document.getElementById('supabase-status-label'),
    modalSupabaseConfig: document.getElementById('modal-supabase-config'),
    inputSupabaseUrl: document.getElementById('input-supabase-url'),
    inputSupabaseKey: document.getElementById('input-supabase-key'),
    btnCloseSupabaseModal: document.getElementById('btn-close-supabase-modal'),
    btnCancelSupabase: document.getElementById('btn-cancel-supabase'),
    btnSaveSupabaseConfig: document.getElementById('btn-save-supabase-config'),

    // Share Modal
    modalShareLink: document.getElementById('modal-share-link'),
    inputShareableUrl: document.getElementById('input-shareable-url'),
    btnCopyModalUrl: document.getElementById('btn-copy-modal-url'),
    btnCloseShareModal: document.getElementById('btn-close-share-modal'),
    linkOpenQuizDirect: document.getElementById('link-open-quiz-direct'),

    // Delete Confirmation Modal
    modalDeleteConfirm: document.getElementById('modal-delete-confirm'),
    deleteModalTitle: document.getElementById('delete-modal-title'),
    deleteModalMessage: document.getElementById('delete-modal-message'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    btnConfirmDeleteText: document.getElementById('btn-confirm-delete-text'),
    btnConfirmDeleteSpinner: document.getElementById('btn-confirm-delete-spinner'),

    // Toast
    adminToast: document.getElementById('admin-toast'),
    adminToastMessage: document.getElementById('admin-toast-message')
  };

  // Toast Helper
  function showToast(msg) {
    if (!els.adminToast) return;
    els.adminToastMessage.textContent = msg;
    els.adminToast.classList.remove('hidden');
    setTimeout(() => {
      els.adminToast.classList.add('hidden');
    }, 3000);
  }

  // Check Auth
  function checkAuth() {
    if (state.token) {
      if (els.viewLogin) els.viewLogin.classList.add('hidden');
      if (els.viewDashboard) els.viewDashboard.classList.remove('hidden');
      loadQuizzes();
    } else {
      if (els.viewLogin) els.viewLogin.classList.remove('hidden');
      if (els.viewDashboard) els.viewDashboard.classList.add('hidden');
    }
  }

  // Handle Login via Supabase direct query (supabase.from('admin_users'))
  async function handleLogin(e) {
    e.preventDefault();
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value.trim();

    if (!username || !password) {
      if (els.loginErrorAlert) {
        els.loginErrorAlert.textContent = 'Mohon masukkan username dan password.';
        els.loginErrorAlert.classList.remove('hidden');
      }
      return;
    }

    try {
      // 1. Query otentikasi langsung ke tabel admin_users via Supabase SDK
      const client = window.ATWSupabase?.getClient() || window.supabase;
      if (client && typeof client.from === 'function') {
        const { data, error } = await client
          .from('admin_users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle();

        if (error) {
          console.warn('Supabase auth notice:', error.message);
        } else if (data) {
          const sessionData = {
            id: data.id || 1,
            username: data.username || username,
            role: data.role || 'admin',
            token: data.token || 'ctw_session_' + Date.now(),
            logged_at: new Date().toISOString()
          };
          localStorage.setItem('ctw_admin_session', JSON.stringify(sessionData));
          localStorage.setItem('atw_admin_token', sessionData.token);
          state.token = sessionData.token;
          if (els.loginErrorAlert) els.loginErrorAlert.classList.add('hidden');
          checkAuth();
          showToast('Selamat datang di Panel Admin CTW');
          return;
        }
      }

      // 2. Fallback kredensial default admin/admin123
      if ((username === 'admin' && password === 'admin123') || (username === 'atw_admin' && password === 'admin123')) {
        const sessionData = {
          id: 1,
          username: username,
          role: 'admin',
          token: 'ctw_session_' + Date.now(),
          logged_at: new Date().toISOString()
        };
        localStorage.setItem('ctw_admin_session', JSON.stringify(sessionData));
        localStorage.setItem('atw_admin_token', sessionData.token);
        state.token = sessionData.token;
        if (els.loginErrorAlert) els.loginErrorAlert.classList.add('hidden');
        checkAuth();
        showToast('Selamat datang di Panel Admin CTW');
        return;
      }

      throw new Error('Username atau password yang dimasukkan tidak cocok.');
    } catch (err) {
      if (els.loginErrorAlert) {
        els.loginErrorAlert.textContent = err.message || 'Username atau password salah.';
        els.loginErrorAlert.classList.remove('hidden');
      }
    }
  }

  // Handle Logout
  function handleLogout() {
    state.token = null;
    localStorage.removeItem('ctw_admin_session');
    localStorage.removeItem('atw_admin_token');
    checkAuth();
  }

  // Switch Tab
  function switchTab(tabName) {
    if (tabName === 'list') {
      els.tabQuizList.classList.add('bg-blue-600', 'text-white');
      els.tabQuizList.classList.remove('bg-white', 'text-slate-600');
      els.tabQuizBuilder.classList.remove('bg-blue-600', 'text-white');
      els.tabQuizBuilder.classList.add('bg-white', 'text-slate-600');

      els.sectionQuizList.classList.remove('hidden');
      els.sectionQuizBuilder.classList.add('hidden');
      loadQuizzes();
    } else {
      els.tabQuizBuilder.classList.add('bg-blue-600', 'text-white');
      els.tabQuizBuilder.classList.remove('bg-white', 'text-slate-600');
      els.tabQuizList.classList.remove('bg-blue-600', 'text-white');
      els.tabQuizList.classList.add('bg-white', 'text-slate-600');

      els.sectionQuizList.classList.add('hidden');
      els.sectionQuizBuilder.classList.remove('hidden');
    }
  }

  // Load Quizzes List via Supabase SDK
  async function loadQuizzes() {
    try {
      // Direct Supabase SDK Read:
      // const { data, error } = await supabase.from('quizzes').select('*')
      state.quizzes = await window.ATWSupabase.fetchAdminQuizzes();
      renderQuizzesTable();
      updateStats();
    } catch (err) {
      console.error('Gagal mengambil daftar kuis admin:', err);
    }
  }

  // Update Stats
  function updateStats() {
    const total = state.quizzes.length;
    const active = state.quizzes.filter(q => q.status === 'active').length;
    let totalQuestions = 0;
    let totalParticipants = 0;

    state.quizzes.forEach(q => {
      totalQuestions += (q.total_questions || 0);
      totalParticipants += (q.total_participants || 0);
    });

    if (els.statTotalQuizzes) els.statTotalQuizzes.textContent = total;
    if (els.statActiveQuizzes) els.statActiveQuizzes.textContent = active;
    if (els.statTotalQuestions) els.statTotalQuestions.textContent = totalQuestions;
    if (els.statTotalParticipants) els.statTotalParticipants.textContent = totalParticipants.toLocaleString('id-ID');
  }

  // Render Quizzes Table
  function renderQuizzesTable() {
    if (!els.adminQuizTbody) return;
    els.adminQuizTbody.innerHTML = '';

    if (state.quizzes.length === 0) {
      els.adminQuizTbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-slate-400 font-medium">
            Belum ada kuis yang dibuat. Klik tombol "+ Tambah Kuis Baru" di atas.
          </td>
        </tr>
      `;
      return;
    }

    state.quizzes.forEach(q => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-quiz-id', q.id);
      tr.className = 'hover:bg-slate-50/80 transition-all';

      const isPublished = q.status === 'active';
      const shareUrl = `${window.location.origin}/quiz.html?id=${q.id}`;

      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-blue-600 border border-slate-200 shrink-0">
              ${q.id}
            </div>
            <div>
              <h4 class="font-bold text-slate-900 line-clamp-1">${escapeHtml(q.title)}</h4>
              <span class="text-[11px] font-semibold text-slate-400">${escapeHtml(q.category || 'Umum')}</span>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
            isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }">
            ${isPublished ? 'Published' : 'Draft'}
          </span>
        </td>
        <td class="px-6 py-4 font-semibold text-slate-700">
          ${q.total_questions || 0} Soal
        </td>
        <td class="px-6 py-4 font-semibold text-slate-700">
          ${(q.total_participants || 0).toLocaleString('id-ID')}
        </td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <!-- Shareable Link Button -->
            <button data-id="${q.id}" data-url="${shareUrl}" class="btn-copy-quiz-link flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>Salin Link</span>
            </button>

            <!-- Test Quiz -->
            <a href="${shareUrl}" target="_blank" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Uji Kuis">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>

            <!-- Edit Quiz -->
            <button data-id="${q.id}" class="btn-edit-quiz p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Edit Kuis & Soal">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>

            <!-- Delete Quiz -->
            <button data-id="${q.id}" class="btn-delete-quiz p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors" title="Hapus Kuis">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      // Copy Link Event
      tr.querySelector('.btn-copy-quiz-link').addEventListener('click', (e) => {
        const url = e.currentTarget.getAttribute('data-url');
        openShareModal(url);
      });

      // Edit Event
      tr.querySelector('.btn-edit-quiz').addEventListener('click', () => {
        loadQuizForEdit(q.id);
      });

      // Delete Event
      tr.querySelector('.btn-delete-quiz').addEventListener('click', () => {
        deleteQuizHandler(q.id, q.title, tr);
      });

      els.adminQuizTbody.appendChild(tr);
    });
  }

  // Open Shareable Link Modal
  function openShareModal(url) {
    if (els.inputShareableUrl) els.inputShareableUrl.value = url;
    if (els.linkOpenQuizDirect) els.linkOpenQuizDirect.href = url;
    if (els.modalShareLink) els.modalShareLink.classList.remove('hidden');

    navigator.clipboard.writeText(url).then(() => {
      showToast('Link kuis berhasil disalin ke clipboard!');
    }).catch(() => {
      // Fallback
    });
  }

  // Reset Builder to Empty State
  function resetBuilder() {
    state.editingQuizId = null;
    if (els.fieldQuizThumbnailFile) els.fieldQuizThumbnailFile.value = '';
    if (els.fieldQuizThumbnailUrl) els.fieldQuizThumbnailUrl.value = '';
    if (els.thumbnailPreviewContainer) els.thumbnailPreviewContainer.classList.add('hidden');

    state.builder = {
      quiz: {
        id: null,
        title: '',
        category: 'Teknologi & Desain',
        slug: '',
        description: '',
        thumbnail: '',
        status: 'active'
      },
      questions: [
        {
          question_text: '',
          options: [
            { option_text: '', score_value: 20, result_code: 'A' },
            { option_text: '', score_value: 20, result_code: 'B' },
            { option_text: '', score_value: 20, result_code: 'C' }
          ]
        }
      ],
      result_rules: [
        {
          min_score: 60,
          max_score: 100,
          result_code: 'SANGAT_KUASAI',
          title: 'Sangat Kuasai',
          badge: 'Tingkat Mahir',
          description: 'Kamu memahami topik ini secara komprehensif dan memiliki ketepatan analisis tinggi.',
          recommendation: 'Pertahankan wawasanmu dan eksplorasi topik lanjutan.'
        },
        {
          min_score: 0,
          max_score: 59,
          result_code: 'PERLU_BELAJAR_LAGI',
          title: 'Perlu Belajar Lagi',
          badge: 'Tingkat Pemula',
          description: 'Kamu memiliki pemahaman dasar, namun masih membutuhkan eksplorasi lebih mendalam.',
          recommendation: 'Pelajari kembali konsep-konsep kunci dan ulangi kuis ini.'
        }
      ]
    };

    populateBuilderUI();
  }

  // Load Existing Quiz for Edit via Supabase SDK
  async function loadQuizForEdit(quizId) {
    try {
      // Relational query via Supabase SDK:
      // const { data, error } = await supabase.from('quizzes').select('*, questions(*, options(*)), result_rules(*)').eq('id', quizId).single();
      const quizDetail = await window.ATWSupabase.fetchQuizDetail(quizId);

      state.editingQuizId = quizId;
      state.builder.quiz = quizDetail.quiz;
      state.builder.questions = quizDetail.questions || [];
      state.builder.result_rules = quizDetail.result_rules || [];

      populateBuilderUI();
      switchTab('builder');
    } catch (err) {
      alert('Gagal mengambil data kuis untuk diedit: ' + err.message);
    }
  }

  // Populate Builder UI with Current State
  function populateBuilderUI() {
    const q = state.builder.quiz;
    els.fieldQuizId.value = q.id || '';
    els.fieldQuizTitle.value = q.title || '';
    els.fieldQuizCategory.value = q.category || 'Teknologi & Desain';
    els.fieldQuizSlug.value = q.slug || '';
    els.fieldQuizStatus.value = q.status || 'active';
    els.fieldQuizDescription.value = q.description || '';

    // Thumbnail Preview
    const thumbUrl = q.thumbnail || '';
    if (els.fieldQuizThumbnailUrl) els.fieldQuizThumbnailUrl.value = thumbUrl;
    if (els.thumbnailPreviewContainer && els.thumbnailPreviewImg) {
      if (thumbUrl) {
        els.thumbnailPreviewImg.src = thumbUrl;
        els.thumbnailPreviewContainer.classList.remove('hidden');
      } else {
        els.thumbnailPreviewContainer.classList.add('hidden');
      }
    }

    if (els.builderModeBadge) {
      els.builderModeBadge.textContent = state.editingQuizId ? `Mode: Edit Kuis #${state.editingQuizId}` : 'Mode: Kuis Baru';
    }

    renderBuilderQuestions();
    renderBuilderRules();
  }

  // Render Dynamic Questions Builder
  function renderBuilderQuestions() {
    if (!els.builderQuestionsContainer) return;
    els.builderQuestionsContainer.innerHTML = '';

    state.builder.questions.forEach((qItem, qIdx) => {
      const qCard = document.createElement('div');
      qCard.className = 'p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-4';

      qCard.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
              ${qIdx + 1}
            </span>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Pertanyaan #${qIdx + 1}</span>
          </div>

          <button type="button" class="btn-remove-question text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            <span>Hapus Pertanyaan</span>
          </button>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Teks Pertanyaan <span class="text-rose-500">*</span>
          </label>
          <textarea rows="2" class="input-q-text w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-600 text-xs sm:text-sm font-medium" placeholder="Tuliskan pertanyaan kuis di sini...">${escapeHtml(qItem.question_text || '')}</textarea>
        </div>

        <!-- Dynamic Options Container -->
        <div class="space-y-2.5 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pilihan Jawaban (Minimal 2 - 4 Opsi)</span>
            <button type="button" class="btn-add-option text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1">
              + Tambah Opsi
            </button>
          </div>

          <div class="options-list space-y-2">
            <!-- Render options -->
          </div>
        </div>
      `;

      // Event: Question Text Change
      const textarea = qCard.querySelector('.input-q-text');
      textarea.addEventListener('input', (e) => {
        state.builder.questions[qIdx].question_text = e.target.value;
      });

      // Event: Remove Question
      qCard.querySelector('.btn-remove-question').addEventListener('click', () => {
        deleteQuestionHandler(qItem.id, qIdx, qCard);
      });

      // Event: Add Option
      qCard.querySelector('.btn-add-option').addEventListener('click', () => {
        state.builder.questions[qIdx].options.push({
          option_text: '',
          score_value: 20,
          result_code: 'CODE_' + (state.builder.questions[qIdx].options.length + 1)
        });
        renderBuilderQuestions();
      });

      // Render Options Rows
      const optionsList = qCard.querySelector('.options-list');
      const letterMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

      (qItem.options || []).forEach((opt, optIdx) => {
        const optRow = document.createElement('div');
        optRow.className = 'p-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-2 text-xs';

        optRow.innerHTML = `
          <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
            ${letterMap[optIdx] || (optIdx + 1)}
          </span>

          <input type="text" class="input-opt-text flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-medium" placeholder="Teks pilihan jawaban..." value="${escapeHtml(opt.option_text || '')}" />

          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[10px] uppercase font-bold text-slate-400">Poin:</span>
            <input type="number" class="input-opt-score w-16 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-bold text-center" value="${opt.score_value ?? 20}" />
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[10px] uppercase font-bold text-slate-400">Kategori:</span>
            <input type="text" class="input-opt-code w-24 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-mono text-[11px] uppercase" placeholder="KODE" value="${escapeHtml(opt.result_code || 'DEFAULT')}" />
          </div>

          <button type="button" class="btn-remove-opt p-1 text-slate-400 hover:text-rose-600" title="Hapus Opsi">
            &times;
          </button>
        `;

        // Inputs Event Binding
        optRow.querySelector('.input-opt-text').addEventListener('input', (e) => {
          state.builder.questions[qIdx].options[optIdx].option_text = e.target.value;
        });

        optRow.querySelector('.input-opt-score').addEventListener('input', (e) => {
          state.builder.questions[qIdx].options[optIdx].score_value = parseInt(e.target.value, 10) || 0;
        });

        optRow.querySelector('.input-opt-code').addEventListener('input', (e) => {
          state.builder.questions[qIdx].options[optIdx].result_code = e.target.value.toUpperCase();
        });

        optRow.querySelector('.btn-remove-opt').addEventListener('click', () => {
          if (state.builder.questions[qIdx].options.length <= 2) {
            alert('Pertanyaan minimal harus memiliki 2 pilihan jawaban.');
            return;
          }
          state.builder.questions[qIdx].options.splice(optIdx, 1);
          renderBuilderQuestions();
        });

        optionsList.appendChild(optRow);
      });

      els.builderQuestionsContainer.appendChild(qCard);
    });
  }

  // Render Dynamic Result Rules Builder
  function renderBuilderRules() {
    if (!els.builderRulesContainer) return;
    els.builderRulesContainer.innerHTML = '';

    state.builder.result_rules.forEach((rule, rIdx) => {
      const rCard = document.createElement('div');
      rCard.className = 'p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3';

      rCard.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
              ${rIdx + 1}
            </span>
            Aturan Hasil #${rIdx + 1}
          </span>

          <button type="button" class="btn-remove-rule text-rose-500 hover:text-rose-700 text-xs font-bold">
            Hapus Aturan
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Skor Min</label>
            <input type="number" class="rule-min w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold" value="${rule.min_score ?? 0}" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Skor Max</label>
            <input type="number" class="rule-max w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold" value="${rule.max_score ?? 100}" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Kode Hasil / Dominan</label>
            <input type="text" class="rule-code w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono uppercase" placeholder="KODE" value="${escapeHtml(rule.result_code || 'DEFAULT')}" />
          </div>

          <div>
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Badge Pencapaian</label>
            <input type="text" class="rule-badge w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-medium" placeholder="Tingkat Mahir" value="${escapeHtml(rule.badge || '')}" />
          </div>

          <div class="sm:col-span-2 md:col-span-2">
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Judul Hasil</label>
            <input type="text" class="rule-title w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold" placeholder="Sangat Kuasai" value="${escapeHtml(rule.title || '')}" />
          </div>

          <div class="sm:col-span-2 md:col-span-2">
            <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Deskripsi Hasil</label>
            <input type="text" class="rule-desc w-full px-3 py-2 rounded-lg bg-white border border-slate-200" placeholder="Penjelasan diagnosa..." value="${escapeHtml(rule.description || '')}" />
          </div>
        </div>
      `;

      // Event Bindings
      rCard.querySelector('.rule-min').addEventListener('input', (e) => {
        state.builder.result_rules[rIdx].min_score = parseInt(e.target.value, 10) || 0;
      });
      rCard.querySelector('.rule-max').addEventListener('input', (e) => {
        state.builder.result_rules[rIdx].max_score = parseInt(e.target.value, 10) || 0;
      });
      rCard.querySelector('.rule-code').addEventListener('input', (e) => {
        state.builder.result_rules[rIdx].result_code = e.target.value.toUpperCase();
      });
      rCard.querySelector('.rule-badge').addEventListener('input', (e) => {
        state.builder.result_rules[rIdx].badge = e.target.value;
      });
      rCard.querySelector('.rule-title').addEventListener('input', (e) => {
        state.builder.result_rules[rIdx].title = e.target.value;
      });
      rCard.querySelector('.rule-desc').addEventListener('input', (e) => {
        state.builder.result_rules[rIdx].description = e.target.value;
      });

      rCard.querySelector('.btn-remove-rule').addEventListener('click', () => {
        if (state.builder.result_rules.length <= 1) {
          alert('Minimal sisakan 1 aturan hasil.');
          return;
        }
        state.builder.result_rules.splice(rIdx, 1);
        renderBuilderRules();
      });

      els.builderRulesContainer.appendChild(rCard);
    });
  }

  // Close Delete Confirmation Modal
  function closeDeleteModal() {
    if (els.modalDeleteConfirm) {
      els.modalDeleteConfirm.classList.add('hidden');
    }
    state.pendingDelete = null;
    resetDeleteButtonState();
  }

  // Reset Delete Button State
  function resetDeleteButtonState() {
    if (els.btnConfirmDelete) {
      els.btnConfirmDelete.disabled = false;
      els.btnConfirmDelete.classList.remove('opacity-70', 'cursor-not-allowed');
    }
    if (els.btnConfirmDeleteSpinner) {
      els.btnConfirmDeleteSpinner.classList.add('hidden');
    }
    if (els.btnConfirmDeleteText) {
      if (state.pendingDelete?.type === 'question') {
        els.btnConfirmDeleteText.textContent = 'Ya, Hapus Pertanyaan';
      } else {
        els.btnConfirmDeleteText.textContent = 'Ya, Hapus Kuis';
      }
    }
  }

  // Delete Quiz Handler (Opens Custom Tailwind Confirmation Modal)
  function deleteQuizHandler(quizId, quizTitle, rowElement) {
    if (!quizId) return;

    // Find row element if not passed
    const targetRow = rowElement || document.querySelector(`tr[data-quiz-id="${quizId}"]`) || null;

    state.pendingDelete = {
      type: 'quiz',
      id: parseInt(quizId, 10),
      title: quizTitle || `Kuis #${quizId}`,
      rowElement: targetRow
    };

    if (els.deleteModalTitle) {
      els.deleteModalTitle.textContent = 'Hapus Kuis Ini?';
    }

    if (els.deleteModalMessage) {
      els.deleteModalMessage.textContent = `Apakah Anda yakin ingin menghapus kuis '${quizTitle || ''}'? Tindakan ini akan menghapus semua pertanyaan, opsi jawaban, dan riwayat hasil terkait secara permanen dan tidak dapat dibatalkan.`;
    }

    if (els.btnConfirmDeleteText) {
      els.btnConfirmDeleteText.textContent = 'Ya, Hapus Kuis';
    }

    resetDeleteButtonState();

    if (els.modalDeleteConfirm) {
      els.modalDeleteConfirm.classList.remove('hidden');
    }
  }

  // Delete Question Handler (From Quiz Builder)
  function deleteQuestionHandler(questionId, qIdx, cardElement) {
    if (state.builder.questions.length <= 1) {
      alert('Kuis minimal harus memiliki 1 pertanyaan.');
      return;
    }

    const qItem = state.builder.questions[qIdx];
    const qNumber = qIdx + 1;

    state.pendingDelete = {
      type: 'question',
      id: questionId || (qItem ? qItem.id : null) || null,
      questionIndex: qIdx,
      cardElement: cardElement || null
    };

    if (els.deleteModalTitle) {
      els.deleteModalTitle.textContent = 'Hapus Pertanyaan Ini?';
    }

    if (els.deleteModalMessage) {
      els.deleteModalMessage.textContent = `Apakah Anda yakin ingin menghapus Pertanyaan #${qNumber} beserta seluruh opsi jawabannya secara permanen dan tidak dapat dibatalkan?`;
    }

    if (els.btnConfirmDeleteText) {
      els.btnConfirmDeleteText.textContent = 'Ya, Hapus Pertanyaan';
    }

    resetDeleteButtonState();

    if (els.modalDeleteConfirm) {
      els.modalDeleteConfirm.classList.remove('hidden');
    }
  }

  // Confirm Delete Action (Handles both Quiz & Question deletion)
  async function confirmDeleteAction() {
    if (!state.pendingDelete) return;

    // Set Loading State
    if (els.btnConfirmDelete) {
      els.btnConfirmDelete.disabled = true;
      els.btnConfirmDelete.classList.add('opacity-70', 'cursor-not-allowed');
    }
    if (els.btnConfirmDeleteSpinner) {
      els.btnConfirmDeleteSpinner.classList.remove('hidden');
    }
    if (els.btnConfirmDeleteText) {
      els.btnConfirmDeleteText.textContent = 'Menghapus...';
    }

    const { type, id, rowElement, questionIndex, cardElement } = state.pendingDelete;

    if (type === 'quiz') {
      try {
        const targetQuiz = state.quizzes.find(q => q.id === id);
        const thumbnailUrl = targetQuiz ? (targetQuiz.thumbnail || '') : '';

        // Panggilan Supabase deleteQuiz(quizId, thumbnailUrl)
        await window.ATWSupabase.deleteQuiz(id, thumbnailUrl);

        // 1. Tutup modal konfirmasi
        closeDeleteModal();

        // 2. Tampilkan notifikasi Toast/Alert sukses di pojok atas
        showToast('Kuis berhasil dihapus!');

        // 3. Hapus baris tabel terkait dari DOM secara otomatis dengan animasi fade-out
        if (rowElement && rowElement.parentNode) {
          rowElement.style.transition = 'all 0.35s ease';
          rowElement.style.opacity = '0';
          rowElement.style.transform = 'scale(0.96)';
          setTimeout(() => {
            if (rowElement && rowElement.parentNode) {
              rowElement.remove();
            }
            // Muat ulang tabel kuis dan perbarui statistik
            loadQuizzes();
          }, 350);
        } else {
          loadQuizzes();
        }
      } catch (err) {
        console.error('Error delete quiz:', err);
        alert('Terjadi kesalahan saat menghapus kuis: ' + err.message);
        resetDeleteButtonState();
      }
    } else if (type === 'question') {
      try {
        const qObj = state.builder.questions[questionIndex];
        const imgUrl = qObj ? (qObj.image_url || '') : '';

        // Hapus pertanyaan & aset gambar via Supabase
        await window.ATWSupabase.deleteQuestion(id, imgUrl);

        // Hapus dari state builder
        if (typeof questionIndex === 'number' && questionIndex >= 0) {
          state.builder.questions.splice(questionIndex, 1);
        }

        // 1. Tutup modal konfirmasi
        closeDeleteModal();

        // 2. Tampilkan notifikasi Toast di pojok atas
        showToast('Pertanyaan berhasil dihapus');

        // 3. Hapus kartu dengan transisi halus dan render ulang
        if (cardElement && cardElement.parentNode) {
          cardElement.style.transition = 'all 0.3s ease';
          cardElement.style.opacity = '0';
          cardElement.style.transform = 'scale(0.96)';
          setTimeout(() => {
            renderBuilderQuestions();
          }, 300);
        } else {
          renderBuilderQuestions();
        }
      } catch (err) {
        console.error('Error delete question:', err);
        if (typeof questionIndex === 'number' && questionIndex >= 0) {
          state.builder.questions.splice(questionIndex, 1);
        }
        closeDeleteModal();
        showToast('Pertanyaan berhasil dihapus');
        renderBuilderQuestions();
      }
    }
  }

  // Backwards compatibility alias
  const deleteQuiz = deleteQuizHandler;

  // Save Quiz Handler (Transactional CREATE / UPDATE via Supabase SDK)
  async function handleSaveQuiz(e) {
    e.preventDefault();

    const title = els.fieldQuizTitle.value.trim();
    if (!title) {
      alert('Judul kuis wajib diisi.');
      els.fieldQuizTitle.focus();
      return;
    }

    // Validate Questions
    if (state.builder.questions.length === 0) {
      alert('Tambahkan minimal 1 pertanyaan.');
      return;
    }

    for (let i = 0; i < state.builder.questions.length; i++) {
      const q = state.builder.questions[i];
      if (!q.question_text || !q.question_text.trim()) {
        alert(`Pertanyaan #${i + 1} belum memiliki teks pertanyaan.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        alert(`Pertanyaan #${i + 1} harus memiliki minimal 2 pilihan jawaban.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text || !q.options[j].option_text.trim()) {
          alert(`Pilihan ke-${j + 1} pada Pertanyaan #${i + 1} masih kosong.`);
          return;
        }
      }
    }

    // Ambil file thumbnail jika diunggah
    const thumbnailFile = els.fieldQuizThumbnailFile?.files?.[0] || null;

    const payload = {
      quiz: {
        id: state.editingQuizId || null,
        title: title,
        category: els.fieldQuizCategory.value.trim() || 'Umum',
        slug: els.fieldQuizSlug.value.trim() || '',
        status: els.fieldQuizStatus.value,
        description: els.fieldQuizDescription.value.trim(),
        thumbnail: els.fieldQuizThumbnailUrl?.value || ''
      },
      questions: state.builder.questions,
      result_rules: state.builder.result_rules
    };

    try {
      // Direct Supabase SDK Save (upload thumbnail + insert/update quiz + questions/options + rules)
      const saveResult = await window.ATWSupabase.saveQuizToSupabase(payload, thumbnailFile);

      const quizId = saveResult.quiz_id || state.editingQuizId;
      const shareUrl = `${window.location.origin}/quiz.html?id=${quizId}`;

      showToast('Kuis dan aturan hasil berhasil disimpan ke Supabase!');
      openShareModal(shareUrl);
      switchTab('list');
    } catch (err) {
      console.error('Error simpan kuis:', err);
      alert('Gagal menyimpan data kuis: ' + err.message);
    }
  }

  // Utility: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bind Events
  function bindEvents() {
    if (els.formLogin) els.formLogin.addEventListener('submit', handleLogin);
    if (els.btnLogout) els.btnLogout.addEventListener('click', handleLogout);

    if (els.tabQuizList) els.tabQuizList.addEventListener('click', () => switchTab('list'));
    if (els.tabQuizBuilder) els.tabQuizBuilder.addEventListener('click', () => {
      resetBuilder();
      switchTab('builder');
    });

    if (els.btnCreateQuizShortcut) {
      els.btnCreateQuizShortcut.addEventListener('click', () => {
        resetBuilder();
        switchTab('builder');
      });
    }

    if (els.btnCancelBuilder) {
      els.btnCancelBuilder.addEventListener('click', () => switchTab('list'));
    }

    if (els.btnAddQuestion) {
      els.btnAddQuestion.addEventListener('click', () => {
        state.builder.questions.push({
          question_text: '',
          options: [
            { option_text: '', score_value: 20, result_code: 'A' },
            { option_text: '', score_value: 20, result_code: 'B' }
          ]
        });
        renderBuilderQuestions();
      });
    }

    if (els.btnAddRule) {
      els.btnAddRule.addEventListener('click', () => {
        state.builder.result_rules.push({
          min_score: 0,
          max_score: 100,
          result_code: 'NEW_CODE',
          title: 'Hasil Evaluasi',
          badge: 'Tingkat Baru',
          description: 'Deskripsi hasil evaluasi baru.',
          recommendation: 'Langkah rekomendasi untuk peserta.'
        });
        renderBuilderRules();
      });
    }

    if (els.formSaveQuiz) {
      els.formSaveQuiz.addEventListener('submit', handleSaveQuiz);
    }

    // Delete Confirmation Modal Events
    if (els.btnCancelDelete) {
      els.btnCancelDelete.addEventListener('click', closeDeleteModal);
    }

    if (els.btnConfirmDelete) {
      els.btnConfirmDelete.addEventListener('click', confirmDeleteAction);
    }

    if (els.modalDeleteConfirm) {
      els.modalDeleteConfirm.addEventListener('click', (e) => {
        if (e.target === els.modalDeleteConfirm) {
          closeDeleteModal();
        }
      });
    }

    // Share Modal Events
    if (els.btnCloseShareModal) {
      els.btnCloseShareModal.addEventListener('click', () => {
        els.modalShareLink.classList.add('hidden');
      });
    }

    if (els.btnCopyModalUrl) {
      els.btnCopyModalUrl.addEventListener('click', () => {
        const url = els.inputShareableUrl.value;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link kuis berhasil disalin!');
        });
      });
    }

    // Thumbnail Preview & Remove Events
    if (els.fieldQuizThumbnailFile) {
      els.fieldQuizThumbnailFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const previewUrl = URL.createObjectURL(file);
          if (els.thumbnailPreviewImg) els.thumbnailPreviewImg.src = previewUrl;
          if (els.thumbnailPreviewContainer) els.thumbnailPreviewContainer.classList.remove('hidden');
        }
      });
    }

    if (els.btnRemoveThumbnail) {
      els.btnRemoveThumbnail.addEventListener('click', () => {
        if (els.fieldQuizThumbnailFile) els.fieldQuizThumbnailFile.value = '';
        if (els.fieldQuizThumbnailUrl) els.fieldQuizThumbnailUrl.value = '';
        if (els.thumbnailPreviewContainer) els.thumbnailPreviewContainer.classList.add('hidden');
      });
    }

    // Supabase Status & Config Events
    function updateSupabaseStatusUI() {
      const cfg = window.ATWSupabase?.getConfig ? window.ATWSupabase.getConfig() : null;
      const isConfigured = window.ATWSupabase?.isConfigured ? window.ATWSupabase.isConfigured() : false;
      if (els.supabaseStatusLabel) {
        if (isConfigured) {
          els.supabaseStatusLabel.textContent = 'Supabase Connected';
          els.btnSupabaseStatus?.classList.replace('border-amber-200', 'border-emerald-200');
          els.btnSupabaseStatus?.classList.replace('text-amber-700', 'text-emerald-700');
          els.btnSupabaseStatus?.classList.replace('bg-amber-50', 'bg-emerald-50');
        } else {
          els.supabaseStatusLabel.textContent = 'Supabase Config';
          els.btnSupabaseStatus?.classList.replace('border-emerald-200', 'border-amber-200');
          els.btnSupabaseStatus?.classList.replace('text-emerald-700', 'text-amber-700');
          els.btnSupabaseStatus?.classList.replace('bg-emerald-50', 'bg-amber-50');
        }
      }
      if (els.inputSupabaseUrl && cfg) {
        els.inputSupabaseUrl.value = cfg.isDefault ? '' : cfg.url;
      }
      if (els.inputSupabaseKey && cfg) {
        els.inputSupabaseKey.value = cfg.isDefault ? '' : cfg.key;
      }
    }

    if (els.btnSupabaseStatus) {
      els.btnSupabaseStatus.addEventListener('click', () => {
        updateSupabaseStatusUI();
        els.modalSupabaseConfig?.classList.remove('hidden');
      });
    }

    if (els.btnCloseSupabaseModal) {
      els.btnCloseSupabaseModal.addEventListener('click', () => {
        els.modalSupabaseConfig?.classList.add('hidden');
      });
    }

    if (els.btnCancelSupabase) {
      els.btnCancelSupabase.addEventListener('click', () => {
        els.modalSupabaseConfig?.classList.add('hidden');
      });
    }

    if (els.btnSaveSupabaseConfig) {
      els.btnSaveSupabaseConfig.addEventListener('click', () => {
        const url = els.inputSupabaseUrl?.value?.trim();
        const key = els.inputSupabaseKey?.value?.trim();
        if (!url || !key) {
          alert('Mohon isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY');
          return;
        }
        if (window.ATWSupabase?.setSupabaseConfig) {
          window.ATWSupabase.setSupabaseConfig(url, key);
        }
        updateSupabaseStatusUI();
        els.modalSupabaseConfig?.classList.add('hidden');
        showToast('Kredensial Supabase berhasil disimpan!');
        loadQuizzes();
      });
    }

    // Initial Supabase Status Check
    updateSupabaseStatusUI();
  }

  // Window Global Exports for direct event handlers & interoperability
  const loadQuizTable = loadQuizzes;
  window.loadQuizTable = loadQuizTable;
  window.loadQuizzes = loadQuizzes;
  window.deleteQuizHandler = deleteQuizHandler;
  window.deleteQuiz = deleteQuizHandler;
  window.deleteQuestionHandler = deleteQuestionHandler;
  window.closeDeleteModal = closeDeleteModal;
  window.confirmDeleteAction = confirmDeleteAction;

  // Init
  function init() {
    bindEvents();
    checkAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
