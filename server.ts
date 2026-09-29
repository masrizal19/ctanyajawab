import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory relational data store mirroring schema.sql
let quizzes = [
  {
    id: 1,
    title: 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
    slug: 'skrining-diagnosis-kerusakan-elektronik',
    description: 'Jawab 10 pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat.',
    category: 'Laptop & PC',
    thumbnail: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    rating: 4.95,
    est_time: '3 Menit',
    total_participants: 5120,
    created_at: '2026-09-01 10:00:00'
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
    created_at: '2026-09-05 14:30:00'
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
    created_at: '2026-09-10 09:15:00'
  }
];

let questions = [
  // Quiz 1 Questions (10 Electronic Device Diagnosis Questions)
  {
    id: 1,
    quiz_id: 1,
    question_text: 'Bagaimana kondisi perangkat saat tombol daya (Power) ditekan?',
    image_url: null,
    sort_order: 1
  },
  {
    id: 2,
    quiz_id: 1,
    question_text: 'Apakah perangkat kamu sering terasa sangat panas atau mengeluarkan suara kipas/mesin yang bising saat digunakan?',
    image_url: null,
    sort_order: 2
  },
  {
    id: 3,
    quiz_id: 1,
    question_text: 'Bagaimana kecepatan respon perangkat saat membuka beberapa aplikasi secara bersamaan?',
    image_url: null,
    sort_order: 3
  },
  {
    id: 4,
    quiz_id: 1,
    question_text: 'Apakah ada masalah pada tampilan layar (LCD/Display) kamu?',
    image_url: null,
    sort_order: 4
  },
  {
    id: 5,
    quiz_id: 1,
    question_text: 'Bagaimana performa baterai dan proses pengisian daya (charging) saat ini?',
    image_url: null,
    sort_order: 5
  },
  {
    id: 6,
    quiz_id: 1,
    question_text: 'Apakah kamu sering mengalami error saat menyimpan file atau booting terasa sangat lambat (lebih dari 3-5 menit)?',
    image_url: null,
    sort_order: 6
  },
  {
    id: 7,
    quiz_id: 1,
    question_text: 'Bagaimana status fungsi port (USB/Type-C/HDMI) dan koneksi nirkabel (Wi-Fi/Bluetooth)?',
    image_url: null,
    sort_order: 7
  },
  {
    id: 8,
    quiz_id: 1,
    question_text: 'Jika kendala terjadi pada Printer, bagaimana hasil cetakan atau pergerakan kertasnya?',
    image_url: null,
    sort_order: 8
  },
  {
    id: 9,
    quiz_id: 1,
    question_text: 'Apakah perangkat pernah terjatuh, tertindih beban berat, atau terkena cipratan air baru-baru ini?',
    image_url: null,
    sort_order: 9
  },
  {
    id: 10,
    quiz_id: 1,
    question_text: 'Apakah perangkat kamu sering memunculkan iklan pop-up tidak dikenal atau aplikasi menutup sendiri secara paksa?',
    image_url: null,
    sort_order: 10
  },

  // Quiz 2 Questions (HP / Smartphone)
  {
    id: 11,
    quiz_id: 2,
    question_text: 'Berapa persen penurunan kapasitas baterai HP kamu dalam waktu 1 jam pemakaian normal?',
    image_url: null,
    sort_order: 1
  },
  {
    id: 12,
    quiz_id: 2,
    question_text: 'Apakah permukaan layar sentuh (touchscreen) memiliki deadzone atau ghost touch?',
    image_url: null,
    sort_order: 2
  },

  // Quiz 3 Questions (Printer & Periferal)
  {
    id: 13,
    quiz_id: 3,
    question_text: 'Apakah lampu indikator oranye/merah printer sering berkedip saat mencetak dokumen?',
    image_url: null,
    sort_order: 1
  },
  {
    id: 14,
    quiz_id: 3,
    question_text: 'Bagaimana kondisi aliran tinta pada selang dan printhead saat pengujian?',
    image_url: null,
    sort_order: 2
  }
];

