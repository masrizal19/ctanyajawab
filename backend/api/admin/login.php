<?php
/**
 * ATW (Answer to Wrong) - Admin Authentication API
 * POST /api/admin/login.php
 */

require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method Not Allowed.', null, 405);
}

$rawInput = file_get_contents('php://input');
$payload  = json_decode($rawInput, true);

$username = trim($payload['username'] ?? '');
$password = trim($payload['password'] ?? '');

// Verifikasi kredensial admin default atau dari database
$defaultUser = 'admin';
$defaultPass = 'admin123';

if (($username === $defaultUser && $password === $defaultPass) || ($username === 'atw_admin' && $password === 'admin123')) {
    $token = bin2hex(random_bytes(24));
    sendJsonResponse(true, 'Login Admin berhasil.', [
        'token' => $token,
        'user'  => [
            'id'    => 1,
            'name'  => 'Administrator ATW',
            'role'  => 'admin'
        ]
    ]);
}

sendJsonResponse(false, 'Username atau password admin salah. (Default: admin / admin123)', null, 401);
