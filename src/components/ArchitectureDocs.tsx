import React, { useState } from 'react';
import { Database, Server, Code2, Play, Copy, Check, Terminal, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'php' | 'api-tester' | 'deployment'>('sql');
  const [selectedPhpFile, setSelectedPhpFile] = useState<'db' | 'quizzes' | 'quiz-detail' | 'submit'>('submit');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // API Tester State
  const [testerEndpoint, setTesterEndpoint] = useState<'quizzes' | 'detail' | 'submit'>('quizzes');
  const [testerResponse, setTesterResponse] = useState<any>(null);
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerStatus, setTesterStatus] = useState<number | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runApiTest = async () => {
    setTesterLoading(true);
    setTesterStatus(null);
    try {
      let url = '/api/quizzes';
      let options: RequestInit = { method: 'GET' };

      if (testerEndpoint === 'detail') {
        url = '/api/quiz-detail?id=1';
      } else if (testerEndpoint === 'submit') {
        url = '/api/submit-quiz';
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: 1,
            session_id: 'test_session_' + Math.floor(Math.random() * 1000),
            answers: [
              { question_id: 1, option_id: 2 },
              { question_id: 2, option_id: 6 },
              { question_id: 3, option_id: 10 },
              { question_id: 4, option_id: 14 },
              { question_id: 5, option_id: 18 },
            ]
          })
        };
      }

      const res = await fetch(url, options);
      setTesterStatus(res.status);
      const data = await res.json();
      setTesterResponse(data);
    } catch (err: any) {
      setTesterResponse({ error: err.message });
      setTesterStatus(500);
    } finally {
      setTesterLoading(false);
    }
  };

  const sqlCode = `-- ===================================================
-- CTW (Correct Answer) - Database Schema DDL & Seed
-- Target Engine: MySQL 8.0+ / MariaDB 10.5+
-- ===================================================

CREATE DATABASE IF NOT EXISTS \`ctw_quiz_db\` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`ctw_quiz_db\`;

-- 1. Table: users
CREATE TABLE \`users\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(150) NOT NULL,
  \`password\` VARCHAR(255) NOT NULL COMMENT 'Bcrypt Hashed',
  \`role\` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_users_email\` (\`email\`),
  KEY \`idx_users_role\` (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: quizzes
CREATE TABLE \`quizzes\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`title\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`thumbnail\` VARCHAR(255) DEFAULT NULL,
  \`status\` ENUM('draft', 'active') NOT NULL DEFAULT 'active',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_quizzes_slug\` (\`slug\`),
  KEY \`idx_quizzes_category\` (\`category\`),
  KEY \`idx_quizzes_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: questions
CREATE TABLE \`questions\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`quiz_id\` INT UNSIGNED NOT NULL,
  \`question_text\` TEXT NOT NULL,
  \`image_url\` VARCHAR(255) DEFAULT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (\`id\`),
  KEY \`idx_questions_quiz_id\` (\`quiz_id\`),
  KEY \`idx_questions_sort_order\` (\`sort_order\`),
  CONSTRAINT \`fk_questions_quiz\` FOREIGN KEY (\`quiz_id\`) REFERENCES \`quizzes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: options
CREATE TABLE \`options\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`question_id\` INT UNSIGNED NOT NULL,
  \`option_text\` TEXT NOT NULL,
  \`score_value\` INT NOT NULL DEFAULT 0,
  \`result_code\` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_options_question_id\` (\`question_id\`),
  KEY \`idx_options_result_code\` (\`result_code\`),
  CONSTRAINT \`fk_options_question\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: result_rules
CREATE TABLE \`result_rules\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`quiz_id\` INT UNSIGNED NOT NULL,
  \`result_code\` VARCHAR(50) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`badge\` VARCHAR(100) NOT NULL,
  \`image_url\` VARCHAR(255) DEFAULT NULL,
  \`min_score\` INT NOT NULL DEFAULT 0,
  \`max_score\` INT NOT NULL DEFAULT 100,
  PRIMARY KEY (\`id\`),
  KEY \`idx_result_rules_quiz_id\` (\`quiz_id\`),
  KEY \`idx_result_rules_code\` (\`result_code\`),
  CONSTRAINT \`fk_result_rules_quiz\` FOREIGN KEY (\`quiz_id\`) REFERENCES \`quizzes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: user_responses
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
  PRIMARY KEY (\`id\`),
  KEY \`idx_user_responses_quiz_id\` (\`quiz_id\`),
  KEY \`idx_user_responses_final_result\` (\`final_result_id\`),
  CONSTRAINT \`fk_user_responses_quiz\` FOREIGN KEY (\`quiz_id\`) REFERENCES \`quizzes\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`fk_user_responses_result\` FOREIGN KEY (\`final_result_id\`) REFERENCES \`result_rules\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

  const phpDbCode = `<?php