let options = [
  // Q1 (Power & Daya)
  { id: 1, question_id: 1, option_text: 'Nyala normal dan langsung masuk ke sistem/layar utama.', score_value: 0, result_code: 'RINGAN' },
  { id: 2, question_id: 1, option_text: 'Lampu indikator menyala tetapi layar gelap atau butuh beberapa kali tekan.', score_value: 50, result_code: 'SEDANG' },
  { id: 3, question_id: 1, option_text: 'Mati total, tidak ada respon lampu indikator maupun suara kipas/mesin.', score_value: 100, result_code: 'BERAT' },

  // Q2 (Suhu & Kipas/Overheating)
  { id: 4, question_id: 2, option_text: 'Suhu normal dan suara mesin/kipas sangat hening.', score_value: 0, result_code: 'RINGAN' },
  { id: 5, question_id: 2, option_text: 'Agak hangat dan kipas berputar kencang hanya saat membuka aplikasi berat.', score_value: 50, result_code: 'SEDANG' },
  { id: 6, question_id: 2, option_text: 'Sangat panas (overheat), sering mati mendadak, atau mengeluarkan bunyi aneh/bising.', score_value: 100, result_code: 'BERAT' },

  // Q3 (Performa & Respon Sistem)
  { id: 7, question_id: 3, option_text: 'Lancar dan responsif tanpa kendala.', score_value: 0, result_code: 'RINGAN' },
  { id: 8, question_id: 3, option_text: 'Sering mengalami lag/freeze ringan beberapa detik.', score_value: 50, result_code: 'SEDANG' },
  { id: 9, question_id: 3, option_text: "Sering mengalami 'Not Responding', Crash, Blue Screen (BSOD), atau Restarts sendiri.", score_value: 100, result_code: 'BERAT' },

  // Q4 (Layar & Tampilan Visual / HP & Laptop)
  { id: 10, question_id: 4, option_text: 'Tampilan jernih, normal, dan tidak ada kendala.', score_value: 0, result_code: 'RINGAN' },
  { id: 11, question_id: 4, option_text: 'Ada garis tipis, flickering (berkedip), atau touchscreen/layar kadang tidak merespon.', score_value: 50, result_code: 'SEDANG' },
  { id: 12, question_id: 4, option_text: 'Layar retak/pecah, bergaris parah, ada ws (white spot), atau mati (black screen).', score_value: 100, result_code: 'BERAT' },

  // Q5 (Baterai & Pengisian Daya / HP & Laptop)
  { id: 13, question_id: 5, option_text: 'Baterai awet dan mengisi daya dengan lancar.', score_value: 0, result_code: 'RINGAN' },
  { id: 14, question_id: 5, option_text: 'Baterai cepat habis (boros) atau harus terus di-cas agar tidak mati.', score_value: 50, result_code: 'SEDANG' },
  { id: 15, question_id: 5, option_text: 'Baterai kembung, tidak bisa di-cas sama sekali, atau indikator persen melonjak drastis.', score_value: 100, result_code: 'BERAT' },

  // Q6 (Penyimpanan & File System)
  { id: 16, question_id: 6, option_text: 'Proses boot cepat dan penyimpanan berfungsi normal.', score_value: 0, result_code: 'RINGAN' },
  { id: 17, question_id: 6, option_text: 'Booting agak lambat dan memori internal/harddisk hampir penuh.', score_value: 50, result_code: 'SEDANG' },
  { id: 18, question_id: 6, option_text: "Sering muncul pesan 'Disk Error', file corrupt, atau drive tidak terbaca.", score_value: 100, result_code: 'BERAT' },

  // Q7 (Konektivitas Wi-Fi / Bluetooth / Port USB)
  { id: 19, question_id: 7, option_text: 'Semua port dan koneksi nirkabel berfungsi dengan baik.', score_value: 0, result_code: 'RINGAN' },
  { id: 20, question_id: 7, option_text: 'Wi-Fi sering terputus sendiri atau salah satu port tidak bisa mendeteksi perangkat.', score_value: 50, result_code: 'SEDANG' },
  { id: 21, question_id: 7, option_text: 'Seluruh koneksi Wi-Fi/Bluetooth mati total dan port tidak memberikan daya.', score_value: 100, result_code: 'BERAT' },

  // Q8 (Pencetakan & Mekanikal khusus Printer)
  { id: 22, question_id: 8, option_text: 'Hasil cetak tajam, bersih, dan tidak ada kendala mekanik (Tidak pakai printer = pilih opsi ini).', score_value: 0, result_code: 'RINGAN' },
  { id: 23, question_id: 8, option_text: 'Hasil cetak bergaris, warna pudar, atau sering mengalami Paper Jam ringan.', score_value: 50, result_code: 'SEDANG' },
  { id: 24, question_id: 8, option_text: 'Tinta tidak keluar sama sekali, printer Blink Error (lampu merah berkedip), atau menarik kertas berantakan.', score_value: 100, result_code: 'BERAT' },

  // Q9 (Kondisi Fisik & Paparan Cairan/Benturan)
  { id: 25, question_id: 9, option_text: 'Tidak pernah, perangkat dirawat dengan baik.', score_value: 0, result_code: 'RINGAN' },
  { id: 26, question_id: 9, option_text: 'Pernah terbentur ringan atau terkena sedikit cipratan air tetapi langsung dikeringkan.', score_value: 50, result_code: 'SEDANG' },
  { id: 27, question_id: 9, option_text: 'Pernah jatuh keras, masuk/tercelup air, atau casing fisik mengalami keretakan parah.', score_value: 100, result_code: 'BERAT' },

  // Q10 (Sistem Operasi & Software/Viruses)
  { id: 28, question_id: 10, option_text: 'Bersih dari iklan dan sistem berjalan stabil.', score_value: 0, result_code: 'RINGAN' },
  { id: 29, question_id: 10, option_text: 'Kadang muncul pop-up browser atau ada notifikasi sistem yang mencurigakan.', score_value: 50, result_code: 'SEDANG' },
  { id: 30, question_id: 10, option_text: 'Terindikasi virus/malware parah, aplikasi utama tidak bisa dibuka, atau OS tidak bisa booting.', score_value: 100, result_code: 'BERAT' },

  // Quiz 2 Options (HP)
  { id: 31, question_id: 11, option_text: 'Kurang dari 10% (Baterai Sangat Sehat)', score_value: 0, result_code: 'RINGAN' },
  { id: 32, question_id: 11, option_text: 'Lebih dari 30% dalam 1 jam (Boros / Drop)', score_value: 100, result_code: 'BERAT' },
  { id: 33, question_id: 12, option_text: 'Semua sudut layar merespon sentuhan dengan presisi', score_value: 0, result_code: 'RINGAN' },
  { id: 34, question_id: 12, option_text: 'Ada area yang tidak merespon atau mencet-mencet sendiri', score_value: 100, result_code: 'BERAT' },

  // Quiz 3 Options (Printer)
  { id: 35, question_id: 13, option_text: 'Hanya lampu hijau menyala tenang (Ready)', score_value: 0, result_code: 'RINGAN' },
  { id: 36, question_id: 13, option_text: 'Lampu oranye berkedip berkala (Waste Ink / Paper Jam)', score_value: 100, result_code: 'BERAT' },
  { id: 37, question_id: 14, option_text: 'Tinta mengalir sempurna dan nozzle test penuh', score_value: 0, result_code: 'RINGAN' },
  { id: 38, question_id: 14, option_text: 'Tinta putus-putus atau selang masuk angin', score_value: 100, result_code: 'BERAT' }
];

