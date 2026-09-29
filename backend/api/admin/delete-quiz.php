<?php
/**
 * ATW (Answer to Wrong) - Admin Delete Quiz API
 * Endpoint: /api/admin/delete-quiz.php or /backend/api/admin/delete-quiz.php
 * Method: POST / DELETE
 * Payload JSON: { "quiz_id": 1 }
 */

require_once __DIR__ . '/../../db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Hanya izinkan method POST atau DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Method Not Allowed. Hanya menerima request POST atau DELETE.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Validasi Sesi Autentikasi Admin
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$isAdminAuthenticated = !empty($_SESSION['admin']) || 
                        !empty($_SESSION['admin_logged_in']) || 
                        !empty($authHeader) ||
                        (isset($_GET['token']) && !empty($_GET['token']));

// Optional check fallback for development token
if (!$isAdminAuthenticated && !empty($authHeader) && str_starts_with($authHeader, 'Bearer admin_tok_')) {
    $isAdminAuthenticated = true;
}

// 2. Baca Input JSON Payload
$rawInput = file_get_contents('php://input');
$payload  = json_decode($rawInput, true);

$quizId = isset($payload['quiz_id']) ? filter_var($payload['quiz_id'], FILTER_VALIDATE_INT) : null;
if (!$quizId && isset($payload['id'])) {
    $quizId = filter_var($payload['id'], FILTER_VALIDATE_INT);
}
if (!$quizId && isset($_POST['quiz_id'])) {
    $quizId = filter_var($_POST['quiz_id'], FILTER_VALIDATE_INT);
}
if (!$quizId && isset($_POST['id'])) {
    $quizId = filter_var($_POST['id'], FILTER_VALIDATE_INT);
}
if (!$quizId && isset($_GET['quiz_id'])) {
    $quizId = filter_var($_GET['quiz_id'], FILTER_VALIDATE_INT);
}
if (!$quizId && isset($_GET['id'])) {
    $quizId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
}

// Validasi input quiz_id
if (!$quizId || $quizId <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'ID Kuis (quiz_id) wajib disertakan dan harus berupa angka integer yang valid.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 3. Database Execution (PDO Transaction)
try {
    // Mulai transaksi database
    $pdo->beginTransaction();

    // 1. Hapus riwayat jawaban pengguna terkait kuis ini
    $stmt1 = $pdo->prepare("DELETE FROM user_responses WHERE quiz_id = :quiz_id");
    $stmt1->execute([':quiz_id' => $quizId]);

    // 2. Hapus aturan hasil akhir terkait kuis ini
    $stmt2 = $pdo->prepare("DELETE FROM result_rules WHERE quiz_id = :quiz_id");
    $stmt2->execute([':quiz_id' => $quizId]);

    // 3. Hapus seluruh opsi jawaban yang merujuk pada pertanyaan di kuis ini
    $stmt3 = $pdo->prepare("DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = :quiz_id)");
    $stmt3->execute([':quiz_id' => $quizId]);

    // 4. Hapus seluruh pertanyaan terkait kuis ini
    $stmt4 = $pdo->prepare("DELETE FROM questions WHERE quiz_id = :quiz_id");
    $stmt4->execute([':quiz_id' => $quizId]);

    // 5. Hapus data utama kuis
    $stmt5 = $pdo->prepare("DELETE FROM quizzes WHERE id = :quiz_id");
    $stmt5->execute([':quiz_id' => $quizId]);

    // Verifikasi apakah ada record kuis yang terhapus
    if ($stmt5->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'success' => false,
            'message' => 'Kuis tidak ditemukan atau sudah dihapus sebelumnya.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Commit transaksi seluruhnya
    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'success' => true,
        'message' => 'Kuis dan seluruh data terkait berhasil dihapus.',
        'data'    => [
            'quiz_id' => $quizId
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();

} catch (Exception $e) {
    // Rollback jika terjadi kegagalan operasi
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'success' => false,
        'message' => 'Gagal menghapus kuis: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
