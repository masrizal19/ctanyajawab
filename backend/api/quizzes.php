<?php
/**
 * ATW (Answer to Wrong) - API Quizzes List
 * GET /api/quizzes.php
 * Query Params:
 *  - category: (optional) Filter by category string
 *  - search: (optional) Search quiz title or description
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Method Not Allowed. Hanya menerima request GET.', null, 405);
}

try {
    $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : '';
    $search   = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';

    $query = "
        SELECT 
            q.id,
            q.title,
            q.slug,
            q.description,
            q.category,
            q.thumbnail,
            q.status,
            q.created_at,
            COUNT(DISTINCT qu.id) AS total_questions,
            COUNT(DISTINCT ur.id) AS total_participants
        FROM quizzes q
        LEFT JOIN questions qu ON q.id = qu.quiz_id
        LEFT JOIN user_responses ur ON q.id = ur.quiz_id
        WHERE q.status = 'active'
    ";

    $params = [];

    if (!empty($category) && strtolower($category) !== 'semua') {
        $query .= " AND q.category = :category";
        $params[':category'] = $category;
    }

    if (!empty($search)) {
        $query .= " AND (q.title LIKE :search OR q.description LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $query .= " GROUP BY q.id ORDER BY q.created_at DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $quizzes = $stmt->fetchAll();

    // Query distinct categories for filter pills
    $catStmt = $pdo->query("SELECT category, COUNT(*) as count FROM quizzes WHERE status = 'active' GROUP BY category");
    $categories = $catStmt->fetchAll();

    sendJsonResponse(true, 'Daftar kuis berhasil dimuat.', [
        'total'      => count($quizzes),
        'categories' => $categories,
        'quizzes'    => $quizzes
    ]);

} catch (Exception $e) {
    sendJsonResponse(false, 'Gagal mengambil data kuis: ' . $e->getMessage(), null, 500);
}