let resultRules: any[] = [
  // Quiz 1 Rules (Sistem Skrining & Diagnosis Kerusakan Perangkat Elektronik - Bayes Percentage Scale 0% - 100%)
  // 1. KATEGORI 1: SKOR 0% - 35% (Ringan)
  {
    id: 1,
    quiz_id: 1,
    result_code: 'HARDWARE_HEALTHY',
    title: 'Perangkat Optimal / Kendala Sangat Ringan',
    description: 'Perangkat kamu secara umum berada dalam kondisi sehat. Kendala yang dirasakan kemungkinan besar disebabkan oleh penumpukan file temporary, memori penuh, atau butuh update driver.',
    badge: 'Kondisi Baik / Kendala Ringan',
    badge_color: '#22C55E',
    image_url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=80',
    min_score: 0,
    max_score: 35,
    strengths: ['Daya & Power Stabil', 'Suhu Normal', 'Hardware Intak'],
    recommendation: 'Lakukan perawatan rutin software dan pembersihan berkala.',
    actionable_advice: [
      'Lakukan pembersihan file cache/temporary dan uninstal aplikasi yang tidak digunakan.',
      'Lakukan update OS dan Driver perangkat secara berkala.',
      'Jaga sirkulasi udara perangkat dan hindari menggunakan laptop di atas kasur/bantal.'
    ]
  },

  // 2. KATEGORI 2: SKOR 36% - 70% (Menengah)
  {
    id: 2,
    quiz_id: 1,
    result_code: 'HARDWARE_MODERATE',
    title: 'Indikasi Kerusakan Menengah (Perlu Perawatan / Upgrade)',
    description: 'Terdeteksi adanya penurunan performa hardware atau masalah pada komponen pendukung (baterai, pasta thermal, kotoran pada cartridge/printer, atau sektor penyimpanan).',
    badge: 'Perlu Perawatan / Upgrade',
    badge_color: '#EAB308',
    image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80',
    min_score: 36,
    max_score: 70,
    strengths: ['Sistem Masih Beroperasi', 'Komponen Utama Belum Rusak Permanen'],
    recommendation: 'Perlu tindakan servis preventif dan peningkatan kapasitas sebelum terjadi kegagalan sistem permanen.',
    actionable_advice: [
      'Lakukan servis berkala seperti pembersihan debu bagian dalam dan penggantian pasta thermal CPU/GPU.',
      'Pertimbangkan untuk melakukan upgrade SSD atau penambahan RAM jika sistem terasa lambat.',
      "Jika terjadi kendala printer, lakukan proses 'Head Cleaning' via software bawaan."
    ]
  },

  // 3. KATEGORI 3: SKOR 71% - 100% (Kritis)
  {
    id: 3,
    quiz_id: 1,
    result_code: 'HARDWARE_CRITICAL',
    title: 'Kerusakan Komponen Utama / Kritis',
    description: 'Terindikasi adanya kerusakan serius pada komponen utama hardware (seperti Motherboard, IC Power, LCD/Display, Baterai Rusak Total, atau Head Printer Buntu/Rusak).',
    badge: 'Kerusakan Kritis / Servis Segera',
    badge_color: '#EF4444',
    image_url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80',
    min_score: 71,
    max_score: 100,
    strengths: ['Identifikasi Masalah Jelas'],
    recommendation: 'Hentikan penggunaan aktif dan segera lakukan backup data sebelum pemeriksaan teknis mendalam.',
    actionable_advice: [
      'Segera lakukan backup data penting kamu ke cloud atau penyimpanan eksternal jika perangkat masih bisa menyala.',
      'Hentikan penggunaan jika perangkat mengalami overheating ekstrem atau baterai kembung untuk mencegah korsleting.',
      'Bawa perangkat ke pusat perbaikan resmi (Service Center) atau teknisi profesional untuk pengecekan jalur komponen & penggantian sparepart.'
    ]
  },

  // Quiz 2 Rules (HP / Smartphone - Skala 0% - 100%)
  {
    id: 4,
    quiz_id: 2,
    result_code: 'HP_HEALTHY',
    title: 'Smartphone Sehat & Siap Pakai',
    description: 'Kondisi modul baterai dan layar sentuh masih dalam rentang standar operasional.',
    badge: 'Kondisi Prima',
    badge_color: '#22C55E',
    image_url: null,
    min_score: 0,
    max_score: 50,
    actionable_advice: [
      'Gunakan adaptor charger original bersertifikasi.',
      'Hindari menggunakan ponsel saat bermain game berat sambil mengecas.'
    ]
  },
  {
    id: 5,
    quiz_id: 2,
    result_code: 'HP_WARNING',
    title: 'Indikasi Kerusakan Cell Baterai / Touchscreen',
    description: 'Perlu kalibrasi baterai atau penggantian modul LCD jika ghost touch berulang.',
    badge: 'Perlu Servis',
    badge_color: '#EF4444',
    image_url: null,
    min_score: 51,
    max_score: 100,
    actionable_advice: [
      'Segera ganti baterai jika casing belakang mulai terdorong renggang.',
      'Lakukan pengetesan layar melalui menu dialer teknisi (*#0*#).'
    ]
  },

  // Quiz 3 Rules (Printer & Periferal - Skala 0% - 100%)
  {
    id: 6,
    quiz_id: 3,
    result_code: 'PRINTER_NORMAL',
    title: 'Printer Operasional Normal',
    description: 'Head cetak dan mekanikal penarik kertas berfungsi tanpa hambatan.',
    badge: 'Siap Cetak',
    badge_color: '#22C55E',
    image_url: null,
    min_score: 0,
    max_score: 50,
    actionable_advice: [
      'Cetak minimal 1 lembar halaman warna per minggu agar printhead tidak mengering.',
      'Gunakan kertas berkualitas standar 70-80 gsm.'
    ]
  },
  {
    id: 7,
    quiz_id: 3,
    result_code: 'PRINTER_SERVICE',
    title: 'Perlu Servis Mekanikal / Pembersihan Head',
    description: 'Terindikasi adanya endapan tinta atau counter absorber printer hampir penuh.',
    badge: 'Servis Segera',
    badge_color: '#EF4444',
    image_url: null,
    min_score: 51,
    max_score: 100,
    actionable_advice: [
      'Jalankan Deep Cleaning atau Nozzle Check via utility printer.',
      'Periksa apakah ada benda asing atau potongan kertas tersangkut di roller.'
    ]
  }
];

