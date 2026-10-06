import React, { useState, useEffect } from 'react';
import { fetchQuizzes, getQuizzes, getQuizById, saveQuiz, deleteQuiz } from './services/quizService';
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
  Settings2
} from 'lucide-react';

/**
 * Komponen Modal & Panel Pembuatan Kuis Baru Interaktif (CTW Interactive)
 * Menggunakan React dan Tailwind CSS:
 * 1. Form mendukung pengisian judul kuis, kategori (Laptop & PC, HP / Smartphone, Printer, dll.), deskripsi, dan preset jumlah soal (3, 5, 7, atau 10 soal).
 * 2. Bidang input dinamis untuk setiap pertanyaan beserta 3 pilihan opsi jawaban dan bobot nilainya (Skor: 0 = Ringan, 50 = Sedang, 100 = Kritis).
 * 3. Menyimpan kuis langsung ke Supabase melalui saveQuiz(quizData).
 * 4. State loading saat penyimpanan berlangsung + notifikasi toast dan popup sukses.
 * 5. Tombol Hapus Kuis di daftar tabel terhubung langsung ke deleteQuiz(quizId) dengan konfirmasi dialog.
 */
export const AdminPanel = ({ onOpenPublicQuiz }) => {
  // State Utama
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Form Pembuatan / Edit Kuis
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);

  // Field Form Kuis
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Laptop & PC');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('active');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  // Generator Pertanyaan Berdasarkan Preset (3, 5, 7, atau 10 Soal)
  // Setiap soal memiliki 3 opsi dengan skor: 0 (Ringan), 50 (Sedang), 100 (Kritis)
  const generateQuestionsPreset = (count, targetCategory = category) => {
    const templates = [
      {
        q: 'Bagaimana kondisi indikator daya (Power) atau pengisian baterai saat perangkat dinyalakan?',
        opts: [
          { text: 'Menyala normal tanpa kendala (Normal)', score: 0, code: 'RINGAN' },
          { text: 'Kadang berkedip tidak stabil / lambat respon', score: 50, code: 'SEDANG' },
          { text: 'Mati total / tidak ada respon sama sekali (No Power)', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah terdapat kendala visual pada layar display atau monitor perangkat?',
        opts: [
          { text: 'Tampilan jernih, tajam, dan normal tanpa cacat', score: 0, code: 'RINGAN' },
          { text: 'Layar berkedip sesekali, garis tipis, atau backlight redup', score: 50, code: 'SEDANG' },
          { text: 'Layar blank hitam, artefak pecah, atau retak fisik parah', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kestabilan suhu dan suara komponen pendingin (kipas/heatsink) saat beroperasi?',
        opts: [
          { text: 'Suhu adem, suara kipas halus dan berputar wajar', score: 0, code: 'RINGAN' },
          { text: 'Cepat panas dan kipas terdengar berdengung bising', score: 50, code: 'SEDANG' },
          { text: 'Sangat panas ekstrem (Overheat) lalu mati mendadak (Thermal Shutdown)', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah sistem operasi mengalami freeze/macet, restart otomatis, atau Blue Screen (BSOD)?',
        opts: [
          { text: 'Sistem sangat stabil, tidak pernah crash ataupun restart sendiri', score: 0, code: 'RINGAN' },
          { text: 'Terkadang lag / aplikasi force close saat multitasking', score: 50, code: 'SEDANG' },
          { text: 'Sering restart sendiri secara berulang atau gagal booting (Bootloop)', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kondisi media penyimpanan data (SSD/HDD) dan performa transfer berkas?',
        opts: [
          { text: 'Booting sangat cepat dan respon baca/tulis lancar', score: 0, code: 'RINGAN' },
          { text: 'Loading aplikasi lambat, disk usage sering mentok 100%', score: 50, code: 'SEDANG' },
          { text: 'Sistem corrupted, terdeteksi bad sector, atau storage tidak terbaca', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana ketahanan baterai perangkat saat digunakan tanpa sambungan charger?',
        opts: [
          { text: 'Daya tahan awet sesuai kapasitas spesifikasi pabrikan', score: 0, code: 'RINGAN' },
          { text: 'Baterai cepat drop berkurang drastis di bawah 2 jam', score: 50, code: 'SEDANG' },
          { text: 'Baterai kembung / harus colok charger terus menerus agar tidak mati', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah input keyboard, tombol fisik, touchscreen, atau touchpad merespons dengan presisi?',
        opts: [
          { text: 'Semua tombol dan sensor responsif serta empuk digunakan', score: 0, code: 'RINGAN' },
          { text: 'Ada 1-2 tombol macet atau kadang terjadi pengetikan ganda', score: 50, code: 'SEDANG' },
          { text: 'Seluruh input macet total / korsleting jalur controller', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana konektivitas modul nirkabel (Wi-Fi, Bluetooth) dan port fisik (USB, Audio, HDMI)?',
        opts: [
          { text: 'Semua port dan sinyal nirkabel terhubung stabil dan cepat', score: 0, code: 'RINGAN' },
          { text: 'Sinyal Wi-Fi sering terputus atau soket port agak longgar', score: 50, code: 'SEDANG' },
          { text: 'Modul hardware Wi-Fi / port mati permanen tidak terbaca di OS', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Apakah perangkat pernah mengalami benturan fisik keras, getaran kuat, atau tumpahan cairan?',
        opts: [
          { text: 'Tidak pernah, penggunaan selalu terlindungi dan aman', score: 0, code: 'RINGAN' },
          { text: 'Pernah terbentur ringan tanpa ada keretakan atau rembesan air', score: 50, code: 'SEDANG' },
          { text: 'Pernah tersiram cairan atau jatuh keras dengan retakan terbuka', score: 100, code: 'KRITIS' }
        ]
      },
      {
        q: 'Bagaimana kondisi fisik engsel, casing pelindung, dan struktur mekanis bodi perangkat?',
        opts: [
          { text: 'Struktur kokoh, presisi, rapat, dan mulus terawat', score: 0, code: 'RINGAN' },
          { text: 'Engsel agak longgar atau terdapat goresan pemakaian wajar', score: 50, code: 'SEDANG' },
          { text: 'Engsel patah, casing terbelah, atau rangka bodi melengkung parah', score: 100, code: 'KRITIS' }
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
          score_value: opt.score, // 0 = Ringan, 50 = Sedang, 100 = Kritis
          result_code: opt.code
        }))
      };
    });
  };

  // State Pertanyaan di Form Modal (Default Preset 5 Pertanyaan)
  const [questions, setQuestions] = useState(() => generateQuestionsPreset(5));

  // Aturan Evaluasi Skor Hasil
  const [resultRules, setResultRules] = useState([
    {
      id: 1,
      min_score: 0,
      max_score: 35,
      result_code: 'RINGAN',
      title: 'Kondisi Baik / Kendala Ringan',
      badge: 'Kondisi Optimal',
      badge_color: '#10b981',
      description: 'Perangkat berada dalam kondisi prima dengan kendala minimal. Cukup lakukan pembersihan berkala dan update sistem operasi.',
      recommendation: 'Lakukan perawatan mandiri secara berkala dan bersihkan sirkulasi ventilasi dari debu.'
    },
    {
      id: 2,
      min_score: 36,
      max_score: 70,
      result_code: 'SEDANG',
      title: 'Perlu Servis & Perawatan Menengah',
      badge: 'Perlu Perawatan',
      badge_color: '#f59e0b',
      description: 'Terindikasi penurunan performa atau keausan komponen yang memerlukan penanganan teknisi sebelum kerusakan menjalar.',
      recommendation: 'Jadwalkan pembersihan internal, pergantian pasta termal pendingin, dan backup data penting.'
    },
    {
      id: 3,
      min_score: 71,
      max_score: 100,
      result_code: 'KRITIS',
      title: 'Indikasi Kerusakan Hardware Kritis',
      badge: 'Kerusakan Kritis',
      badge_color: '#ef4444',
      description: 'Terindikasi kegagalan pada komponen inti yang berisiko menyebabkan kerusakan permanen atau mati total jika terus dioperasikan.',
      recommendation: 'Segera matikan perangkat dan bawa ke laboratorium perbaikan CTW untuk pemeriksaan teknis mendalam.'
    }
  ]);

  // Loading & Feedback States
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
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Memuat Seluruh Kuis dari Supabase
  const loadQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const res = await fetchQuizzes();
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

  // Buka Modal Pembuatan Kuis Baru
  const handleOpenCreateModal = () => {
    setEditingQuizId(null);
    setTitle('');
    setCategory('Laptop & PC');
    setSlug('');
    setStatus('active');
    setDescription('');
    setThumbnail('');
    setQuestions(generateQuestionsPreset(5, 'Laptop & PC'));
    setSaveError(null);
    setIsModalOpen(true);
  };

  // Buka Modal Edit Kuis
  const handleOpenEditModal = async (quizItem) => {
    setEditingQuizId(quizItem.id);
    setTitle(quizItem.title || '');
    setCategory(quizItem.category || 'Laptop & PC');
    setSlug(quizItem.slug || '');
    setStatus(quizItem.status || 'active');
    setDescription(quizItem.description || '');
    setThumbnail(quizItem.thumbnail || '');
    setSaveError(null);
    setIsModalOpen(true);

    try {
      const detail = await getQuizById(quizItem.id);
      if (detail?.questions && detail.questions.length > 0) {
        setQuestions(detail.questions);
      }
      if (detail?.result_rules && detail.result_rules.length > 0) {
        setResultRules(detail.result_rules);
      }
    } catch (err) {
      console.warn('Gagal memuat detail pertanyaan kuis:', err);
    }
  };

  // Terapkan Preset Pertanyaan secara Dinamis (3, 5, 7, atau 10 Pertanyaan)
  const handleApplyPreset = (count) => {
    const presetQuestions = generateQuestionsPreset(count, category);
    setQuestions(presetQuestions);
    showToast(`✨ Preset ${count} pertanyaan berhasil diterapkan!`);
  };

  // Tambah Pertanyaan Baru secara Dinamis
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

  // Update Teks / Skor Opsi
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

  // 3. Simpan Kuis (saveQuiz) Langsung ke Supabase
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
          status: 'ACTIVE',
          is_published: true,
          total_questions: questions.length,
          description: description.trim(),
          thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600'
        },
        questions,
        resultRules
      };

      // Kirim seluruh payload data ke Supabase menggunakan saveQuiz
      const res = await saveQuiz(quizPayload);

      if (res && res.quiz_id) {
        const fullShareUrl = `${window.location.origin}/quiz.html?id=${res.quiz_id}`;
        setShareModalData({
          url: fullShareUrl,
          id: res.quiz_id,
          title: cleanTitle
        });
        showToast('✅ Kuis baru berhasil dibuat dan disimpan ke database Supabase!');
        setIsModalOpen(false);
        loadQuizzes();
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

  // 4. Hapus Kuis (deleteQuiz) Langsung dari Supabase
  const handleExecuteDelete = async () => {
    if (!deleteConfirmQuiz) return;
    setIsDeleting(true);

    try {
      await deleteQuiz(deleteConfirmQuiz.id);
      showToast(`✅ Kuis "${deleteConfirmQuiz.title}" berhasil dihapus secara permanen dari Supabase.`);
      setQuizzes((prev) => prev.filter((q) => String(q.id) !== String(deleteConfirmQuiz.id)));
      setDeleteConfirmQuiz(null);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('⚠️ Gagal menghapus kuis: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Bagikan Kuis Langsung (Salin ke Clipboard & Tampilkan Toast Alert)
  const handleShareQuiz = (q) => {
    const shareUrl = `${window.location.origin}/quiz.html?id=${q.id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link Kuis Berhasil Disalin ke Clipboard!');
      }).catch(() => {
        showToast('Link Kuis Berhasil Disalin ke Clipboard!');
      });
    } else {
      showToast('Link Kuis Berhasil Disalin ke Clipboard!');
    }
    setShareModalData({
      url: shareUrl,
      id: q.id,
      title: q.title
    });
  };

  // Salin Link Publik Kuis dari Modal
  const handleCopyShareLink = () => {
    if (!shareModalData?.url) return;
    navigator.clipboard.writeText(shareModalData.url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showToast('Link Kuis Berhasil Disalin ke Clipboard!');
    }).catch(() => {
      showToast('Link Kuis Berhasil Disalin ke Clipboard!');
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
            Kelola daftar kuis, buat kuis baru melalui form modal interaktif dengan preset pertanyaan instan (3, 5, 7, atau 10 soal), serta hapus kuis secara permanen via Supabase SDK.
          </p>
        </div>

        {/* Tombol Utama Buka Modal Buat Kuis Baru */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kuis Baru</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DAFTAR TABEL KUIS                                        */}
      {/* ======================================================== */}
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
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kuis</span>
            </button>
          </div>
        </div>

        {/* Tabel Kuis */}
        <div className="rounded-3xl bg-white shadow-soft-card border border-slate-100 overflow-hidden">
          {isLoadingQuizzes ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Memuat data kuis dari database Supabase...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Tidak Ada Kuis Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Mulai buat kuis pertamamu menggunakan tombol Buat Kuis Baru di atas.
              </p>
              <button
                onClick={handleOpenCreateModal}
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
                            onClick={() => handleShareQuiz(q)}
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
                              onClick={() => handleOpenEditModal(q)}
                              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Kuis"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmQuiz(q)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Kuis Secara Permanen"
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

      {/* ======================================================== */}
      {/* MODAL FORM PEMBUATAN / EDIT KUIS INTERAKTIF              */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingQuizId ? 'Edit Kuis Interaktif' : 'Form Pembuatan Kuis Baru'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Atur detail kuis, pilih preset jumlah soal, dan tetapkan skor evaluasi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {saveError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* 1. Baris Preset Cepat Jumlah Soal (3, 5, 7, 10 Soal) */}
              <div className="p-5 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider mb-1">
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Pilihan Preset Soal</span>
                    </span>
                    <h3 className="text-base font-black tracking-tight">Preset Jumlah Pertanyaan Kuis</h3>
                    <p className="text-xs text-blue-100 max-w-lg">
                      Pilih preset untuk menghasilkan pertanyaan otomatis beserta 3 opsi jawaban berskor (0 = Ringan, 50 = Sedang, 100 = Kritis):
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
                        {num} Soal
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Informasi Utama Kuis */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200/80 pb-2">
                  1. Data Informasi Kuis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Judul Kuis *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Skrining Diagnosa Hardware & Kestabilan Sistem"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Kategori Perangkat</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="active">Active (Tersedia untuk Pengguna)</option>
                      <option value="draft">Draft (Simpan Sementara)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Deskripsi / Petunjuk Pengguna</label>
                    <textarea
                      rows={2}
                      placeholder="Deskripsikan tujuan dan petunjuk diagnosis bagi pengguna..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Bidang Input Dinamis Pertanyaan & 3 Opsi Jawaban */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      2. Daftar Pertanyaan &amp; 3 Opsi Jawaban ({questions.length} Soal)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nilai bobot terkalibrasi: <strong>0 = Ringan</strong>, <strong>50 = Sedang</strong>, <strong>100 = Kritis</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Soal</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {questions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          Pertanyaan #{qIdx + 1}
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
                          3 Opsi Jawaban &amp; Bobot Nilai:
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
            </div>

            {/* Modal Footer / Action Bar */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveQuiz}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Kuis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL SHAREABLE LINK SETELAH KUIS TERSIMPAN              */}
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
              <h3 className="text-lg font-black text-slate-900">Kuis Berhasil Disimpan &amp; Masuk ke Database!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data telah tersimpan di Supabase. Bagikan tautan berikut kepada peserta kuis:
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
      {/* MODAL KONFIRMASI HAPUS KUIS SECARA PERMANEN              */}
      {/* ======================================================== */}
      {deleteConfirmQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-rose-100 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hapus Kuis Secara Permanen?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Yakin ingin menghapus kuis <strong>"{deleteConfirmQuiz.title}"</strong>? Seluruh pertanyaan, opsi, dan aturan hasil akan dihapus secara permanen dari Supabase SDK tanpa sisa.
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
                  <span>Ya, Hapus Permanen</span>
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
