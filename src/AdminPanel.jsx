import React, { useState, useEffect } from 'react';
import { getQuizzes, getQuizById, saveQuiz, deleteQuiz } from './services/quizService';
import {
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRight,
  ListPlus,
  Sliders,
  Settings2
} from 'lucide-react';

/**
 * Komponen Admin Panel Management Kuis React lengkap dengan Tailwind CSS:
 * 1. Tombol preset untuk membuat kuis dengan 3, 5, 7, atau 10 pertanyaan secara dinamis.
 * 2. Setiap pertanyaan memiliki 3 opsi jawaban dengan nilai skor (0 untuk Ringan, 50 untuk Sedang, 100 untuk Kritis).
 * 3. Terintegrasi dengan fungsi saveQuiz(quizData) dan deleteQuiz(quizId) dari ./services/quizService.
 * 4. Konfirmasi dialog sebelum menghapus kuis dan indikator loading state saat proses pengiriman data.
 * 5. Tata letak bersih, profesional, elegan, dan responsif.
 */
export const AdminPanel = ({ onOpenPublicQuiz }) => {
  // Tab aktif: 'list' (Katalog Kuis) | 'builder' (Pembuat Kuis)
  const [activeTab, setActiveTab] = useState('list');
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State Kuis
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Laptop & PC');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('active');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  // Preset Pembuatan Soal Standar (3 Opsi: 0 = Ringan, 50 = Sedang, 100 = Kritis)
  const generateQuestionsPreset = (count, baseCategory = category) => {
    const templates = [
      {
        q: 'Bagaimana status indikator daya (Power) atau pengisian baterai saat dinyalakan?',
        opts: [
          { text: 'Menyala normal tanpa kendala (Normal)', score: 0, code: 'RINGAN' },
          { text: 'Kadang berkedip tidak stabil / lambat respon', score: 50, code: 'SEDANG' },
          { text: 'Mati total / tidak ada respon sama sekali (No Power)', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah terdapat kendala pada layar display atau visual tampilan perangkat?',
        opts: [
          { text: 'Tampilan jernih, tajam, dan normal', score: 0, code: 'RINGAN' },
          { text: 'Layar berkedip sesekali, garis tipis, atau brightness drop', score: 50, code: 'SEDANG' },
          { text: 'Layar blank hitam, artefak pecah, atau retak fisik parah', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kestabilan suhu dan suara komponen pendingin (fan) saat beroperasi?',
        opts: [
          { text: 'Suhu adem, suara kipas halus dan normal', score: 0, code: 'RINGAN' },
          { text: 'Cepat hangat/panas dan kipas terdengar berdengung keras', score: 50, code: 'SEDANG' },
          { text: 'Sangat panas mendidih (Overheat ekstrim) lalu mati mendadak (Thermal Shutdown)', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah sistem operasi mengalami freeze, restart otomatis, atau Blue Screen (BSOD)?',
        opts: [
          { text: 'Sistem sangat stabil, tidak pernah crash', score: 0, code: 'RINGAN' },
          { text: 'Terkadang lag atau aplikasi force close sesekali', score: 50, code: 'SEDANG' },
          { text: 'Sering restart sendiri secara berulang atau bootloop', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kondisi media penyimpanan (SSD/HDD) dan kecepatan baca/tulis data?',
        opts: [
          { text: 'Booting sangat cepat dan respon transfer file lancar', score: 0, code: 'RINGAN' },
          { text: 'Loading aplikasi lambat, disk usage sering 100%', score: 50, code: 'SEDANG' },
          { text: 'Sistem mendadak corrupt, bad sector terdeteksi, atau drive tidak terbaca', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kondisi baterai perangkat saat digunakan tanpa charger?',
        opts: [
          { text: 'Daya tahan awet sesuai spesifikasi pabrikan', score: 0, code: 'RINGAN' },
          { text: 'Baterai cepat drop berkurang drastis di bawah 2 jam', score: 50, code: 'SEDANG' },
          { text: 'Baterai kembung / harus colok charger terus menerus agar tidak mati', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah input keyboard, touchpad, atau tombol fisik merespon dengan baik?',
        opts: [
          { text: 'Semua tombol merespon empuk dan responsif', score: 0, code: 'RINGAN' },
          { text: 'Ada 1-2 tombol macet atau kadang mengetik ganda', score: 50, code: 'SEDANG' },
          { text: 'Seluruh input macet total / korsleting jalur tombol', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana konektivitas jaringan nirkabel (Wi-Fi, Bluetooth) dan port fisik (USB, Audio)?',
        opts: [
          { text: 'Semua port dan sinyal nirkabel terhubung stabil', score: 0, code: 'RINGAN' },
          { text: 'Sinyal Wi-Fi sering putus nyambung atau port agak longgar', score: 50, code: 'SEDANG' },
          { text: 'Hardware Wi-Fi/port mati permanen dan tidak terdeteksi sistem', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah perangkat pernah terkena benturan keras, getaran ekstrem, atau tumpahan cairan?',
        opts: [
          { text: 'Tidak pernah, penggunaan selalu hati-hati dan aman', score: 0, code: 'RINGAN' },
          { text: 'Pernah terbentur ringan tanpa ada retakan atau basah', score: 50, code: 'SEDANG' },
          { text: 'Pernah terkena cairan atau benturan keras berbekas', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kondisi fisik engsel, casing pelindung, dan struktur bodi perangkat?',
        opts: [
          { text: 'Struktur kokoh, rapat, dan mulus sempurna', score: 0, code: 'RINGAN' },
          { text: 'Engsel agak kendor atau baret pemakaian wajar', score: 50, code: 'SEDANG' },
          { text: 'Engsel patah, casing pecah, atau struktur terbuka membahayakan komponen dalam', score: 100, code: 'KRITIS' }
        ]
      }
    ];

    const targetList = templates.slice(0, count);
    return targetList.map((item, idx) => {
      const qId = Date.now() + idx * 10;
      return {
        id: qId,
        question_text: item.q,
        options: item.opts.map((opt, optIdx) => ({
          id: qId + optIdx + 1,
          option_text: opt.text,
          score_value: opt.score, // 0 untuk Ringan, 50 untuk Sedang, 100 untuk Kritis
          result_code: opt.code
        }))
      };
    });
  };

  // State Pertanyaan (Default diawali dengan Preset 5 Pertanyaan)
  const [questions, setQuestions] = useState(() => generateQuestionsPreset(5));

  // Aturan Evaluasi Skor Hasil
  const [resultRules, setResultRules] = useState([
    {
      id: 1,
      min_score: 0,
      max_score: 35,
      result_code: 'RINGAN',
      title: 'Kondisi Baik / Kendala Sangat Ringan',
      badge: 'Kondisi Optimal',
      badge_color: '#10b981',
      description: 'Perangkat berada dalam kondisi prima dengan kendala minimal. Cukup lakukan pembersihan file cache atau update driver berkala.',
      recommendation: 'Lakukan pembersihan debu rutin dan hindari penggunaan beban tinggi tanpa ventilasi yang memadai.'
    },
    {
      id: 2,
      min_score: 36,
      max_score: 70,
      result_code: 'SEDANG',
      title: 'Perlu Perawatan & Pengecekan Menengah',
      badge: 'Perlu Perawatan',
      badge_color: '#f59e0b',
      description: 'Terdeteksi indikasi penurunan performa atau komponen aus yang membutuhkan pengecekan teknis sebelum bertambah parah.',
      recommendation: 'Jadwalkan servis pembersihan heatsink, penggantian thermal paste, dan optimasi sistem berkala.'
    },
    {
      id: 3,
      min_score: 71,
      max_score: 100,
      result_code: 'KRITIS',
      title: 'Indikasi Kerusakan Kritis / Serius',
      badge: 'Kerusakan Kritis',
      badge_color: '#ef4444',
      description: 'Terindikasi kerusakan signifikan pada komponen hardware inti yang berpotensi mati total bila terus dipaksakan beroperasi.',
      recommendation: 'Segera matikan perangkat dan bawa ke teknisi profesional CTW untuk diagnosa hardware mendalam.'
    }
  ]);

  // Loading & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal Shareable Link
  const [shareModalData, setShareModalData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Konfirmasi Hapus Kuis
  const [deleteConfirmQuiz, setDeleteConfirmQuiz] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Memuat Daftar Kuis dari Supabase
  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const res = await getQuizzes();
      setQuizzes(res.quizzes || []);
    } catch (err) {
      console.warn('Gagal memuat kuis:', err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Terapkan Preset Pertanyaan secara Dinamis (3, 5, 7, atau 10 Pertanyaan)
  const handleApplyPreset = (count) => {
    const presetQuestions = generateQuestionsPreset(count, category);
    setQuestions(presetQuestions);
    showToast(`✨ Preset ${count} pertanyaan berhasil diterapkan!`);
  };

  // Tambah Pertanyaan Kustom
  const handleAddQuestion = () => {
    const nextQId = Date.now();
    setQuestions((prev) => [
      ...prev,
      {
        id: nextQId,
        question_text: '',
        options: [
          { id: nextQId + 1, option_text: '', score_value: 0, result_code: 'RINGAN' },
          { id: nextQId + 2, option_text: '', score_value: 50, result_code: 'SEDANG' },
          { id: nextQId + 3, option_text: '', score_value: 100, result_code: 'KRITIS' }
        ]
      }
    ]);
  };

  // Hapus Pertanyaan
  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) {
      showToast('⚠️ Kuis harus memiliki minimal 1 pertanyaan.');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  // Edit Teks atau Skor Opsi
  const handleUpdateOption = (qIndex, optIndex, field, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const opts = [...q.options];
      opts[optIndex] = { ...opts[optIndex], [field]: value };
      q.options = opts;
      next[qIndex] = q;
      return next;
    });
  };

  // Edit Kuis yang Sudah Ada
  const handleStartEditQuiz = async (quizItem) => {
    setEditingQuizId(quizItem.id);
    setTitle(quizItem.title || '');
    setCategory(quizItem.category || 'Laptop & PC');
    setSlug(quizItem.slug || '');
    setStatus(quizItem.status || 'active');
    setDescription(quizItem.description || '');
    setThumbnail(quizItem.thumbnail || '');

    try {
      const detail = await getQuizById(quizItem.id);
      if (detail?.questions && detail.questions.length > 0) {
        setQuestions(detail.questions);
      }
      if (detail?.result_rules && detail.result_rules.length > 0) {
        setResultRules(detail.result_rules);
      }
    } catch (e) {
      console.warn('Gagal memuat detail pertanyaan saat edit:', e);
    }

    setActiveTab('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Simpan Kuis (saveQuiz)
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setSaveError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      showToast('⚠️ Judul kuis wajib diisi.');
      return;
    }

    if (questions.length === 0) {
      showToast('⚠️ Tambahkan minimal 1 pertanyaan.');
      return;
    }

    // Validasi Kelengkapan Pertanyaan & Opsi
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        showToast(`⚠️ Teks pertanyaan #${i + 1} masih kosong.`);
        return;
      }
      if (questions[i].options.length < 2) {
        showToast(`⚠️ Pertanyaan #${i + 1} harus memiliki minimal 2 opsi.`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].option_text.trim()) {
          showToast(`⚠️ Pilihan ke-${j + 1} pada Pertanyaan #${i + 1} masih kosong.`);
          return;
        }
      }
    }

    setIsSaving(true);

    try {
      const quizPayload = {
        quiz: {
          id: editingQuizId || null,
          title: cleanTitle,
          category,
          slug,
          status,
          description: description.trim(),
          thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600'
        },
        questions,
        resultRules
      };

      // Panggil fungsi saveQuiz dari quizService
      const res = await saveQuiz(quizPayload);

      if (res && res.quiz_id) {
        const fullShareUrl = `${window.location.origin}/quiz.html?id=${res.quiz_id}`;
        setShareModalData({
          url: fullShareUrl,
          id: res.quiz_id,
          title: cleanTitle
        });
        showToast('✅ Kuis berhasil disimpan dan dipublikasikan!');
        loadQuizzes();

        if (!editingQuizId) {
          setTitle('');
          setDescription('');
          setSlug('');
          setQuestions(generateQuestionsPreset(5));
        }
      }
    } catch (err) {
      console.error('Error saat menyimpan kuis:', err);
      const msg = err.message || 'Gagal menyimpan data kuis ke Supabase.';
      setSaveError(msg);
      showToast('⚠️ ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Eksekusi Hapus Kuis (deleteQuiz)
  const handleExecuteDelete = async () => {
    if (!deleteConfirmQuiz) return;
    setIsDeleting(true);

    try {
      await deleteQuiz(deleteConfirmQuiz.id);
      showToast('✅ Kuis berhasil dihapus secara permanen.');
      setQuizzes((prev) => prev.filter((q) => String(q.id) !== String(deleteConfirmQuiz.id)));
      setDeleteConfirmQuiz(null);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('⚠️ Gagal menghapus kuis: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Salin Link Publik
  const handleCopyShareLink = () => {
    if (!shareModalData?.url) return;
    navigator.clipboard.writeText(shareModalData.url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showToast('Tautan publik berhasil disalin!');
    });
  };

  // Filter Kuis berdasarkan Pencarian
  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 font-['Inter',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Panel Admin */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-wider mb-2 border border-blue-100">
            <Settings2 className="w-3.5 h-3.5" />
            <span>Admin Panel Management Kuis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Kuis CTW Interactive
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Buat kuis secara instan menggunakan tombol preset pertanyaan dinamis (3, 5, 7, atau 10 soal) dengan bobot skor terkalibrasi (0 Ringan, 50 Sedang, 100 Kritis).
          </p>
        </div>

        {/* Tab Navigasi */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setEditingQuizId(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Daftar Kuis ({quizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('builder');
              if (!editingQuizId) {
                setTitle('');
                setDescription('');
                setSlug('');
                setQuestions(generateQuestionsPreset(5));
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'builder'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingQuizId ? 'Edit Kuis' : 'Buat Kuis Baru'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIST / DAFTAR KUIS                                */}
      {/* ======================================================== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white shadow-soft-flat border border-slate-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul kuis atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={loadQuizzes}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuizzes ? 'animate-spin' : ''}`} />
                <span>Segarkan Data</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('builder');
                  setEditingQuizId(null);
                  setTitle('');
                  setDescription('');
                  setQuestions(generateQuestionsPreset(5));
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kuis Baru</span>
              </button>
            </div>
          </div>

          {/* Tabel Kuis */}
          <div className="rounded-3xl bg-white shadow-soft-card border border-slate-100 overflow-hidden">
            {isLoadingQuizzes ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">Memuat data kuis dari database...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Tidak Ada Kuis Ditemukan</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Mulai buat kuis pertamamu menggunakan tombol preset dinamis di bawah.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('builder');
                    setEditingQuizId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Buat Kuis Sekarang
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-4 px-6">ID &amp; Judul Kuis</th>
                      <th className="py-4 px-4">Kategori</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-center">Tautan Publik</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQuizzes.map((q) => {
                      const shareLink = `${window.location.origin}/quiz.html?id=${q.id}`;
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-slate-900 line-clamp-1">{q.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {q.id}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                              {q.category || 'Umum'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                q.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {q.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => {
                                setShareModalData({
                                  url: shareLink,
                                  id: q.id,
                                  title: q.title
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Bagikan</span>
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {onOpenPublicQuiz && (
                                <button
                                  onClick={() => onOpenPublicQuiz(q.id)}
                                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Buka Kuis di Player"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEditQuiz(q)}
                                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit Kuis"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmQuiz(q)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Kuis"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BUILDER / FORM KUIS                               */}
      {/* ======================================================== */}
      {activeTab === 'builder' && (
        <form onSubmit={handleSaveQuiz} className="space-y-6">
          {saveError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Section Preset Cepat Pembuatan Soal */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider mb-1">
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Preset Dinamis</span>
                </span>
                <h3 className="text-lg font-black tracking-tight">Preset Jumlah Pertanyaan Kuis</h3>
                <p className="text-xs text-blue-100 max-w-xl">
                  Pilih preset jumlah soal di bawah untuk mengisi form pertanyaan secara instan dengan 3 opsi skor terkalibrasi (0, 50, 100):
                </p>
              </div>

              {/* Tombol Preset 3, 5, 7, 10 Pertanyaan */}
              <div className="flex flex-wrap items-center gap-2">
                {[3, 5, 7, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleApplyPreset(num)}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all shadow-xs ${
                      questions.length === num
                        ? 'bg-white text-blue-700 shadow-md scale-105 ring-2 ring-blue-300'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {num} Pertanyaan
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 1. Informasi Utama Kuis */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">1. Data Informasi Kuis</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {editingQuizId ? `Edit ID #${editingQuizId}` : 'Kuis Baru'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Judul Kuis *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Skrining Diagnosa Hardware & Kestabilan Sistem"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kategori Perangkat</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Laptop & PC">Laptop &amp; PC</option>
                  <option value="HP / Smartphone">HP / Smartphone</option>
                  <option value="Printer & Periferal">Printer &amp; Periferal</option>
                  <option value="Jaringan & Internet">Jaringan &amp; Internet</option>
                  <option value="Umum">Umum / Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Publikasi</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="active">Active (Tersedia untuk Pengguna)</option>
                  <option value="draft">Draft (Simpan Sementara)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Deskripsi / Petunjuk Diagnosis</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsikan tujuan dan instruksi pengerjaan kuis ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Daftar Pertanyaan & Opsi Skor */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white shadow-soft-card border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  2. Pertanyaan &amp; Opsi Skor ({questions.length} Soal)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap pertanyaan memiliki 3 opsi dengan skor terstandar: <strong>0 (Ringan)</strong>, <strong>50 (Sedang)</strong>, dan <strong>100 (Kritis)</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pertanyaan Kustom</span>
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={q.id || qIdx} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      Soal #{qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder={`Teks pertanyaan ke-${qIdx + 1}...`}
                    value={q.question_text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setQuestions((prev) => {
                        const next = [...prev];
                        next[qIdx].question_text = text;
                        return next;
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  {/* 3 Opsi Jawaban (0, 50, 100) */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      3 Opsi Jawaban &amp; Bobot Skor Kerusakan:
                    </label>

                    {q.options.map((opt, optIdx) => {
                      const scoreLabel =
                        opt.score_value === 0
                          ? 'Ringan (0)'
                          : opt.score_value === 50
                          ? 'Sedang (50)'
                          : opt.score_value === 100
                          ? 'Kritis (100)'
                          : `${opt.score_value} Poin`;

                      const badgeStyle =
                        opt.score_value === 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : opt.score_value === 50
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200';

                      return (
                        <div
                          key={opt.id || optIdx}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="w-6 text-center text-xs font-black text-slate-400">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${badgeStyle}`}>
                              {scoreLabel}
                            </span>
                          </div>

                          <input
                            type="text"
                            required
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}...`}
                            value={opt.option_text}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, 'option_text', e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />

                          <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
                            <label className="text-[11px] text-slate-400 font-bold">Skor:</label>
                            <select
                              value={opt.score_value}
                              onChange={(e) => {
                                const pts = parseInt(e.target.value, 10);
                                handleUpdateOption(qIdx, optIdx, 'score_value', pts);
                                handleUpdateOption(
                                  qIdx,
                                  optIdx,
                                  'result_code',
                                  pts === 0 ? 'RINGAN' : pts === 50 ? 'SEDANG' : 'KRITIS'
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none"
                            >
                              <option value={0}>0 (Ringan)</option>
                              <option value={50}>50 (Sedang)</option>
                              <option value={100}>100 (Kritis)</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Save Bar */}
          <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Batal &amp; Kembali ke Daftar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan &amp; Publikasikan Kuis</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SHAREABLE LINK KUIS                             */}
      {/* ======================================================== */}
      {shareModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShareModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Kuis Berhasil Dipublikasikan!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tautan publik di bawah untuk dibagikan kepada peserta:
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-medium text-slate-700 truncate select-all">
                {shareModalData.url}
              </span>
              <button
                onClick={handleCopyShareLink}
                className="shrink-0 p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-xs border border-slate-200 transition-colors"
                title="Salin Tautan"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <a
                href={shareModalData.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>Buka di Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setShareModalData(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: KONFIRMASI HAPUS KUIS DIALOG                    */}
      {/* ======================================================== */}
      {deleteConfirmQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Kuis</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Yakin ingin menghapus kuis <strong>"{deleteConfirmQuiz.title}"</strong>? Semua pertanyaan dan data evaluasi kuis ini akan dihapus secara permanen dari Supabase.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmQuiz(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