// In-memory submissions store
let userResponses: any[] = [];

// ==========================================
// REST API ENDPOINTS
// ==========================================

// GET /api/quizzes (supports optional ?category and ?search)
app.get('/api/quizzes', (req: Request, res: Response) => {
  const category = (req.query.category as string || '').trim();
  const search = (req.query.search as string || '').toLowerCase().trim();

  let filtered = quizzes.filter(q => q.status === 'active');

  if (category && category.toLowerCase() !== 'semua') {
    filtered = filtered.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(q => 
      q.title.toLowerCase().includes(search) || 
      q.description.toLowerCase().includes(search)
    );
  }

  // Include question counts
  const enriched = filtered.map(q => {
    const qCount = questions.filter(item => item.quiz_id === q.id).length;
    return {
      ...q,
      total_questions: qCount
    };
  });

  // Unique categories
  const categoriesCount = quizzes.reduce((acc: any, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesList = Object.keys(categoriesCount).map(cat => ({
    category: cat,
    count: categoriesCount[cat]
  }));

  res.json({
    success: true,
    message: 'Daftar kuis berhasil dimuat.',
    timestamp: new Date().toISOString(),
    data: {
      total: enriched.length,
      categories: categoriesList,
      quizzes: enriched
    }
  });
});

// GET /api/get-quiz (alias for public quiz loading: ?id=1 or ?slug=...)
app.get('/api/get-quiz', (req: Request, res: Response) => {
  const idParam = req.query.id ? parseInt(req.query.id as string, 10) : null;
  const slugParam = req.query.slug as string;

  const quiz = quizzes.find(q => (idParam && q.id === idParam) || (slugParam && q.slug === slugParam));

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Kuis tidak ditemukan atau belum aktif.',
      data: null
    });
  }

  const quizQuestions = questions
    .filter(q => q.quiz_id === quiz.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(q => {
      const qOptions = options
        .filter(opt => opt.question_id === q.id)
        .map(opt => ({
          id: opt.id,
          option_text: opt.option_text
          // Note: score_value and result_code hidden from public response for quiz security
        }));
      return {
        id: q.id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        image_url: q.image_url,
        sort_order: q.sort_order,
        options: qOptions
      };
    });

  res.json({
    success: true,
    message: 'Data kuis berhasil dimuat.',
    timestamp: new Date().toISOString(),
    data: {
      quiz,
      questions: quizQuestions
    }
  });
});

