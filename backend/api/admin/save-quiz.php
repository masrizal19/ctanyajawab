<?php
/**
 * ATW (Answer to Wrong) - Admin Save Quiz API
 * POST /api/admin/save-quiz.php
 * Menyimpan atau memperbarui Kuis, Pertanyaan, Opsi Jawaban, dan Result Rules
 * Terintegrasi dengan Database Transaction PDO (BEGIN TRANSACTION, COMMIT, ROLLBACK).
 */

require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method Not Allowed. Hanya menerima request POST.', null, 405);
}

$rawInput = file_get_contents('php://input');
$payload  = json_decode($rawInput, true);

if (!$payload || !isset($payload['quiz'])) {
    sendJsonResponse(false, 'Payload tidak valid atau data kuis tidak ditemukan.', null, 422);
}

$quizData     = $payload['quiz'];
$questionsData = $payload['questions'] ?? [];
$rulesData     = $payload['result_rules'] ?? [];

// Validasi data kuis dasar
$quizTitle    = trim($quizData['title'] ?? '');
$quizCategory = trim($quizData['category'] ?? 'Umum');
$quizDesc     = trim($quizData['description'] ?? '');
$quizThumb    = trim($quizData['thumbnail'] ?? 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600');
$quizStatus   = in_array($quizData['status'] ?? '', ['active', 'draft']) ? $quizData['status'] : 'active';
$quizId       = !empty($quizData['id']) ? (int)$quizData['id'] : null;

if (empty($quizTitle)) {
    sendJsonResponse(false, 'Judul kuis tidak boleh kosong.', null, 422);
}

// Generate atau bersihkan slug
$slug = !empty($quizData['slug']) ? preg_replace('/[^a-z0-9\-]/', '', strtolower(str_replace(' ', '-', $quizData['slug']))) : '';
if (empty($slug)) {
    $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower(str_replace(' ', '-', $quizTitle))) . '-' . substr(md5((string)time()), 0, 5);
}

try {
    // Memulai transaksi database PDO
    $pdo->beginTransaction();

    if ($quizId) {
        // UPDATE QUIZ
        $stmtQuiz = $pdo->prepare("
            UPDATE quizzes 
            SET title = :title, slug = :slug, description = :desc, category = :cat, thumbnail = :thumb, status = :status
            WHERE id = :id
        ");
        $stmtQuiz->execute([
            ':title'  => $quizTitle,
            ':slug'   => $slug,
            ':desc'   => $quizDesc,
            ':cat'    => $quizCategory,
            ':thumb'  => $quizThumb,
            ':status' => $quizStatus,
            ':id'     => $quizId
        ]);
    } else {
        // INSERT NEW QUIZ
        $stmtQuiz = $pdo->prepare("
            INSERT INTO quizzes (title, slug, description, category, thumbnail, status, created_at)
            VALUES (:title, :slug, :desc, :cat, :thumb, :status, NOW())
        ");
        $stmtQuiz->execute([
            ':title'  => $quizTitle,
            ':slug'   => $slug,
            ':desc'   => $quizDesc,
            ':cat'    => $quizCategory,
            ':thumb'  => $quizThumb,
            ':status' => $quizStatus
        ]);
        $quizId = (int)$pdo->lastInsertId();
    }

    // Sinkronisasi Pertanyaan & Opsi Jawaban
    // Jika update, hapus pertanyaan lama (CASCADE akan otomatis menghapus options lama di database relasional)
    $stmtDelQ = $pdo->prepare("DELETE FROM questions WHERE quiz_id = :quiz_id");
    $stmtDelQ->execute([':quiz_id' => $quizId]);

    $stmtInsertQ = $pdo->prepare("
        INSERT INTO questions (quiz_id, question_text, image_url, sort_order)
        VALUES (:quiz_id, :question_text, :image_url, :sort_order)
    ");

    $stmtInsertOpt = $pdo->prepare("
        INSERT INTO options (question_id, option_text, score_value, result_code)
        VALUES (:question_id, :option_text, :score_value, :result_code)
    ");

    $order = 1;
    foreach ($questionsData as $qItem) {
        $qText = trim($qItem['question_text'] ?? '');
        if (empty($qText)) continue;

        $stmtInsertQ->execute([
            ':quiz_id'       => $quizId,
            ':question_text' => $qText,
            ':image_url'     => !empty($qItem['image_url']) ? trim($qItem['image_url']) : null,
            ':sort_order'    => $order++
        ]);
        $questionId = (int)$pdo->lastInsertId();

        $options = $qItem['options'] ?? [];
        foreach ($options as $opt) {
            $optText = trim($opt['option_text'] ?? '');
            if (empty($optText)) continue;

            $scoreVal   = isset($opt['score_value']) ? (int)$opt['score_value'] : 10;
            $resultCode = !empty($opt['result_code']) ? trim($opt['result_code']) : 'DEFAULT';

            $stmtInsertOpt->execute([
                ':question_id' => $questionId,
                ':option_text' => $optText,
                ':score_value' => $scoreVal,
                ':result_code' => $resultCode
            ]);
        }
    }

    // Sinkronisasi Result Rules
    $stmtDelRules = $pdo->prepare("DELETE FROM result_rules WHERE quiz_id = :quiz_id");
    $stmtDelRules->execute([':quiz_id' => $quizId]);

    if (!empty($rulesData)) {
        $stmtInsertRule = $pdo->prepare("
            INSERT INTO result_rules (quiz_id, result_code, title, description, badge, image_url, min_score, max_score)
            VALUES (:quiz_id, :code, :title, :desc, :badge, :img, :min_score, :max_score)
        ");

        foreach ($rulesData as $r) {
            $rCode  = trim($r['result_code'] ?? 'DEFAULT');
            $rTitle = trim($r['title'] ?? 'Hasil Kuis');
            $rDesc  = trim($r['description'] ?? '');
            $rBadge = trim($r['badge'] ?? 'Peserta ATW');
            $minSc  = isset($r['min_score']) ? (int)$r['min_score'] : 0;
            $maxSc  = isset($r['max_score']) ? (int)$r['max_score'] : 100;
            $rImg   = !empty($r['image_url']) ? trim($r['image_url']) : null;

            $stmtInsertRule->execute([
                ':quiz_id'   => $quizId,
                ':code'      => $rCode,
                ':title'     => $rTitle,
                ':desc'      => $rDesc,
                ':badge'     => $rBadge,
                ':img'       => $rImg,
                ':min_score' => $minSc,
                ':max_score' => $maxSc
            ]);
        }
    }

    // Commit transaksi jika seluruh operasi query sukses tanpa error
    $pdo->commit();

    sendJsonResponse(true, 'Data kuis, pertanyaan, opsi, dan aturan hasil berhasil disimpan secara utuh.', [
        'quiz_id' => $quizId,
        'slug'    => $slug,
        'share_url' => "/quiz.html?id={$quizId}"
    ], 200);

} catch (Exception $e) {
    // Rollback seluruh perubahan jika terjadi error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse(false, 'Gagal menyimpan data kuis: ' . $e->getMessage(), null, 500);
}
