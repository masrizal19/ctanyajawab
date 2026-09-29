<?php
/**
 * ATW (Answer to Wrong) - API Quiz Detail
 * GET /api/quiz-detail.php?id={id} atau ?slug={slug}
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Method Not Allowed. Hanya menerima request GET.', null, 405);
}

$id   = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null;
$slug = isset($_GET['slug']) ? sanitizeInput($_GET['slug']) : null;

if (!$id && !$slug) {
    sendJsonResponse(false, 'Parameter "id" (integer) atau "slug" wajib disertakan.', null, 400);
}

try {
    // 1. Fetch Quiz Metadata
    if ($id) {
        $quizStmt = $pdo->prepare("SELECT * FROM quizzes WHERE id = :id AND status = 'active' LIMIT 1");
        $quizStmt->execute([':id' => $id]);
    } else {
        $quizStmt = $pdo->prepare("SELECT * FROM quizzes WHERE slug = :slug AND status = 'active' LIMIT 1");
        $quizStmt->execute([':slug' => $slug]);
    }

    $quiz = $quizStmt->fetch();

    if (!$quiz) {
        sendJsonResponse(false, 'Kuis tidak ditemukan atau belum aktif.', null, 404);
    }

    $quizId = (int)$quiz['id'];

    // 2. Fetch Questions ordered by sort_order
    $qStmt = $pdo->prepare("
        SELECT id, quiz_id, question_text, image_url, sort_order 
        FROM questions 
        WHERE quiz_id = :quiz_id 
        ORDER BY sort_order ASC, id ASC
    ");
    $qStmt->execute([':quiz_id' => $quizId]);
    $questions = $qStmt->fetchAll();

    if (empty($questions)) {
        sendJsonResponse(true, 'Detail kuis berhasil diambil (belum ada pertanyaan).', [
            'quiz' => $quiz,
            'questions' => []
        ]);
    }

    // 3. Fetch Options for all questions in this quiz
    $questionIds = array_column($questions, 'id');
    $inClause = implode(',', array_fill(0, count($questionIds), '?'));

    $optStmt = $pdo->prepare("
        SELECT id, question_id, option_text, score_value, result_code 
        FROM options 
        WHERE question_id IN ($inClause)
        ORDER BY id ASC
    ");
    $optStmt->execute($questionIds);
    $allOptions = $optStmt->fetchAll();

    // Group options by question_id
    $optionsByQuestion = [];
    foreach ($allOptions as $opt) {
        $qid = $opt['question_id'];
        if (!isset($optionsByQuestion[$qid])) {
            $optionsByQuestion[$qid] = [];
        }
        $optionsByQuestion[$qid][] = [
            'id'          => (int)$opt['id'],
            'option_text' => $opt['option_text'],
            'score_value' => (int)$opt['score_value'],
            'result_code' => $opt['result_code']
        ];
    }

    // Assemble questions with options
    $assembledQuestions = [];
    foreach ($questions as $q) {
        $qid = (int)$q['id'];
        $assembledQuestions[] = [
            'id'            => $qid,
            'quiz_id'       => (int)$q['quiz_id'],
            'question_text' => $q['question_text'],
            'image_url'     => $q['image_url'],
            'sort_order'    => (int)$q['sort_order'],
            'options'       => $optionsByQuestion[$qid] ?? []
        ];
    }

    sendJsonResponse(true, 'Detail kuis dan pertanyaan berhasil dimuat.', [
        'quiz'      => $quiz,
        'questions' => $assembledQuestions
    ]);

} catch (Exception $e) {
    sendJsonResponse(false, 'Gagal mengambil detail kuis: ' . $e->getMessage(), null, 500);
}