// GET /api/quiz-detail (supports ?id=1 or ?slug=...)
app.get('/api/quiz-detail', (req: Request, res: Response) => {
  const idParam = req.query.id ? parseInt(req.query.id as string, 10) : null;
  const slugParam = req.query.slug as string;

  const quiz = quizzes.find(q => (idParam && q.id === idParam) || (slugParam && q.slug === slugParam));

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Kuis tidak ditemukan atau belum aktif.',
      data: null
    });
  }

  const quizQuestions = questions
    .filter(q => q.quiz_id === quiz.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(q => {
      const qOptions = options
        .filter(opt => opt.question_id === q.id)
        .map(opt => ({
          id: opt.id,
          option_text: opt.option_text,
          score_value: opt.score_value,
          result_code: opt.result_code
        }));
      return {
        id: q.id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        image_url: q.image_url,
        sort_order: q.sort_order,
        options: qOptions
      };
    });

  res.json({
    success: true,
    message: 'Detail kuis dan pertanyaan berhasil dimuat.',
    timestamp: new Date().toISOString(),
    data: {
      quiz,
      questions: quizQuestions
    }
  });
});

// ==========================================
// BAYESIAN DIAGNOSTIC ENGINE HELPER
// ==========================================
function calculateBayesScore(detailedAnswers: any[]) {
  const totalQuestions = detailedAnswers.length;
  if (totalQuestions === 0) {
    return {
      severity_percentage: 0,
      confidence_percentage: 100,
      dominant_hypothesis: 'RINGAN' as const,
      posterior_probabilities: { ringan: 100, sedang: 0, kritis: 0 }
    };
  }

  // 1. Percentage Calculation: (Total Nilai Jawaban / Total Nilai Maksimal) * 100%
  const totalScoreSum = detailedAnswers.reduce((sum, a) => sum + (Number(a.score_value) || 0), 0);
  const maxPossibleScore = totalQuestions * 100;
  const severityPercentage = Math.min(100, Math.max(0, Math.round((totalScoreSum / maxPossibleScore) * 100)));

  // 2. Naive Bayes Posterior Probability Calculation P(H_k | E):
  // Hypotheses:
  // H1: Ringan / Normal (P(H1) = 1/3)
  // H2: Sedang / Kerusakan Menengah (P(H2) = 1/3)
  // H3: Kritis / Kerusakan Berat (P(H3) = 1/3)
  const prior = { ringan: 1 / 3, sedang: 1 / 3, kritis: 1 / 3 };

  // Conditional Likelihoods P(E_i | H_k):
  // Evidence:
  // - Opsi A (score 0 / Ringan): P(E|H1)=0.85, P(E|H2)=0.12, P(E|H3)=0.03
  // - Opsi B (score 50 / Sedang): P(E|H1)=0.15, P(E|H2)=0.70, P(E|H3)=0.15
  // - Opsi C (score 100 / Kritis): P(E|H1)=0.03, P(E|H2)=0.15, P(E|H3)=0.82
  let logLikelihood = {
    ringan: Math.log(prior.ringan),
    sedang: Math.log(prior.sedang),
    kritis: Math.log(prior.kritis)
  };

  detailedAnswers.forEach(ans => {
    const val = Number(ans.score_value) || 0;
    if (val <= 0) {
      logLikelihood.ringan += Math.log(0.85);
      logLikelihood.sedang += Math.log(0.12);
      logLikelihood.kritis += Math.log(0.03);
    } else if (val <= 50) {
      logLikelihood.ringan += Math.log(0.15);
      logLikelihood.sedang += Math.log(0.70);
      logLikelihood.kritis += Math.log(0.15);
    } else {
      logLikelihood.ringan += Math.log(0.03);
      logLikelihood.sedang += Math.log(0.15);
      logLikelihood.kritis += Math.log(0.82);
    }
  });

  // Softmax normalization
  const maxLog = Math.max(logLikelihood.ringan, logLikelihood.sedang, logLikelihood.kritis);
  const expR = Math.exp(logLikelihood.ringan - maxLog);
  const expS = Math.exp(logLikelihood.sedang - maxLog);
  const expK = Math.exp(logLikelihood.kritis - maxLog);
  const sumExp = expR + expS + expK;

  const postR = Math.round((expR / sumExp) * 100);
  const postS = Math.round((expS / sumExp) * 100);
  const postK = Math.max(0, 100 - (postR + postS));

  let dominantHypothesis: 'RINGAN' | 'SEDANG' | 'KRITIS' = 'RINGAN';
  let confidencePercentage = postR;

  if (severityPercentage >= 71 || (postK >= postR && postK >= postS)) {
    dominantHypothesis = 'KRITIS';
    confidencePercentage = postK;
  } else if (severityPercentage >= 36 || (postS >= postR && postS >= postK)) {
    dominantHypothesis = 'SEDANG';
    confidencePercentage = postS;
  } else {
    dominantHypothesis = 'RINGAN';
    confidencePercentage = postR;
  }

  return {
    severity_percentage: severityPercentage,
    confidence_percentage: confidencePercentage,
    dominant_hypothesis: dominantHypothesis,
    posterior_probabilities: {
      ringan: postR,
      sedang: postS,
      kritis: postK
    }
  };
}