// backend/db.php - Secure PDO Database Connection
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'atw_quiz_db';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

$dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
$pdoOptions = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false, // Native prepared statements prevent SQL Injection
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
];

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $pdoOptions);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

function sendJsonResponse(bool $success, string $message, $data = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success'   => $success,
        'message'   => $message,
        'timestamp' => date('c'),
        'data'      => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}`;

  const phpSubmitCode = `<?php
// backend/api/submit-quiz.php - Quiz Engine & Scoring Logic
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method Not Allowed', null, 405);
}

$rawInput = file_get_contents('php://input');
$payload  = json_decode($rawInput, true);

$quizId  = filter_var($payload['quiz_id'] ?? null, FILTER_VALIDATE_INT);
$answers = $payload['answers'] ?? [];

if (!$quizId || empty($answers)) {
    sendJsonResponse(false, 'Payload jawaban tidak valid', null, 422);
}

try {
    $pdo->beginTransaction();

    // 1. Ambil opsi yang dipilih & verifikasi kecocokan pertanyaan dari database
    $selectedOptionIds = array_column($answers, 'option_id');
    $inClause = implode(',', array_fill(0, count($selectedOptionIds), '?'));
    
    $sqlOpt = "
        SELECT o.id AS option_id, o.question_id, o.score_value, o.result_code, q.question_text
        FROM options o
        INNER JOIN questions q ON o.question_id = q.id
        WHERE o.id IN ($inClause) AND q.quiz_id = ?
    ";
    $stmtOpt = $pdo->prepare($sqlOpt);
    $stmtOpt->execute(array_merge($selectedOptionIds, [$quizId]));
    $dbOptions = $stmtOpt->fetchAll();

    // 2. CTW Scoring Engine: Hitung skor dan frekuensi kode dominan
    $totalScore = 0;
    $resultCodeFrequency = [];
    foreach ($dbOptions as $row) {
        $totalScore += (int)$row['score_value'];
        $code = trim((string)$row['result_code']);
        if ($code) {
            $resultCodeFrequency[$code] = ($resultCodeFrequency[$code] ?? 0) + 1;
        }
    }

    arsort($resultCodeFrequency);
    $dominantCode = array_key_first($resultCodeFrequency);

    // 3. Cocokkan dengan tabel result_rules
    $ruleStmt = $pdo->prepare("SELECT * FROM result_rules WHERE quiz_id = :quiz_id AND result_code = :code LIMIT 1");
    $ruleStmt->execute([':quiz_id' => $quizId, ':code' => $dominantCode]);
    $rule = $ruleStmt->fetch();

    if (!$rule) {
        // Fallback berdasarkan rentang skor
        $ruleScore = $pdo->prepare("SELECT * FROM result_rules WHERE quiz_id = :quiz_id AND :score BETWEEN min_score AND max_score LIMIT 1");
        $ruleScore->execute([':quiz_id' => $quizId, ':score' => $totalScore]);
        $rule = $ruleScore->fetch();
    }

    // 4. Simpan ke tabel user_responses
    $ins = $pdo->prepare("
        INSERT INTO user_responses (quiz_id, final_result_id, total_score, dominant_code, answers_payload, created_at)
        VALUES (:quiz_id, :rule_id, :score, :code, :payload, NOW())
    ");
    $ins->execute([
        ':quiz_id' => $quizId,
        ':rule_id' => $rule['id'] ?? null,
        ':score'   => $totalScore,
        ':code'    => $dominantCode,
        ':payload' => json_encode($dbOptions)
    ]);

    $pdo->commit();

    sendJsonResponse(true, 'Kuis berhasil dinilai.', [
        'score'         => $totalScore,
        'dominant_code' => $dominantCode,
        'result'        => $rule
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    sendJsonResponse(false, 'Gagal memproses: ' . $e->getMessage(), null, 500);
}`;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Arsitektur &amp; Dokumentasi Sistem CTW</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Arsitektur Backend, Database &amp; API Logic
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          Dokumentasi lengkap skema MySQL (DDL &amp; relasi Foreign Key), API Controller PHP PDO dengan prepared statements tahan SQL Injection, dan Live REST API Interactive Workbench.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'sql'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Skema Database MySQL (schema.sql)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('php')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'php'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Backend PHP PDO API</span>
        </button>

        <button
          onClick={() => setActiveSubTab('api-tester')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'api-tester'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Interactive REST API Tester</span>
        </button>

        <button
          onClick={() => setActiveSubTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'deployment'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Panduan XAMPP / Laragon</span>
        </button>
      </div>

      {/* Tab Content: SQL */}
      {activeSubTab === 'sql' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  DDL Skema Relasional (6 Tabel Utama)
                </h3>
                <p className="text-xs text-slate-500">
                  InnoDB Engine, utf8mb4_unicode_ci, Foreign Keys dengan CASCADE, dan Indexing teroptimasi.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(sqlCode, 'sql')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all shrink-0"
              >
                {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sql' ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            </div>

            <pre className="p-5 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{sqlCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab Content: PHP */}
      {activeSubTab === 'php' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPhpFile('submit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                selectedPhpFile === 'submit' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              api/submit-quiz.php (Scoring Engine)
            </button>
            <button
              onClick={() => setSelectedPhpFile('db')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                selectedPhpFile === 'db' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              backend/db.php (PDO &amp; Security)
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700">
                {selectedPhpFile === 'submit' ? 'backend/api/submit-quiz.php' : 'backend/db.php'}
              </span>
              <button
                onClick={() => copyToClipboard(selectedPhpFile === 'submit' ? phpSubmitCode : phpDbCode, 'php')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all"
              >
                {copiedKey === 'php' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Salin Kode</span>
              </button>
            </div>

            <pre className="p-5 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{selectedPhpFile === 'submit' ? phpSubmitCode : phpDbCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab Content: Interactive API Tester */}
      {activeSubTab === 'api-tester' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Live REST API Execution Sandbox
              </h3>
              <p className="text-xs text-slate-500">
                Uji langsung endpoint REST API CTW secara real-time dari browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={testerEndpoint}
                onChange={(e) => setTesterEndpoint(e.target.value as any)}
                className="px-4 py-2.5 rounded-xl bg-[#f1f5f9] border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="quizzes">GET /api/quizzes (Daftar Kuis)</option>
                <option value="detail">GET /api/quiz-detail?id=1 (Detail &amp; Opsi)</option>
                <option value="submit">POST /api/submit-quiz (Quiz Engine Calculation)</option>
              </select>

              <button
                onClick={runApiTest}
                disabled={testerLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{testerLoading ? 'Mengirim Request...' : 'Kirim Request'}</span>
              </button>

              {testerStatus && (
                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                  testerStatus >= 200 && testerStatus < 300
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  Status: {testerStatus} OK
                </span>
              )}
            </div>

            {testerResponse && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-mono font-bold text-slate-500">Response Body (JSON):</span>
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-96">
                  <code>{JSON.stringify(testerResponse, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Deployment Guide */}
      {activeSubTab === 'deployment' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">
              Panduan Deployment Lokal (XAMPP / Laragon)
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-600">Langkah 1: Siapkan Direktori Server</span>
                <p>
                  Buka folder web server lokamu:
                  <br />• XAMPP: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">C:\xampp\htdocs\atw\</code>
                  <br />• Laragon: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">C:\laragon\www\atw\</code>
                  <br />Salin folder <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">backend/</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">public/standalone/</code>, dan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">schema.sql</code> ke dalam folder tersebut.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-600">Langkah 2: Eksekusi SQL Schema</span>
                <p>
                  Buka phpMyAdmin di <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">http://localhost/phpmyadmin</code>, buat database bernama <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">atw_quiz_db</code>, lalu import file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">schema.sql</code>. Atau jalankan via terminal:
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs"><code>mysql -u root -p atw_quiz_db &lt; schema.sql</code></pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-600">Langkah 3: Konfigurasi Kredensial Database</span>
                <p>
                  Sesuaikan file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">backend/db.php</code> jika MySQL menggunakan password:
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs"><code>$dbUser = 'root';
$dbPass = ''; // Kosongkan jika default XAMPP</code></pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-600">Langkah 4: Akses Aplikasi &amp; Verifikasi API</span>
                <p>
                  Buka browser di <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">http://localhost/atw/standalone/</code> untuk memainkan kuis standalone, atau uji endpoint API di <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">http://localhost/atw/backend/api/quizzes.php</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
