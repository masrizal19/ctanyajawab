import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Share2,
  ExternalLink,
  Check,
  ShieldCheck,
  LogOut,
  Sliders,
  Sparkles,
  HelpCircle,
  FolderPlus
} from 'lucide-react';
import { Quiz } from '../types';
import { supabase } from '../lib/supabaseClient';
import { AdminLogin } from './AdminLogin';

interface QuestionOptionDraft {
  option_text: string;
  score_value: number;
  result_code: string;
}

interface QuestionDraft {
  id?: number;
  question_text: string;
  options: QuestionOptionDraft[];
}

interface ResultRuleDraft {
  id?: number;
  min_score: number;
  max_score: number;
  result_code: string;
  title: string;
  badge: string;
  description: string;
  recommendation: string;
}

export const AdminCMS: React.FC<{ onOpenPublicQuiz?: (id: number) => void }> = ({
  onOpenPublicQuiz
}) => {
  const [token, setToken] = useState<string | null>(() => {
    const session = localStorage.getItem('ctw_admin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed?.token || 'ctw_session_active';
      } catch {
        return 'ctw_session_active';
      }
    }
    return localStorage.getItem('atw_admin_token') || null;
  });

  // CMS Views: 'list' | 'builder'
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Share Modal
  const [shareModalUrl, setShareModalUrl] = useState<string | null>(null);

  // Builder Form State
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('Teknologi & Desain');
  const [quizSlug, setQuizSlug] = useState('');
  const [quizStatus, setQuizStatus] = useState<'active' | 'draft'>('active');
  const [quizDescription, setQuizDescription] = useState('');

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      question_text: '',
      options: [
        { option_text: '', score_value: 20, result_code: 'A' },
        { option_text: '', score_value: 20, result_code: 'B' },
        { option_text: '', score_value: 20, result_code: 'C' }
      ]
    }
  ]);

  const [resultRules, setResultRules] = useState<ResultRuleDraft[]>([
    {
      min_score: 60,
      max_score: 100,
      result_code: 'SANGAT_KUASAI',
      title: 'Sangat Kuasai',
      badge: 'Tingkat Mahir',
      description: 'Penguasaan konsep secara menyeluruh dengan akurasi pemikiran yang tinggi.',
      recommendation: 'Lanjutkan ke topik lanjutan atau bagikan wawasanmu ke komunitas.'
    },
    {
      min_score: 0,
      max_score: 59,
      result_code: 'PERLU_BELAJAR_LAGI',
      title: 'Perlu Belajar Lagi',
      badge: 'Tingkat Pemula',
      description: 'Pemahaman konsep dasar sudah mulai terbangun namun masih butuh pendalaman.',
      recommendation: 'Pelajari ringkasan materi dan ulangi kuis secara berkala.'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAdminQuizzes = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil data kuis langsung dari Supabase terlebih dahulu (kompatibel static hosting)
      const { data: sbQuizzes, error: sbError } = await supabase
        .from('quizzes')
        .select('*')
        .order('id', { ascending: false });

      if (!sbError && sbQuizzes && sbQuizzes.length > 0) {
        setQuizzes(sbQuizzes as Quiz[]);
        return;
      }

      // 2. Fallback REST API
      let res = await fetch('/api/admin/quizzes');
      if (!res.ok) res = await fetch('/backend/api/admin/quizzes.php');
      const json = await res.json();
      if (json.success && json.data) {
        setQuizzes(json.data.quizzes || []);
      }
    } catch (err) {
      console.warn('Load admin quizzes notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminQuizzes();
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('ctw_admin_session');
    localStorage.removeItem('atw_admin_token');
    showToast('Berhasil keluar dari sesi Administrator.');
  };

  const handleNewQuiz = () => {
    setEditingQuizId(null);
    setQuizTitle('');
    setQuizCategory('Teknologi & Desain');
    setQuizSlug('');
    setQuizStatus('active');
    setQuizDescription('');
    setQuestions([
      {
        question_text: '',
        options: [
          { option_text: '', score_value: 20, result_code: 'A' },
          { option_text: '', score_value: 20, result_code: 'B' },
          { option_text: '', score_value: 20, result_code: 'C' }
        ]
      }
    ]);
    setResultRules([
      {
        min_score: 60,
        max_score: 100,
        result_code: 'SANGAT_KUASAI',
        title: 'Sangat Kuasai',
        badge: 'Tingkat Mahir',
        description: 'Penguasaan komprehensif atas topik terkait.',
        recommendation: 'Tingkatkan portofolio dan asah studi kasus lanjutan.'
      },
      {
        min_score: 0,
        max_score: 59,
        result_code: 'PERLU_BELAJAR_LAGI',
        title: 'Perlu Belajar Lagi',
        badge: 'Tingkat Pemula',
        description: 'Pemahaman dasar perlu diasah kembali.',
        recommendation: 'Ulangi latihan dan perhatikan poin-poin evaluasi.'
      }
    ]);
    setActiveTab('builder');
  };

  const handleEditQuiz = async (quizId: number) => {
    try {
      let res = await fetch(`/api/admin/quiz/${quizId}`);
      if (!res.ok) res = await fetch(`/backend/api/admin/quizzes.php?id=${quizId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const q = json.data.quiz;
        setEditingQuizId(quizId);
        setQuizTitle(q.title || '');
        setQuizCategory(q.category || 'Umum');
        setQuizSlug(q.slug || '');
        setQuizStatus(q.status || 'active');
        setQuizDescription(q.description || '');
        setQuestions(json.data.questions || []);
        setResultRules(json.data.result_rules || []);
        setActiveTab('builder');
      }
    } catch {
      alert('Gagal mengambil data kuis untuk diedit.');
    }
  };

  const handleDeleteQuiz = async (quizId: number, title: string) => {
    if (!confirm(`Hapus kuis "${title}" beserta seluruh soal dan opsinya?`)) return;
    try {
      let res = await fetch(`/api/admin/quiz/${quizId}`, { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch('/backend/api/admin/delete-quiz.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: quizId })
        });
      }
      const json = await res.json();
      if (json.success) {
        showToast('Kuis berhasil dihapus.');
        loadAdminQuizzes();
      } else {
        alert(json.message || 'Gagal menghapus kuis.');
      }
    } catch {
      alert('Gagal menghapus kuis.');
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Judul kuis wajib diisi.');
      return;
    }

    if (questions.length === 0) {
      alert('Tambahkan minimal 1 pertanyaan.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        alert(`Pertanyaan #${i + 1} masih belum memiliki teks.`);
        return;
      }
      if (q.options.length < 2) {
        alert(`Pertanyaan #${i + 1} harus memiliki minimal 2 pilihan.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text.trim()) {
          alert(`Pilihan ke-${j + 1} pada Pertanyaan #${i + 1} masih kosong.`);
          return;
        }
      }
    }

    const payload = {
      quiz: {
        id: editingQuizId,
        title: quizTitle.trim(),
        category: quizCategory.trim() || 'Umum',
        slug: quizSlug.trim() || '',
        status: quizStatus,
        description: quizDescription.trim()
      },
      questions,
      result_rules: resultRules
    };

    try {
      let res = await fetch('/api/admin/save-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch('/backend/api/admin/save-quiz.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      const json = await res.json();
      if (json.success && json.data) {
        const generatedId = json.data.quiz_id;
        const shareUrl = `${window.location.origin}/quiz.html?id=${generatedId}`;
        setShareModalUrl(shareUrl);
        showToast('Kuis dan aturan berhasil disimpan!');
        loadAdminQuizzes();
        setActiveTab('list');
      } else {
        alert(json.message || 'Gagal menyimpan kuis.');
      }
    } catch {
      alert('Koneksi penyimpanan gagal.');
    }
  };

  const copyShareLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link kuis disalin ke clipboard!');
      setShareModalUrl(url);
    });
  };

  // If not logged in, show Login Screen
  if (!token) {
    return (
      <AdminLogin
        onLoginSuccess={(session) => {
          setToken(session.token);
        }}
        onShowToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Modal */}
      {shareModalUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Shareable Link Kuis</h4>
              </div>
              <button
                onClick={() => setShareModalUrl(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Kuis siap disebarkan ke publik. Gunakan link kuis langsung di bawah ini:
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={shareModalUrl}
                className="w-full bg-transparent text-xs font-mono text-slate-700 focus:outline-none select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareModalUrl);
                  showToast('Tautan berhasil disalin!');
                }}
                className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
              >
                Salin
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={shareModalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                <span>Buka di Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Panel CMS Kuis &amp; Rules CTW</h2>
            <span className="text-xs text-slate-500 font-medium">
              Sesi terotentikasi sebagai <strong className="text-slate-700">Administrator</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Daftar Kuis ({quizzes.length})
          </button>
          <button
            onClick={handleNewQuiz}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'builder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingQuizId ? `Edit Kuis #${editingQuizId}` : 'Buat Kuis Baru'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIST QUIZZES */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Manajemen Kuis Terdaftar</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola status kuis, salin tautan shareable publik, atau ubah struktur soal &amp; aturan bobot.
              </p>
            </div>

            <button
              onClick={handleNewQuiz}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kuis Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-3.5">ID &amp; Judul Kuis</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Pertanyaan</th>
                  <th className="px-6 py-3.5">Partisipan</th>
                  <th className="px-6 py-3.5 text-right">Aksi &amp; Share Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Memuat daftar kuis...
                    </td>
                  </tr>
                ) : quizzes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      Belum ada kuis yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  quizzes.map((q) => {
                    const isPublished = q.status === 'active';
                    const shareUrl = `${window.location.origin}/quiz.html?id=${q.id}`;

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-blue-600 text-xs border border-slate-200 shrink-0">
                              {q.id}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 line-clamp-1">{q.title}</h4>
                              <span className="text-[11px] text-slate-400 font-semibold">
                                {q.category || 'Umum'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isPublished
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {q.total_questions || 0} Soal
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {(q.total_participants || 0).toLocaleString('id-ID')}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy Shareable Link */}
                            <button
                              onClick={() => copyShareLink(shareUrl)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </button>

                            {/* Open Public Quiz directly */}
                            {onOpenPublicQuiz ? (
                              <button
                                onClick={() => onOpenPublicQuiz(q.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Uji Kuis di App"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            ) : (
                              <a
                                href={shareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Uji Kuis di Tab Baru"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleEditQuiz(q.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="Edit Kuis & Soal"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteQuiz(q.id, q.title)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Hapus Kuis"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUIZ BUILDER */}
      {activeTab === 'builder' && (
        <form onSubmit={handleSaveQuiz} className="space-y-6">
          {/* Section 1: Quiz Metadata */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                  Langkah 1
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Data &amp; Metadata Kuis</h3>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {editingQuizId ? `Mengedit Kuis #${editingQuizId}` : 'Kuis Baru'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Judul Kuis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Contoh: Tes Pemetaan Karir Teknologi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Kategori
                </label>
                <input
                  type="text"
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value)}
                  placeholder="Teknologi & Desain"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Slug URL
                </label>
                <input
                  type="text"
                  value={quizSlug}
                  onChange={(e) => setQuizSlug(e.target.value)}
                  placeholder="pemetaan-karir-teknologi"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Status Publikasi
                </label>
                <select
                  value={quizStatus}
                  onChange={(e) => setQuizStatus(e.target.value as 'active' | 'draft')}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                >
                  <option value="active">Published (Tersedia untuk Pengguna)</option>
                  <option value="draft">Draft (Disimpan Sementara)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Deskripsi Kuis
                </label>
                <textarea
                  rows={2}
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Jelaskan tujuan evaluasi atau sasaran kuis ini..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Question & Option Builder */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                  Langkah 2
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Question &amp; Option Builder</h3>
                <p className="text-xs text-slate-500">
                  Tambahkan pertanyaan kuis dan tentukan 2-4 opsi jawaban dengan bobot skor &amp; result_code.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuestions([
                    ...questions,
                    {
                      question_text: '',
                      options: [
                        { option_text: '', score_value: 20, result_code: 'A' },
                        { option_text: '', score_value: 20, result_code: 'B' }
                      ]
                    }
                  ]);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pertanyaan</span>
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Pertanyaan #{qIdx + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (questions.length <= 1) {
                          alert('Kuis minimal harus memiliki 1 pertanyaan.');
                          return;
                        }
                        setQuestions(questions.filter((_, idx) => idx !== qIdx));
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Pertanyaan</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Teks Pertanyaan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={q.question_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIdx].question_text = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Tuliskan pertanyaan kuis di sini..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-600 text-xs sm:text-sm font-medium"
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Pilihan Jawaban (Minimal 2 - 4 Opsi)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...questions];
                          updated[qIdx].options.push({
                            option_text: '',
                            score_value: 20,
                            result_code: 'CODE_' + (updated[qIdx].options.length + 1)
                          });
                          setQuestions(updated);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Opsi</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];
                        return (
                          <div
                            key={optIdx}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-2 text-xs"
                          >
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                              {letterMap[optIdx] || optIdx + 1}
                            </span>

                            <input
                              type="text"
                              value={opt.option_text}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIdx].options[optIdx].option_text = e.target.value;
                                setQuestions(updated);
                              }}
                              placeholder="Teks pilihan jawaban..."
                              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
                            />

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Poin:</span>
                              <input
                                type="number"
                                value={opt.score_value}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[qIdx].options[optIdx].score_value =
                                    parseInt(e.target.value, 10) || 0;
                                  setQuestions(updated);
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-bold text-center"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Kode:</span>
                              <input
                                type="text"
                                value={opt.result_code}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  updated[qIdx].options[optIdx].result_code = e.target.value.toUpperCase();
                                  setQuestions(updated);
                                }}
                                placeholder="KODE"
                                className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 font-mono text-[11px] uppercase"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (q.options.length <= 2) {
                                  alert('Pertanyaan harus memiliki minimal 2 opsi.');
                                  return;
                                }
                                const updated = [...questions];
                                updated[qIdx].options = updated[qIdx].options.filter((_, idx) => idx !== optIdx);
                                setQuestions(updated);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Hapus Opsi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Result Rules */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  Langkah 3
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Aturan Penentuan Hasil Akhir (Result Rules)
                </h3>
                <p className="text-xs text-slate-500">
                  Petakan rentang skor atau kode dominan ke judul hasil dan rekomendasi yang bermakna.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResultRules([
                    ...resultRules,
                    {
                      min_score: 0,
                      max_score: 100,
                      result_code: 'KODE_BARU',
                      title: 'Hasil Kuis Baru',
                      badge: 'Tingkat Baru',
                      description: 'Deskripsi profil hasil evaluasi baru.',
                      recommendation: 'Langkah rekomendasi yang disarankan.'
                    }
                  ]);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Aturan Hasil</span>
              </button>
            </div>

            <div className="space-y-4">
              {resultRules.map((rule, rIdx) => (
                <div
                  key={rIdx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                        {rIdx + 1}
                      </span>
                      Aturan Hasil #{rIdx + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (resultRules.length <= 1) {
                          alert('Minimal sisakan 1 aturan hasil.');
                          return;
                        }
                        setResultRules(resultRules.filter((_, idx) => idx !== rIdx));
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      Hapus Aturan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Skor Min
                      </label>
                      <input
                        type="number"
                        value={rule.min_score}
                        onChange={(e) => {
                          const updated = [...resultRules];
                          updated[rIdx].min_score = parseInt(e.target.value, 10) || 0;
                          setResultRules(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Skor Max
                      </label>
                      <input
                        type="number"
                        value={rule.max_score}
                        onChange={(e) => {
                          const updated = [...resultRules];
                          updated[rIdx].max_score = parseInt(e.target.value, 10) || 0;
                          setResultRules(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Kode Hasil
                      </label>
                      <input
                        type="text"
                        value={rule.result_code}
                        onChange={(e) => {
                          const updated = [...resultRules];
                          updated[rIdx].result_code = e.target.value.toUpperCase();
                          setResultRules(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Badge
                      </label>
                      <input
                        type="text"
                        value={rule.badge}
                        onChange={(e) => {
                          const updated = [...resultRules];
                          updated[rIdx].badge = e.target.value;
                          setResultRules(updated);
                        }}
                        placeholder="Tingkat Mahir"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Judul Hasil
                      </label>
                      <input
                        type="text"
                        value={rule.title}
                        onChange={(e) => {
                          const updated = [...resultRules];
                          updated[rIdx].title = e.target.value;
                          setResultRules(updated);
                        }}
                        placeholder="Contoh: Sangat Kuasai"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Deskripsi Evaluasi
                      </label>
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) => {
                          const updated = [...resultRules];
                          updated[rIdx].description = e.target.value;
                          setResultRules(updated);
                        }}
                        placeholder="Deskripsi profil..."
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="p-6 rounded-3xl bg-[#f1f5f9] border border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all"
            >
              Batal &amp; Kembali
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Publikasikan Kuis</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