// POST /api/submit-quiz
app.post('/api/submit-quiz', (req: Request, res: Response) => {
  const { quiz_id, answers, session_id, user_id } = req.body;
  const quizId = parseInt(quiz_id, 10);

  if (!quizId || !Array.isArray(answers) || answers.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'Data jawaban kosong atau quiz_id tidak valid.',
      data: null
    });
  }

  const quiz = quizzes.find(q => q.id === quizId && q.status === 'active');
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Kuis tidak ditemukan.',
      data: null
    });
  }

  // Quiz Engine Scoring & Dominant Code calculation
  const codeFrequency: Record<string, number> = {};
  const detailedAnswers: any[] = [];
  const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const item of answers) {
    const optionId = parseInt(item.option_id, 10);
    const dbOpt = options.find(o => o.id === optionId);
    if (dbOpt) {
      const dbQ = questions.find(q => q.id === dbOpt.question_id && q.quiz_id === quizId);
      if (dbQ) {
        if (dbOpt.result_code) {
          codeFrequency[dbOpt.result_code] = (codeFrequency[dbOpt.result_code] || 0) + 1;
        }

        const qOptions = options.filter(o => o.question_id === dbQ.id);
        const optIdx = qOptions.findIndex(o => o.id === dbOpt.id);
        const optionLetter = optIdx >= 0 ? letterMap[optIdx] : 'A';

        detailedAnswers.push({
          question_id: dbQ.id,
          question_text: dbQ.question_text,
          option_id: dbOpt.id,
          option_text: dbOpt.option_text,
          score_value: dbOpt.score_value,
          result_code: dbOpt.result_code,
          selected_option_letter: optionLetter
        });
      }
    }
  }

  if (detailedAnswers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Jawaban yang dipilih tidak valid untuk kuis ini.',
      data: null
    });
  }

  // Calculate Bayesian Probability & Normalized Severity Percentage (0% - 100%)
  const bayes = calculateBayesScore(detailedAnswers);
  const totalScore = bayes.severity_percentage;

  // Determine dominant code
  let dominantCode: string | null = null;
  let maxCount = -1;
  for (const [code, count] of Object.entries(codeFrequency)) {
    if (count > maxCount) {
      maxCount = count;
      dominantCode = code;
    }
  }

  // Find matching result rule based on percentage scale (0-35, 36-70, 71-100)
  let rule = resultRules.find(r => r.quiz_id === quizId && totalScore >= r.min_score && totalScore <= r.max_score);
  if (!rule && dominantCode) {
    rule = resultRules.find(r => r.quiz_id === quizId && r.result_code === dominantCode);
  }
  if (!rule) {
    rule = resultRules.find(r => r.quiz_id === quizId) || resultRules[0];
  }

  const responseId = userResponses.length + 1;
  const submissionRecord = {
    id: responseId,
    user_id: user_id || null,
    session_id: session_id || `sess_${Date.now()}`,
    quiz_id: quizId,
    quiz_title: quiz.title,
    quiz_category: quiz.category,
    final_result_id: rule.id,
    score: totalScore,
    total_score: totalScore,
    dominant_code: dominantCode,
    bayes: bayes,
    result: {
      id: rule.id,
      code: rule.result_code,
      title: rule.title,
      description: rule.description,
      badge: rule.badge,
      badge_color: rule.badge_color,
      image_url: rule.image_url,
      strengths: (rule as any).strengths || [],
      recommendation: (rule as any).recommendation || '',
      actionable_advice: (rule as any).actionable_advice || []
    },
    code_distribution: codeFrequency,
    total_answered: detailedAnswers.length,
    answers_payload: detailedAnswers,
    created_at: new Date().toISOString()
  };

  userResponses.unshift(submissionRecord);

  return res.json({
    success: true,
    message: 'Kuis berhasil diselesaikan dan dinilai secara presisi menggunakan metode Teorema Bayes (0% - 100%).',
    timestamp: new Date().toISOString(),
    data: submissionRecord
  });
});

// GET /api/history
app.get('/api/history', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Riwayat pengerjaan kuis berhasil dimuat.',
    data: {
      total: userResponses.length,
      history: userResponses.slice(0, 10)
    }
  });
});

// GET /api/config (Public client config providing VITE_ env variables)
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
    }
  });
});

// Serve static files from public folder (quiz.html, admin.html, js, etc.)
app.use(express.static(path.join(process.cwd(), 'public')));

// ==========================================
// ADMIN CMS REST API ENDPOINTS
// ==========================================

// POST /api/admin/login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if ((username === 'admin' && password === 'admin123') || (username === 'atw_admin' && password === 'admin123')) {
    return res.json({
      success: true,
      message: 'Login Administrator berhasil.',
      data: {
        token: 'admin_tok_' + Date.now(),
        user: {
          id: 1,
          name: 'Administrator CTW',
          role: 'admin'
        }
      }
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Kredensial salah. Gunakan username: admin dan password: admin123',
    data: null
  });
});

// POST /api/admin/logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sesi admin berhasil diakhiri.'
  });
});

