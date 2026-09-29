<?php
/**
 * ATW (Answer to Wrong) - API Submit Quiz & Dynamic Scoring Engine
 * POST /api/submit-quiz.php
 * 
 * Payload Body (JSON):
 * {
 *   "quiz_id": 1,
 *   "session_id": "guest_abc123",
 *   "user_id": null,
 *   "answers": [
 *     { "question_id": 1, "option_id": 3 },
 *     { "question_id": 2, "option_id": 7 }
 *   ]
 * }
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method Not Allowed. Hanya menerima request POST.', null, 405);
}

// Read raw JSON input
$rawInput = file_get_contents('php://input');
$payload  = json_decode($rawInput, true);

if (!is_array($payload)) {
    sendJsonResponse(false, 'Payload tidak valid. Format harus JSON yang benar.', null, 400);
}

$quizId    = isset($payload['quiz_id']) ? filter_var($payload['quiz_id'], FILTER_VALIDATE_INT) : null;
$answers   = isset($payload['answers']) && is_array($payload['answers']) ? $payload['answers'] : [];
$sessionId = isset($payload['session_id']) ? sanitizeInput($payload['session_id']) : session_id() ?: 'sess_' . bin2hex(random_bytes(8));
$userId    = isset($payload['user_id']) ? filter_var($payload['user_id'], FILTER_VALIDATE_INT) : null;

if (!$quizId || empty($answers)) {
    sendJsonResponse(false, 'Data jawaban kosong atau quiz_id tidak valid.', null, 422);
}

try {
    $pdo->beginTransaction();

    // 1. Verifikasi kuis ada dan aktif
    $qCheck = $pdo->prepare("SELECT id, title, slug, category FROM quizzes WHERE id = :id AND status = 'active' LIMIT 1");
    $qCheck->execute([':id' => $quizId]);
    $quiz = $qCheck->fetch();

    if (!$quiz) {
        $pdo->rollBack();
        sendJsonResponse(false, 'Kuis tidak ditemukan atau non-aktif.', null, 404);
    }

    // 2. Kumpulkan ID opsi yang dikirim client
    $selectedOptionIds = [];
    foreach ($answers as $ans) {
        if (!empty($ans['option_id'])) {
            $selectedOptionIds[] = (int)$ans['option_id'];
        }
    }

    if (empty($selectedOptionIds)) {
        $pdo->rollBack();
        sendJsonResponse(false, 'Tidak ada pilihan jawaban yang valid.', null, 422);
    }

    // 3. Ambil data asli dari tabel `options` dan `questions` via Server-Side PDO
    // Ini menjamin keamanan (client tidak bisa memalsukan skor/result_code)
    $inClause = implode(',', array_fill(0, count($selectedOptionIds), '?'));
    $sqlOpt = "
        SELECT 
            o.id AS option_id,
            o.question_id,
            o.option_text,
            o.score_value,
            o.result_code,
            q.question_text
        FROM options o
        INNER JOIN questions q ON o.question_id = q.id
        WHERE o.id IN ($inClause) AND q.quiz_id = ?
    ";

    $execParams = array_merge($selectedOptionIds, [$quizId]);
    $stmtOpt = $pdo->prepare($sqlOpt);
    $stmtOpt->execute($execParams);
    $dbOptions = $stmtOpt->fetchAll();

    if (empty($dbOptions)) {
        $pdo->rollBack();
        sendJsonResponse(false, 'Jawaban yang dipilih tidak cocok dengan kuis ini.', null, 400);
    }

    // 4. ATW Quiz Calculation Engine
    // Hitung total skor & hitung frekuensi kemunculan result_code
    $totalScore = 0;
    $resultCodeFrequency = [];
    $detailedAnswers = [];

    foreach ($dbOptions as $row) {
        $score = (int)$row['score_value'];
        $code  = trim((string)$row['result_code']);

        $totalScore += $score;

        if (!empty($code)) {
            $resultCodeFrequency[$code] = ($resultCodeFrequency[$code] ?? 0) + 1;
        }

        $detailedAnswers[] = [
            'question_id'   => (int)$row['question_id'],
            'question_text' => $row['question_text'],
            'option_id'     => (int)$row['option_id'],
            'option_text'   => $row['option_text'],
            'score_value'   => $score,
            'result_code'   => $code
        ];
    }

    // Tentukan result_code dominan (paling sering dipilih)
    $dominantCode = null;
    if (!empty($resultCodeFrequency)) {
        arsort($resultCodeFrequency);
        $dominantCode = array_key_first($resultCodeFrequency);
    }

    // 5. Cocokkan dengan tabel `result_rules`
    // Prioritas 1: Cocokkan quiz_id dan result_code dominan
    $finalRule = null;
    if ($dominantCode) {
        $ruleStmt = $pdo->prepare("
            SELECT * FROM result_rules 
            WHERE quiz_id = :quiz_id AND result_code = :result_code 
            LIMIT 1
        ");
        $ruleStmt->execute([
            ':quiz_id'     => $quizId,
            ':result_code' => $dominantCode
        ]);
        $finalRule = $ruleStmt->fetch();
    }

    // Prioritas 2 (Fallback skor): Jika rule by code belum ada, cari berdasarkan rentang skor (min_score & max_score)
    if (!$finalRule) {
        $ruleScoreStmt = $pdo->prepare("
            SELECT * FROM result_rules 
            WHERE quiz_id = :quiz_id 
              AND :score BETWEEN min_score AND max_score 
            ORDER BY max_score DESC 
            LIMIT 1
        ");
        $ruleScoreStmt->execute([
            ':quiz_id' => $quizId,
            ':score'   => $totalScore
        ]);
        $finalRule = $ruleScoreStmt->fetch();
    }

    // Fallback darurat jika tidak ada rule cocok
    if (!$finalRule) {
        $ruleDefault = $pdo->prepare("SELECT * FROM result_rules WHERE quiz_id = :quiz_id ORDER BY id ASC LIMIT 1");
        $ruleDefault->execute([':quiz_id' => $quizId]);
        $finalRule = $ruleDefault->fetch() ?: [
            'id'          => null,
            'result_code' => $dominantCode ?: 'DEFAULT',
            'title'       => 'Hasil Kuis Selesai',
            'description' => 'Jawabanmu telah berhasil dievaluasi oleh sistem.',
            'badge'       => 'Peserta Kuis ATW'
        ];
    }

    $finalResultId = !empty($finalRule['id']) ? (int)$finalRule['id'] : null;

    // 6. Simpan riwayat submission ke tabel `user_responses`
    $insertResponse = $pdo->prepare("
        INSERT INTO user_responses 
        (user_id, session_id, quiz_id, final_result_id, total_score, dominant_code, answers_payload, created_at)
        VALUES 
        (:user_id, :session_id, :quiz_id, :final_result_id, :total_score, :dominant_code, :answers_payload, NOW())
    ");

    $insertResponse->execute([
        ':user_id'         => $userId,
        ':session_id'      => $sessionId,
        ':quiz_id'         => $quizId,
        ':final_result_id' => $finalResultId,
        ':total_score'     => $totalScore,
        ':dominant_code'   => $dominantCode,
        ':answers_payload' => json_encode($detailedAnswers, JSON_UNESCAPED_UNICODE)
    ]);

    $responseId = (int)$pdo->lastInsertId();

    $pdo->commit();

    // 7. Kembalikan respons terstruktur ke frontend
    sendJsonResponse(true, 'Kuis berhasil diselesaikan dan dinilai.', [
        'response_id'       => $responseId,
        'quiz'              => [
            'id'       => (int)$quiz['id'],
            'title'    => $quiz['title'],
            'category' => $quiz['category']
        ],
        'score'             => $totalScore,
        'dominant_code'     => $dominantCode,
        'code_distribution' => $resultCodeFrequency,
        'result'            => [
            'id'          => $finalResultId,
            'code'        => $finalRule['result_code'] ?? $dominantCode,
            'title'       => $finalRule['title'],
            'description' => $finalRule['description'],
            'badge'       => $finalRule['badge'],
            'image_url'   => $finalRule['image_url'] ?? null
        ],
        'total_answered'    => count($detailedAnswers),
        'completed_at'      => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse(false, 'Gagal memproses kalkulasi kuis: ' . $e->getMessage(), null, 500);
}
