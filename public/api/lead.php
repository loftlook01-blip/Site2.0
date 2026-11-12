<?php
/**
 * Приём заявок с сайта → Telegram (с кнопками статуса) + e-mail + резервная копия на диске.
 * Работает на любом PHP-хостинге, PHP 7.4+ (для 7.4 замените `fn` стрелочные функции — не нужно, они с 7.4).
 */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function out(int $code, array $data): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false, 'error' => 'method']);
$c = cfg();
if ($c['allowed_origin'] && isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== $c['allowed_origin']) out(403, ['ok' => false]);

$raw = file_get_contents('php://input') ?: '';
$in = json_decode($raw, true);
if (!is_array($in)) $in = $_POST;
if (!empty($in['website'])) out(200, ['ok' => true]); // honeypot

$clean = static fn($v, int $max = 300): string => mb_substr(trim(strip_tags((string)($v ?? ''))), 0, $max);
$name = $clean($in['name'] ?? '', 80);
$phone = norm_phone((string)($in['phone'] ?? ''));
if ($name === '' || $phone === '') out(422, ['ok' => false, 'error' => 'validation']);
if (empty($in['consent'])) out(422, ['ok' => false, 'error' => 'consent']);

// не чаще 1 заявки в 20 секунд с одного IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$lock = sys_get_temp_dir() . '/lead_' . md5($ip);
if (is_file($lock) && time() - filemtime($lock) < 20) out(429, ['ok' => false, 'error' => 'rate']);
@touch($lock);

$day = $clean($in['day'] ?? '', 10);
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) $day = '';
$time = $clean($in['time'] ?? '', 20);

$lead = lead_build([
    'name' => $name, 'phone' => $phone,
    'city' => $clean($in['city'] ?? '', 60), 'day' => $day, 'time' => $time,
    'message' => $clean($in['message'] ?? '', 1500),
    'extra' => $clean($in['extra'] ?? '', 600),
    'source' => $clean($in['source'] ?? '', 100), 'page' => $clean($in['page'] ?? '', 200), 'utm' => $clean($in['utm'] ?? '', 200),
]);
lead_save($lead, true); // копия на диске — заявка не потеряется, даже если Telegram недоступен
$sent = lead_notify($lead);
out(200, ['ok' => true, 'delivered' => $sent]);