// GET /api/admin/quizzes - List all quizzes including drafts
app.get('/api/admin/quizzes', (req: Request, res: Response) => {
  const adminQuizzes = quizzes.map(q => {
    const qCount = questions.filter(quest => quest.quiz_id === q.id).length;
    const pCount = userResponses.filter(r => r.quiz_id === q.id).length;
    return {
      ...q,
      total_questions: qCount,
      total_participants: (q.total_participants || 0) + pCount
    };
  });

  res.json({
    success: true,
    message: 'Daftar kuis untuk Admin berhasil dimuat.',
    data: {
      total: adminQuizzes.length,
      quizzes: adminQuizzes
    }
  });
});

// GET /api/admin/quiz/:id - Get full quiz details with questions, options, & result_rules for editing
app.get('/api/admin/quiz/:id', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id, 10);
  const quiz = quizzes.find(q => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Kuis tidak ditemukan.',
      data: null
    });
  }

  const quizQuestions = questions
    .filter(q => q.quiz_id === quiz.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(q => {
      const qOptions = options.filter(opt => opt.question_id === q.id);
      return {
        ...q,
        options: qOptions
      };
    });

  const quizRules = resultRules.filter(r => r.quiz_id === quiz.id);

  res.json({
    success: true,
    message: 'Data kuis lengkap berhasil dimuat.',
    data: {
      quiz,
      questions: quizQuestions,
      result_rules: quizRules
    }
  });
});

// POST /api/admin/save-quiz - Transactional save/update of quiz, questions, options, & result_rules
app.post('/api/admin/save-quiz', (req: Request, res: Response) => {
  const { quiz, questions: inputQuestions, result_rules: inputRules } = req.body;

  if (!quiz || !quiz.title) {
    return res.status(422).json({
      success: false,
      message: 'Judul kuis wajib diisi.',
      data: null
    });
  }

  let quizId = quiz.id ? parseInt(quiz.id, 10) : null;
  const slug = quiz.slug || quiz.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 1000);

  if (quizId) {
    // Update existing quiz
    const idx = quizzes.findIndex(q => q.id === quizId);
    if (idx !== -1) {
      quizzes[idx] = {
        ...quizzes[idx],
        title: quiz.title,
        slug,
        description: quiz.description || '',
        category: quiz.category || 'Umum',
        thumbnail: quiz.thumbnail || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
        status: quiz.status === 'draft' ? 'draft' : 'active'
      };
    }
  } else {
    // Create new quiz
    const nextId = quizzes.length > 0 ? Math.max(...quizzes.map(q => q.id)) + 1 : 1;
    quizId = nextId;
    quizzes.unshift({
      id: quizId,
      title: quiz.title,
      slug,
      description: quiz.description || '',
      category: quiz.category || 'Umum',
      thumbnail: quiz.thumbnail || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600',
      status: quiz.status === 'draft' ? 'draft' : 'active',
      rating: 5.0,
      est_time: `${Math.max(1, Math.ceil((inputQuestions?.length || 1) * 0.7))} Menit`,
      total_participants: 0,
      created_at: new Date().toISOString()
    });
  }

  // Remove existing questions and options for this quiz
  const oldQuestionIds = questions.filter(q => q.quiz_id === quizId).map(q => q.id);
  options = options.filter(opt => !oldQuestionIds.includes(opt.question_id));
  questions = questions.filter(q => q.quiz_id !== quizId);

  // Insert updated/new questions and options
  let nextQId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
  let nextOptId = options.length > 0 ? Math.max(...options.map(o => o.id)) + 1 : 1;

  if (Array.isArray(inputQuestions)) {
    inputQuestions.forEach((qItem: any, idx: number) => {
      const qId = nextQId++;
      questions.push({
        id: qId,
        quiz_id: quizId!,
        question_text: qItem.question_text || `Pertanyaan #${idx + 1}`,
        image_url: qItem.image_url || null,
        sort_order: idx + 1
      });

      if (Array.isArray(qItem.options)) {
        qItem.options.forEach((optItem: any) => {
          options.push({
            id: nextOptId++,
            question_id: qId,
            option_text: optItem.option_text || 'Pilihan',
            score_value: typeof optItem.score_value === 'number' ? optItem.score_value : parseInt(optItem.score_value || '10', 10),
            result_code: optItem.result_code || 'DEFAULT'
          });
        });
      }
    });
  }

  // Replace result rules
  resultRules = resultRules.filter(r => r.quiz_id !== quizId);
  let nextRuleId = resultRules.length > 0 ? Math.max(...resultRules.map(r => r.id)) + 1 : 1;

  if (Array.isArray(inputRules) && inputRules.length > 0) {
    inputRules.forEach((ruleItem: any) => {
      resultRules.push({
        id: nextRuleId++,
        quiz_id: quizId!,
        result_code: ruleItem.result_code || 'DEFAULT',
        title: ruleItem.title || 'Hasil Evaluasi',
        description: ruleItem.description || '',
        badge: ruleItem.badge || 'Hasil Kuis CTW',
        image_url: ruleItem.image_url || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500',
        min_score: typeof ruleItem.min_score === 'number' ? ruleItem.min_score : parseInt(ruleItem.min_score || '0', 10),
        max_score: typeof ruleItem.max_score === 'number' ? ruleItem.max_score : parseInt(ruleItem.max_score || '100', 10),
        strengths: Array.isArray(ruleItem.strengths) ? ruleItem.strengths : ['Konsistensi Logika', 'Fokus Solusi'],
        recommendation: ruleItem.recommendation || 'Terus kembangkan kemampuan analisis dan intuisi pemecahan masalah.'
      });
    });
  } else {
    // Default fallback rules if none provided
    resultRules.push(
      {
        id: nextRuleId++,
        quiz_id: quizId,
        result_code: 'EXCELLENT',
        title: 'Penguasaan Sangat Baik',
        description: 'Pemahamanmu terhadap aspek kuis ini berada di tingkat yang sangat tinggi.',
        badge: 'Tingkat Mahir',
        image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500',
        min_score: 60,
        max_score: 100,
        strengths: ['Pemahaman Mendalam', 'Akurasi Jawaban Tinggi'],
        recommendation: 'Pertahankan wawasanmu dan terus bagikan pengetahuan ini ke rekan tim.'
      },
      {
        id: nextRuleId++,
        quiz_id: quizId,
        result_code: 'DEVELOPING',
        title: 'Perlu Latihan Tambahan',
        description: 'Kamu sudah memiliki fondasi yang cukup baik, namun masih ada ruang untuk eksplorasi lebih jauh.',
        badge: 'Tingkat Berkembang',
        image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500',
        min_score: 0,
        max_score: 59,
        strengths: ['Kemauan Belajar', 'Potensi Berkembang'],
        recommendation: 'Pelajari kembali materi dasar dan coba ulangi kuis ini untuk meningkatkan skor.'
      }
    );
  }

  return res.json({
    success: true,
    message: 'Kuis, pertanyaan, opsi, dan aturan hasil berhasil disimpan secara transaksional.',
    data: {
      quiz_id: quizId,
      slug,
      share_url: `/quiz.html?id=${quizId}`
    }
  });
});

