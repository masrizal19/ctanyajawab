-- ===================================================
-- ATW (Answer to Wrong) - Database Schema DDL & Seed
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- Collation: utf8mb4_unicode_ci
-- ===================================================

CREATE DATABASE IF NOT EXISTS `atw_quiz_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `atw_quiz_db`;

-- Drop tables in reverse order of foreign key dependency
DROP TABLE IF EXISTS `user_responses`;
DROP TABLE IF EXISTS `result_rules`;
DROP TABLE IF EXISTS `options`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `quizzes`;
DROP TABLE IF EXISTS `admin_users`;
DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------
-- 1. Table: admin_users (Otentikasi CMS Admin Supabase SDK)
-- ---------------------------------------------------
CREATE TABLE `admin_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admin_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 2. Table: users
-- Menyimpan data akun pengguna dan role (admin/user)
-- ---------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt Hashed Password',
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 2. Table: quizzes
-- Menyimpan modul kuis, kategori, thumbnail, dan status
-- ---------------------------------------------------
CREATE TABLE `quizzes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `thumbnail` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('draft', 'active') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_quizzes_slug` (`slug`),
  KEY `idx_quizzes_category` (`category`),
  KEY `idx_quizzes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 3. Table: questions
-- Menyimpan pertanyaan kuis, gambar pendukung, dan urutan
-- ---------------------------------------------------
CREATE TABLE `questions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quiz_id` INT UNSIGNED NOT NULL,
  `question_text` TEXT NOT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_questions_quiz_id` (`quiz_id`),
  KEY `idx_questions_sort_order` (`sort_order`),
  CONSTRAINT `fk_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 4. Table: options
-- Menyimpan opsi jawaban, bobot/poin, dan kode hasil
-- ---------------------------------------------------
CREATE TABLE `options` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` INT UNSIGNED NOT NULL,
  `option_text` TEXT NOT NULL,
  `score_value` INT NOT NULL DEFAULT 0,
  `result_code` VARCHAR(50) DEFAULT NULL COMMENT 'Identifier kategori/tipe hasil misal TECH_DESIGNER',
  PRIMARY KEY (`id`),
  KEY `idx_options_question_id` (`question_id`),
  KEY `idx_options_result_code` (`result_code`),
  CONSTRAINT `fk_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 5. Table: quiz_result_rules (dan alias result_rules)
-- Aturan penentuan hasil akhir (berdasarkan score range atau result_code dominan)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS `quiz_result_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quiz_id` INT UNSIGNED NOT NULL,
  `scoreMin` INT NOT NULL DEFAULT 0,
  `scoreMax` INT NOT NULL DEFAULT 100,
  `resultCode` VARCHAR(50) NOT NULL,
  `badge` VARCHAR(100) NOT NULL,
  `resultTitle` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `recommendation` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_quiz_result_rules_quiz_id` (`quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `result_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quiz_id` INT UNSIGNED NOT NULL,
  `result_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `badge` VARCHAR(100) NOT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `min_score` INT NOT NULL DEFAULT 0,
  `max_score` INT NOT NULL DEFAULT 100,
  PRIMARY KEY (`id`),
  KEY `idx_result_rules_quiz_id` (`quiz_id`),
  KEY `idx_result_rules_code` (`result_code`),
  CONSTRAINT `fk_result_rules_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 6. Table: user_responses
-- Menyimpan log pengerjaan kuis, skor akhir, dan hasil dinamis
-- ---------------------------------------------------
CREATE TABLE `user_responses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT 'NULL jika guest user',
  `session_id` VARCHAR(100) DEFAULT NULL COMMENT 'Session identifier untuk guest',
  `quiz_id` INT UNSIGNED NOT NULL,
  `final_result_id` INT UNSIGNED DEFAULT NULL,
  `total_score` INT NOT NULL DEFAULT 0,
  `dominant_code` VARCHAR(50) DEFAULT NULL,
  `answers_payload` JSON DEFAULT NULL COMMENT 'Snapshot pilihan jawaban pengguna',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_responses_user_id` (`user_id`),
  KEY `idx_user_responses_session_id` (`session_id`),
  KEY `idx_user_responses_quiz_id` (`quiz_id`),
  KEY `idx_user_responses_final_result` (`final_result_id`),
  CONSTRAINT `fk_user_responses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_responses_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_responses_result` FOREIGN KEY (`final_result_id`) REFERENCES `result_rules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- SEED DATA / DUMMY DATA AWAL
-- ===================================================

-- 1. Insert Admin Users (Otentikasi CMS Supabase SDK)
INSERT INTO `admin_users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', 'admin123', 'admin'),
(2, 'atw_admin', 'admin123', 'admin');

-- 2. Insert Users (Password admin123 & user123 di-hash menggunakan BCRYPT)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Admin ATW', 'admin@atw.local', '$2y$10$wN9cW5r32P1B1x7yGjEbe.1xszK0XNfI7o7b0rYQj5H1y8O8OyeC6', 'admin'),
(2, 'Alen Gregory', 'alen@atw.local', '$2y$10$wN9cW5r32P1B1x7yGjEbe.1xszK0XNfI7o7b0rYQj5H1y8O8OyeC6', 'user');

-- 3. Insert Quizzes
INSERT INTO `quizzes` (`id`, `title`, `slug`, `description`, `category`, `thumbnail`, `status`) VALUES
(1, 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik', 'skrining-diagnosis-kerusakan-elektronik', 'Jawab 10 pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat.', 'Laptop & PC', 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80', 'active'),
(2, 'Diagnostik Kesehatan Baterai & Layar Smartphone', 'diagnostik-kesehatan-baterai-layar-hp', 'Pemeriksaan performa charging, degradasi cell baterai lithium, sensitivitas touchscreen, dan visual display pada HP Android & iOS.', 'HP / Smartphone', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80', 'active'),
(3, 'Deteksi Error Mekanikal & Cetak Printer', 'deteksi-error-mekanikal-cetak-printer', 'Identifikasi gejala Paper Jam, head cleaning cartridge buntu, blink counter error, dan koneksi kabel data/Wi-Fi printer kantor.', 'Printer & Periferal', 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&auto=format&fit=crop&q=80', 'active');

-- 3. Insert Questions for Quiz 1 (10 Pertanyaan Diagnosis Kerusakan)
INSERT INTO `questions` (`id`, `quiz_id`, `question_text`, `image_url`, `sort_order`) VALUES
(1, 1, 'Bagaimana kondisi perangkat saat tombol daya (Power) ditekan?', NULL, 1),
(2, 1, 'Apakah perangkat kamu sering terasa sangat panas atau mengeluarkan suara kipas/mesin yang bising saat digunakan?', NULL, 2),
(3, 1, 'Bagaimana kecepatan respon perangkat saat membuka beberapa aplikasi secara bersamaan?', NULL, 3),
(4, 1, 'Apakah ada masalah pada tampilan layar (LCD/Display) kamu?', NULL, 4),
(5, 1, 'Bagaimana performa baterai dan proses pengisian daya (charging) saat ini?', NULL, 5),
(6, 1, 'Apakah kamu sering mengalami error saat menyimpan file atau booting terasa sangat lambat (lebih dari 3-5 menit)?', NULL, 6),
(7, 1, 'Bagaimana status fungsi port (USB/Type-C/HDMI) dan koneksi nirkabel (Wi-Fi/Bluetooth)?', NULL, 7),
(8, 1, 'Jika kendala terjadi pada Printer, bagaimana hasil cetakan atau pergerakan kertasnya?', NULL, 8),
(9, 1, 'Apakah perangkat pernah terjatuh, tertindih beban berat, atau terkena cipratan air baru-baru ini?', NULL, 9),
(10, 1, 'Apakah perangkat kamu sering memunculkan iklan pop-up tidak dikenal atau aplikasi menutup sendiri secara paksa?', NULL, 10);

-- 4. Insert Options for Quiz 1 (Bayesian Likelihood Weights: 0%, 50%, 100%)
INSERT INTO `options` (`id`, `question_id`, `option_text`, `score_value`, `result_code`) VALUES
-- Q1
(1, 1, 'Nyala normal dan langsung masuk ke sistem/layar utama.', 0, 'RINGAN'),
(2, 1, 'Lampu indikator menyala tetapi layar gelap atau butuh beberapa kali tekan.', 50, 'SEDANG'),
(3, 1, 'Mati total, tidak ada respon lampu indikator maupun suara kipas/mesin.', 100, 'BERAT'),
-- Q2
(4, 2, 'Suhu normal dan suara mesin/kipas sangat hening.', 0, 'RINGAN'),
(5, 2, 'Agak hangat dan kipas berputar kencang hanya saat membuka aplikasi berat.', 50, 'SEDANG'),
(6, 2, 'Sangat panas (overheat), sering mati mendadak, atau mengeluarkan bunyi aneh/bising.', 100, 'BERAT'),
-- Q3
(7, 3, 'Lancar dan responsif tanpa kendala.', 0, 'RINGAN'),
(8, 3, 'Sering mengalami lag/freeze ringan beberapa detik.', 50, 'SEDANG'),
(9, 3, 'Sering mengalami \'Not Responding\', Crash, Blue Screen (BSOD), atau Restarts sendiri.', 100, 'BERAT'),
-- Q4
(10, 4, 'Tampilan jernih, normal, dan tidak ada kendala.', 0, 'RINGAN'),
(11, 4, 'Ada garis tipis, flickering (berkedip), atau touchscreen/layar kadang tidak merespon.', 50, 'SEDANG'),
(12, 4, 'Layar retak/pecah, bergaris parah, ada ws (white spot), atau mati (black screen).', 100, 'BERAT'),
-- Q5
(13, 5, 'Baterai awet dan mengisi daya dengan lancar.', 0, 'RINGAN'),
(14, 5, 'Baterai cepat habis (boros) atau harus terus di-cas agar tidak mati.', 50, 'SEDANG'),
(15, 5, 'Baterai kembung, tidak bisa di-cas sama sekali, atau indikator persen melonjak drastis.', 100, 'BERAT'),
-- Q6
(16, 6, 'Proses boot cepat dan penyimpanan berfungsi normal.', 0, 'RINGAN'),
(17, 6, 'Booting agak lambat dan memori internal/harddisk hampir penuh.', 50, 'SEDANG'),
(18, 6, 'Sering muncul pesan \'Disk Error\', file corrupt, atau drive tidak terbaca.', 100, 'BERAT'),
-- Q7
(19, 7, 'Semua port dan koneksi nirkabel berfungsi dengan baik.', 0, 'RINGAN'),
(20, 7, 'Wi-Fi sering terputus sendiri atau salah satu port tidak bisa mendeteksi perangkat.', 50, 'SEDANG'),
(21, 7, 'Seluruh koneksi Wi-Fi/Bluetooth mati total dan port tidak memberikan daya.', 100, 'BERAT'),
-- Q8
(22, 8, 'Hasil cetak tajam, bersih, dan tidak ada kendala mekanik (Tidak pakai printer = pilih opsi ini).', 0, 'RINGAN'),
(23, 8, 'Hasil cetak bergaris, warna pudar, atau sering mengalami Paper Jam ringan.', 50, 'SEDANG'),
(24, 8, 'Tinta tidak keluar sama sekali, printer Blink Error (lampu merah berkedip), atau menarik kertas berantakan.', 100, 'BERAT'),
-- Q9
(25, 9, 'Tidak pernah, perangkat dirawat dengan baik.', 0, 'RINGAN'),
(26, 9, 'Pernah terbentur ringan atau terkena sedikit cipratan air tetapi langsung dikeringkan.', 50, 'SEDANG'),
(27, 9, 'Pernah jatuh keras, masuk/tercelup air, atau casing fisik mengalami keretakan parah.', 100, 'BERAT'),
-- Q10
(28, 10, 'Bersih dari iklan dan sistem berjalan stabil.', 0, 'RINGAN'),
(29, 10, 'Kadang muncul pop-up browser atau ada notifikasi sistem yang mencurigakan.', 50, 'SEDANG'),
(30, 10, 'Terindikasi virus/malware parah, aplikasi utama tidak bisa dibuka, atau OS tidak bisa booting.', 100, 'BERAT');

-- 5. Insert Result Rules for Quiz 1 (Skala Persentase Bayes: 0% - 35%, 36% - 70%, 71% - 100%)
INSERT INTO `result_rules` (`id`, `quiz_id`, `result_code`, `title`, `description`, `badge`, `image_url`, `min_score`, `max_score`) VALUES
(1, 1, 'HARDWARE_HEALTHY', 'Perangkat Optimal / Kendala Sangat Ringan', 'Perangkat kamu secara umum berada dalam kondisi sehat. Kendala yang dirasakan kemungkinan besar disebabkan oleh penumpukan file temporary, memori penuh, atau butuh update driver.', 'Kondisi Baik / Kendala Ringan', 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=80', 0, 35),
(2, 1, 'HARDWARE_MODERATE', 'Indikasi Kerusakan Menengah (Perlu Perawatan / Upgrade)', 'Terdeteksi adanya penurunan performa hardware atau masalah pada komponen pendukung (baterai, pasta thermal, kotoran pada cartridge/printer, atau sektor penyimpanan).', 'Perlu Perawatan / Upgrade', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=80', 36, 70),
(3, 1, 'HARDWARE_CRITICAL', 'Kerusakan Komponen Utama / Kritis', 'Terindikasi adanya kerusakan serius pada komponen utama hardware (seperti Motherboard, IC Power, LCD/Display, Baterai Rusak Total, atau Head Printer Buntu/Rusak).', 'Kerusakan Kritis / Servis Segera', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=500&auto=format&fit=crop&q=80', 71, 100);

-- Questions & Options for Quiz 2 (Ritme Kerja)
INSERT INTO `questions` (`id`, `quiz_id`, `question_text`, `image_url`, `sort_order`) VALUES
(6, 2, 'Kapan energi kreatif dan ketajaman fokusmu biasanya berada di level puncak?', NULL, 1),
(7, 2, 'Bagaimana caramu merespon pesan darurat atau notifikasi tugas di tengah pengerjaan?', NULL, 2),
(8, 2, 'Lingkungan kerja seperti apa yang paling mendukung produktivitasmu?', NULL, 3);

INSERT INTO `options` (`id`, `question_id`, `option_text`, `score_value`, `result_code`) VALUES
(21, 6, 'Pagi buta sebelum dunia bangun, dalam suasana hening total', 30, 'DEEP_FOCUS_SOLO'),
(22, 6, 'Sesi sprint terstruktur berdurasi 25-50 menit dengan target spesifik', 30, 'SPRINT_TACTICIAN'),
(23, 6, 'Sore/malam hari saat bertukar pikiran interaktif bersama rekan tim', 30, 'COLLAB_CATALYST'),
(24, 7, 'Mematikan notifikasi dan baru membalas di jam jeda terjadwal (batching)', 35, 'DEEP_FOCUS_SOLO'),
(25, 7, 'Mencatatnya di daftar backlog lalu kembali fokus pada tugas saat ini', 35, 'SPRINT_TACTICIAN'),
(26, 7, 'Langsung merespon cepat agar tidak menahan kelancaran orang lain', 35, 'COLLAB_CATALYST'),
(27, 8, 'Ruang kerja tenang dengan pencahayaan hangat dan noise-cancelling headphone', 35, 'DEEP_FOCUS_SOLO'),
(28, 8, 'Meja terorganisir rapi dengan timer visual dan to-do list terurut', 35, 'SPRINT_TACTICIAN'),
(29, 8, 'Papan kolaborasi terbuka di mana ide bisa langsung didiskusikan', 35, 'COLLAB_CATALYST');

INSERT INTO `result_rules` (`id`, `quiz_id`, `result_code`, `title`, `description`, `badge`, `image_url`, `min_score`, `max_score`) VALUES
(5, 2, 'DEEP_FOCUS_SOLO', 'Asynchronous Deep Work Monk', 'Kamu memiliki kemampuan konsentrasi tingkat tinggi yang jarang terdistraksi. Nilai karyamu lahir dari perenungan mendalam dan eksekusi tanpa gangguan.', 'Zen Master of Deep Work', NULL, 70, 100),
(6, 2, 'SPRINT_TACTICIAN', 'Agile Pomodoro Sprint Specialist', 'Kamu sangat disiplin dengan pembagian waktu berbasis blok dan milestone terukur. Pendekatanmu menjamin konsistensi hasil harian tanpa burnout.', 'High Velocity Deliverer', NULL, 70, 100),
(7, 2, 'COLLAB_CATALYST', 'Dynamic Collaborative Catalyst', 'Kreativitasmu meledak saat bersinergi dengan manusia lain. Kamu adalah lem perekat tim yang menjaga ritme antusiasme dan komunikasi asinkron tetap hidup.', 'Synergy Amplifier', NULL, 70, 100);

-- ==============================================================================
-- SUPABASE POSTGRESQL MIGRATION & RLS POLICIES (Flexible String/Timestamp ID)
-- Jalankan skrip ini di Supabase SQL Editor jika menggunakan Supabase Postgres
-- ==============================================================================

-- 1. Tabel quizzes dengan tipe ID fleksibel (VARCHAR/TEXT)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    category VARCHAR(100) DEFAULT 'Umum',
    thumbnail TEXT,
    status VARCHAR(50) DEFAULT 'active',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    quiz_id VARCHAR(255) REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    image_url TEXT,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel options (atau quiz_question_options)
CREATE TABLE IF NOT EXISTS public.options (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    question_id BIGINT REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    score_value INT DEFAULT 0,
    result_code VARCHAR(50) DEFAULT 'DEFAULT'
);

-- 4. Tabel quiz_result_rules
CREATE TABLE IF NOT EXISTS public.quiz_result_rules (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    quiz_id VARCHAR(255) REFERENCES public.quizzes(id) ON DELETE CASCADE,
    result_code VARCHAR(100) DEFAULT 'DEFAULT',
    title VARCHAR(255) NOT NULL,
    badge VARCHAR(100) DEFAULT 'Hasil Kuis',
    description TEXT,
    recommendation TEXT,
    image_url TEXT,
    min_score INT DEFAULT 0,
    max_score INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel user_responses (Logging guest response)
CREATE TABLE IF NOT EXISTS public.user_responses (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    quiz_id VARCHAR(255),
    session_id VARCHAR(100),
    total_score INT DEFAULT 0,
    dominant_code VARCHAR(100),
    answers_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel site_settings (Pengaturan Identitas Website, Hero Banner, & Kontak)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'default',
    site_title VARCHAR(255) DEFAULT 'CTW - Correct Answer Interactive Platform',
    tagline VARCHAR(255) DEFAULT 'Platform Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
    meta_description TEXT DEFAULT 'Lakukan skrining interaktif kendala perangkat Laptop, PC, Smartphone, dan Printer secara cepat dan akurat dengan rekomendasi perbaikan profesional.',
    logo_url VARCHAR(500) DEFAULT '/shock.png',
    favicon_url VARCHAR(500) DEFAULT '/favicon.ico',
    hero_badge VARCHAR(255) DEFAULT 'Modul Skrining Terpopuler #1 CTW',
    hero_title VARCHAR(255) DEFAULT 'Skrining & Diagnosis Cepat Kerusakan Perangkat Elektronik',
    hero_subtitle TEXT DEFAULT 'Jawab pertanyaan mengenai kendala fisik, performa, atau indikator error pada Laptop, Komputer, HP, atau Printer milikmu. Sistem CTW akan menganalisis indikasi kerusakan dan memberikan saran perbaikan yang tepat.',
    contact_email VARCHAR(255) DEFAULT 'support@ctwinteractive.id',
    contact_phone VARCHAR(100) DEFAULT '+62 812-3456-7890',
    contact_address TEXT DEFAULT 'Gedung Cyber Tower Lt. 5, Jl. Rasuna Said No. 12, Jakarta Selatan 12950',
    footer_text VARCHAR(255) DEFAULT 'CTW • Correct Answer Interactive Diagnosis & Assessment Platform',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Setup Row Level Security (RLS) & Policies
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_result_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy Akses Baca Publik
DROP POLICY IF EXISTS "Public Read Quizzes" ON public.quizzes;
CREATE POLICY "Public Read Quizzes" ON public.quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Questions" ON public.quiz_questions;
CREATE POLICY "Public Read Questions" ON public.quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Options" ON public.options;
CREATE POLICY "Public Read Options" ON public.options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Result Rules" ON public.quiz_result_rules;
CREATE POLICY "Public Read Result Rules" ON public.quiz_result_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Responses" ON public.user_responses;
CREATE POLICY "Public Insert Responses" ON public.user_responses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Site Settings" ON public.site_settings;
CREATE POLICY "Public Read Site Settings" ON public.site_settings FOR SELECT USING (true);

-- Policy Admin / Anonymous Write (jika anonim diizinkan membuat kuis via CMS demo)
DROP POLICY IF EXISTS "Allow All Quizzes Write" ON public.quizzes;
CREATE POLICY "Allow All Quizzes Write" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Questions Write" ON public.quiz_questions;
CREATE POLICY "Allow All Questions Write" ON public.quiz_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Options Write" ON public.options;
CREATE POLICY "Allow All Options Write" ON public.options FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Rules Write" ON public.quiz_result_rules;
CREATE POLICY "Allow All Rules Write" ON public.quiz_result_rules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Site Settings Write" ON public.site_settings;
CREATE POLICY "Allow All Site Settings Write" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);


