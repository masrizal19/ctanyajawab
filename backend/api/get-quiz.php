<?php
/**
 * ATW (Answer to Wrong) - Public Get Quiz API
 * GET /api/get-quiz.php?id={id} atau ?slug={slug}
 * Mengambil data kuis publik beserta pertanyaan dan opsinya untuk ditampilkan pada halaman kuis user
 * tanpa membocorkan bobot skor rahasia.
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Method Not Allowed. Hanya menerima request GET.', null, 405);
}

try {
    $id   = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;
    $slug = isset($_GET['slug']) ? sanitizeInput($_GET['slug']) : null;

    if (!$id && !$slug) {
        sendJsonResponse(false, 'Parameter "id" atau "slug" kuis wajib disertakan.', null, 400);
    }

    if ($id) {
        $stmtQuiz = $pdo->prepare("SELECT id, title, slug, description, category, thumbnail, status, created_at FROM quizzes WHERE id = :id AND status = 'active' LIMIT 1");
        $stmtQuiz->execute([':id' => $id]);
    } else {
        $stmtQuiz = $pdo->prepare("SELECT id, title, slug, description, category, thumbnail, status, created_at FROM quizzes WHERE slug = :slug AND status = 'active' LIMIT 1");
        $stmtQuiz->execute([':slug' => $slug]);
    }

    $quiz = $stmtQuiz->fetch();
    if (!$quiz) {
        sendJsonResponse(false, 'Kuis tidak ditemukan atau belum dipublikasikan.', null, 404);
    }

    // Ambil pertanyaan kuis
    $stmtQ = $pdo->prepare("SELECT id, quiz_id, question_text, image_url, sort_order FROM questions WHERE quiz_id = :quiz_id ORDER BY sort_order ASC, id ASC");
    $stmtQ->execute([':quiz_id' => $quiz['id']]);
    $questions = $stmtQ->fetchAll();

    if (!empty($questions)) {
        $qIds = array_column($questions, 'id');
        $placeholders = implode(',', array_fill(0, count($qIds), '?'));
        
        // Hanya kirimkan id, question_id, dan option_text ke publik. Tidak mengekspos score_value dan result_code ke browser user!
        $stmtOpt = $pdo->prepare("SELECT id, question_id, option_text FROM options WHERE question_id IN ($placeholders) ORDER BY id ASC");
        $stmtOpt->execute($qIds);
        $options = $stmtOpt->fetchAll();

        $groupedOptions = [];
        foreach ($options as $opt) {
            $groupedOptions[$opt['question_id']][] = [
                'id'          => (int)$opt['id'],
                'option_text' => $opt['option_text']
            ];
        }

        foreach ($questions as &$q) {
            $q['id'] = (int)$q['id'];
            $q['options'] = $groupedOptions[$q['id']] ?? [];
        }
    }

    sendJsonResponse(true, 'Data kuis berhasil dimuat.', [
        'quiz'      => $quiz,
        'questions' => $questions
    ]);

} catch (Exception $e) {
    sendJsonResponse(false, 'Terjadi kegagalan server: ' . $e->getMessage(), null, 500);
}