// DELETE /api/admin/quiz/:id or /api/admin/delete-quiz - Delete a quiz
const handleDeleteQuiz = (req: Request, res: Response) => {
  const quizId = parseInt(req.body?.quiz_id || req.body?.id || req.params?.id, 10);
  if (!quizId) {
    return res.status(400).json({
      status: 'error',
      success: false,
      message: 'ID Kuis (quiz_id) wajib disertakan.'
    });
  }

  const quizIndex = quizzes.findIndex(q => q.id === quizId);
  if (quizIndex === -1) {
    return res.status(404).json({
      status: 'error',
      success: false,
      message: 'Kuis tidak ditemukan atau sudah dihapus.'
    });
  }

  // 1. Delete associated user responses
  userResponses = userResponses.filter(r => r.quiz_id !== quizId);

  // 2. Delete associated result rules
  resultRules = resultRules.filter(r => r.quiz_id !== quizId);

  // 3. Delete options for all questions in this quiz
  const qIds = questions.filter(q => q.quiz_id === quizId).map(q => q.id);
  options = options.filter(opt => !qIds.includes(opt.question_id));

  // 4. Delete questions for this quiz
  questions = questions.filter(q => q.quiz_id !== quizId);

  // 5. Delete quiz itself
  quizzes.splice(quizIndex, 1);

  return res.json({
    status: 'success',
    success: true,
    message: 'Kuis dan seluruh data terkait berhasil dihapus.',
    data: { quiz_id: quizId }
  });
};

app.delete('/api/admin/quiz/:id', handleDeleteQuiz);
app.delete('/api/admin/delete-quiz', handleDeleteQuiz);
app.post('/api/admin/delete-quiz', handleDeleteQuiz);

// DELETE /api/admin/question/:id or /api/admin/delete-question - Delete a specific question
const handleDeleteQuestion = (req: Request, res: Response) => {
  const questionId = parseInt(req.body?.question_id || req.body?.id || req.params?.id, 10);
  if (!questionId) {
    return res.status(400).json({
      status: 'error',
      success: false,
      message: 'ID Pertanyaan (question_id) wajib disertakan.'
    });
  }

  const qIndex = questions.findIndex(q => q.id === questionId);
  if (qIndex === -1) {
    // If not found in in-memory list (might have been removed or unsaved), respond gracefully
    return res.json({
      status: 'success',
      success: true,
      message: 'Pertanyaan dan seluruh opsi terkait berhasil dihapus.',
      data: { question_id: questionId }
    });
  }

  // Delete all options belonging to this question
  options = options.filter(opt => opt.question_id !== questionId);
  // Delete the question
  questions.splice(qIndex, 1);

  return res.json({
    status: 'success',
    success: true,
    message: 'Pertanyaan dan seluruh opsi terkait berhasil dihapus.',
    data: { question_id: questionId }
  });
};

app.delete('/api/admin/question/:id', handleDeleteQuestion);
app.delete('/api/admin/delete-question', handleDeleteQuestion);
app.post('/api/admin/delete-question', handleDeleteQuestion);

// Start Express server and Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CTW Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
