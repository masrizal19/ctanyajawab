<?php
/**
 * ATW (Answer to Wrong) - Admin Quizzes List & Detail API
 * GET /api/admin/quizzes.php
 * GET /api/admin/quizzes.php?id={id} -> Mengambil data lengkap kuis, questions, options, & result_rules untuk form edit
 */

require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Method Not Allowed. Hanya menerima request GET.', null, 405);
}

try {
    $quizId = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;

    if ($quizId) {
        // Ambil data kuis spesifik untuk mode Edit
        $stmtQ = $pdo->prepare("SELECT * FROM quizzes WHERE id = :id LIMIT 1");
        $stmtQ->execute([':id' => $quizId]);
        $quiz = $stmtQ->fetch();

        if (!$quiz) {
            sendJsonResponse(false, 'Kuis tidak ditemukan.', null, 404);
        }

        // Ambil questions & options
        $stmtQuestions = $pdo->prepare("SELECT * FROM questions WHERE quiz_id = :quiz_id ORDER BY sort_order ASC, id ASC");
        $stmtQuestions->execute([':quiz_id' => $quizId]);
        $questions = $stmtQuestions->fetchAll();

        if (!empty($questions)) {
            $qIds = array_column($questions, 'id');
            $inClause = implode(',', array_fill(0, count($qIds), '?'));
            $stmtOptions = $pdo->prepare("SELECT * FROM options WHERE question_id IN ($inClause) ORDER BY id ASC");
            $stmtOptions->execute($qIds);
            $options = $stmtOptions->fetchAll();

            $optMap = [];
            foreach ($options as $opt) {
                $optMap[$opt['question_id']][] = $opt;
            }

            foreach ($questions as &$q) {
                $q['options'] = $optMap[$q['id']] ?? [];
            }
        }

        // Ambil result_rules
        $stmtRules = $pdo->prepare("SELECT * FROM result_rules WHERE quiz_id = :quiz_id ORDER BY min_score ASC, id ASC");
        $stmtRules->execute([':quiz_id' => $quizId]);
        $rules = $stmtRules->fetchAll();

        sendJsonResponse(true, 'Detail kuis berhasil dimuat.', [
            'quiz'         => $quiz,
            'questions'    => $questions,
            'result_rules' => $rules
        ]);

    } else {
        // Daftar semua kuis untuk Admin Dashboard
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
            GROUP BY q.id
            ORDER BY q.created_at DESC
        ";
        $stmt = $pdo->query($query);
        $quizzes = $stmt->fetchAll();

        sendJsonResponse(true, 'Daftar seluruh kuis admin berhasil dimuat.', [
            'total'   => count($quizzes),
            'quizzes' => $quizzes
        ]);
    }

} catch (Exception $e) {
    sendJsonResponse(false, 'Gagal memuat data admin: ' . $e->getMessage(), null, 500);
}
