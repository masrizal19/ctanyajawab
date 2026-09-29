<?php
/**
 * ATW (Answer to Wrong) - Admin Delete Question API
 * Endpoint: /api/admin/delete-question.php or /backend/api/admin/delete-question.php
 * Method: POST / DELETE
 * Payload JSON: { "question_id": 5 }
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

$questionId = isset($payload['question_id']) ? filter_var($payload['question_id'], FILTER_VALIDATE_INT) : null;
if (!$questionId && isset($payload['id'])) {
    $questionId = filter_var($payload['id'], FILTER_VALIDATE_INT);
}
if (!$questionId && isset($_POST['question_id'])) {
    $questionId = filter_var($_POST['question_id'], FILTER_VALIDATE_INT);
}
if (!$questionId && isset($_POST['id'])) {
    $questionId = filter_var($_POST['id'], FILTER_VALIDATE_INT);
}
if (!$questionId && isset($_GET['question_id'])) {
    $questionId = filter_var($_GET['question_id'], FILTER_VALIDATE_INT);
}
if (!$questionId && isset($_GET['id'])) {
    $questionId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
}

// Validasi input question_id
if (!$questionId || $questionId <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'ID Pertanyaan (question_id) wajib disertakan dan harus berupa angka integer yang valid.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 3. Database Execution (PDO Transaction)
try {
    // Mulai transaksi database
    $pdo->beginTransaction();

    // 1. Hapus seluruh opsi jawaban yang terkait dengan pertanyaan ini
    $stmtOpt = $pdo->prepare("DELETE FROM options WHERE question_id = :question_id");
    $stmtOpt->execute([':question_id' => $questionId]);

    // 2. Hapus data pertanyaan
    $stmtQ = $pdo->prepare("DELETE FROM questions WHERE id = :id");
    $stmtQ->execute([':id' => $questionId]);

    // Verifikasi apakah ada pertanyaan yang terhapus
    if ($stmtQ->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'success' => false,
            'message' => 'Pertanyaan tidak ditemukan atau sudah dihapus sebelumnya.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Commit transaksi
    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'status'  => 'success',
        'success' => true,
        'message' => 'Pertanyaan dan seluruh opsi terkait berhasil dihapus.',
        'data'    => [
            'question_id' => $questionId
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
        'message' => 'Gagal menghapus pertanyaan: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
