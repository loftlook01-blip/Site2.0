<?php
/**
 * Общая библиотека: настройки, Telegram API, хранение и оформление заявок.
 * Файл закрыт от веба через .htaccess — подключается только из lead.php и tg.php.
 */
declare(strict_types=1);
date_default_timezone_set('Europe/Moscow');

function cfg(): array {
    static $c = null;
    if ($c !== null) return $c;
    $f = __DIR__ . '/config.php';
    $c = (is_file($f) ? (array)(require $f) : []) + [
        'telegram_token' => getenv('TG_TOKEN') ?: '',
        'telegram_chat'  => getenv('TG_CHAT') ?: '',     // chat_id менеджера, группы или несколько через запятую
        'webhook_secret' => getenv('TG_SECRET') ?: '',   // секрет вебхука (защита tg.php от чужих запросов)
        'email_to'       => getenv('LEAD_EMAIL') ?: '',
        'email_from'     => 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
        'allowed_origin' => '',
        'tg_api'         => getenv('TG_API') ?: 'https://api.telegram.org',
    ];
    return $c;
}

function managers(): array {
    return array_values(array_filter(array_map('trim', explode(',', (string)cfg()['telegram_chat']))));
}

function esc($v): string { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function tg(string $method, array $params = []): ?array {
    $c = cfg();
    if ($c['telegram_token'] === '') return null;
    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($params, JSON_UNESCAPED_UNICODE),
        'timeout' => 8,
        'ignore_errors' => true,
    ]]);
    $res = @file_get_contents($c['tg_api'] . '/bot' . $c['telegram_token'] . '/' . $method, false, $ctx);
    if ($res === false) return null;
    $j = json_decode($res, true);
    return is_array($j) ? $j : null;
}

/** Данные калькулятора (генерируются при сборке сайта: dist/api/calc.json) */
function calc_data(): array {
    static $d = null;
    if ($d !== null) return $d;
    $f = __DIR__ . '/calc.json';
    $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    return $d;
}

function store_dir(string $name): string {
    $d = __DIR__ . '/' . $name;
    if (!is_dir($d)) @mkdir($d, 0750, true);
    return $d;
}

/* ───────── Время и даты ───────── */
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function day_label(string $iso): string {
    $t = strtotime($iso . ' 12:00');
    if (!$t || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $iso)) return '';
    $today = strtotime(date('Y-m-d') . ' 12:00');
    $diff = (int)round(($t - $today) / 86400);
    $base = WD[(int)date('w', $t)] . ', ' . (int)date('j', $t) . ' ' . MONTHS[(int)date('n', $t) - 1];
    return $diff === 0 ? "сегодня ($base)" : ($diff === 1 ? "завтра ($base)" : $base);
}

/** Ближайшие рабочие дни (без воскресенья) для записи на замер */
function next_days(int $n = 6): array {
    $out = [];
    $t = time();
    // после 16:00 на сегодня уже не записываем
    $d = (int)date('G') >= 16 ? 1 : 0;
    while (count($out) < $n) {
        $ts = strtotime("+$d day", $t);
        if ((int)date('w', $ts) !== 0) $out[] = date('Y-m-d', $ts);
        $d++;
    }
    return $out;
}

const SLOTS = ['10:00–13:00', '13:00–16:00', '16:00–19:00'];

function norm_phone(string $s): string {
    $d = preg_replace('/\D/', '', $s);
    if (strlen($d) === 10) $d = '7' . $d;
    if (strlen($d) === 11 && $d[0] === '8') $d = '7' . substr($d, 1);
    return strlen($d) === 11 && $d[0] === '7' ? '+' . $d : '';
}

/* ───────── Заявки ───────── */
const STATUS = [
    'new' => '🆕 Новая',
    'taken' => '🟡 В работе',
    'set' => '✅ Замер назначен',
    'nocall' => '📵 Не дозвонились',
    'drop' => '🚫 Отказ / спам',
];

function lead_new_id(): string { return bin2hex(random_bytes(3)); }

function lead_save(array $l, bool $append = false): void {
    $dir = store_dir('leads');
    @file_put_contents("$dir/{$l['id']}.json", json_encode($l, JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($append) @file_put_contents("$dir/_all-" . date('Y-m') . '.log', json_encode($l, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

function lead_load(string $id): ?array {
    if (!preg_match('/^[a-f0-9]{6}$/', $id)) return null;
    $f = store_dir('leads') . "/$id.json";
    return is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: null) : null;
}

function lead_text(array $l): string {
    $when = $l['day'] ? day_label($l['day']) : 'как можно скорее';
    if (!empty($l['time'])) $when .= ', ' . $l['time'];
    $t = [
        '🍳 <b>Заявка на замер</b> · #' . $l['id'],
        '',
        '👤 ' . esc($l['name']),
        '📞 ' . esc($l['phone']),
        '📍 ' . esc($l['city'] ?: '—'),
        '📅 Замер: <b>' . esc($when) . '</b>',
    ];
    if (!empty($l['extra'])) $t[] = '🧮 Расчёт: ' . esc($l['extra']);
    if (!empty($l['message'])) $t[] = '💬 ' . esc($l['message']);
    if (!empty($l['tg'])) $t[] = '✈️ Telegram: ' . $l['tg'];
    $src = array_filter([$l['source'] ?? '', $l['page'] ?? '', $l['utm'] ?? '']);
    if ($src) $t[] = '🔗 ' . esc(implode(' · ', $src));
    $t[] = '';
    $t[] = '<b>' . STATUS[$l['status']] . '</b>' . (!empty($l['by']) ? ' — ' . esc($l['by']) . ', ' . date('d.m H:i', (int)$l['status_at']) : '');
    $t[] = '<i>' . date('d.m.Y H:i', (int)$l['ts']) . '</i>';
    return implode("\n", $t);
}

function lead_keyboard(array $l): array {
    $b = fn(string $text, string $act) => ['text' => $text, 'callback_data' => "x:$act:{$l['id']}"];
    switch ($l['status']) {
        case 'new':
        case 'nocall': return ['inline_keyboard' => [[$b('✅ Взял в работу', 'take')]]];
        case 'taken': return ['inline_keyboard' => [[$b('📅 Замер назначен', 'set')], [$b('📵 Не дозвонился', 'nocall'), $b('🚫 Отказ / спам', 'drop')]]];
        default: return ['inline_keyboard' => []];
    }
}

/** Отправить заявку менеджерам в Telegram и на почту. true — дошла хотя бы одним способом. */
function lead_notify(array $l): bool {
    $sent = false;
    $l['msgs'] = [];
    foreach (managers() as $chat) {
        $r = tg('sendMessage', ['chat_id' => $chat, 'text' => lead_text($l), 'parse_mode' => 'HTML', 'disable_web_page_preview' => true, 'reply_markup' => lead_keyboard($l)]);
        if (!empty($r['ok'])) {
            $sent = true;
            $l['msgs'][] = [$chat, $r['result']['message_id']];
        }
    }
    lead_save($l);
    $c = cfg();
    if ($c['email_to']) {
        $subject = '=?UTF-8?B?' . base64_encode('Заявка на замер: ' . $l['name']) . '?=';
        $headers = "From: {$c['email_from']}\r\nContent-Type: text/plain; charset=utf-8\r\n";
        $sent = @mail($c['email_to'], $subject, html_entity_decode(strip_tags(lead_text($l)), ENT_QUOTES, 'UTF-8'), $headers) || $sent;
    }
    return $sent;
}

/** Обновить статус во всех сообщениях менеджеров */
function lead_refresh(array $l): void {
    foreach ($l['msgs'] ?? [] as [$chat, $mid]) {
        tg('editMessageText', ['chat_id' => $chat, 'message_id' => $mid, 'text' => lead_text($l), 'parse_mode' => 'HTML', 'disable_web_page_preview' => true, 'reply_markup' => lead_keyboard($l)]);
    }
}

function lead_build(array $in): array {
    return [
        'id' => lead_new_id(),
        'ts' => time(),
        'status' => 'new',
        'status_at' => time(),
        'by' => '',
        'name' => $in['name'],
        'phone' => $in['phone'],
        'city' => $in['city'] ?? '',
        'day' => $in['day'] ?? '',
        'time' => $in['time'] ?? '',
        'message' => $in['message'] ?? '',
        'extra' => $in['extra'] ?? '',
        'source' => $in['source'] ?? '',
        'page' => $in['page'] ?? '',
        'utm' => $in['utm'] ?? '',
        'tg' => $in['tg'] ?? '',
        'msgs' => [],
    ];
}

/* ───────── Расчёт (та же формула, что в Configurator.astro) ───────── */
function find_by_id(array $list, string $id): ?array {
    foreach ($list as $x) if ($x['id'] === $id) return $x;
    return null;
}

function estimate(array $sel): array {
    $C = calc_data();
    $L = find_by_id($C['layouts'], $sel['l']);
    $F = find_by_id($C['facades'], $sel['f']);
    $T = find_by_id($C['tops'], $sel['t']);
    $H = find_by_id($C['hardware'], $sel['h'] ?? 'comfort');
    $perM = $F['price'] * $L['k'] * $H['k'] + $T['price'];
    foreach ($sel['o'] ?? [] as $oid) if ($o = find_by_id($C['options'], $oid)) $perM += $o['perM'];
    $total = $perM * (float)$sel['m'];
    $min = (int)(round($total * (1 - $C['spread']) / 1000) * 1000);
    $max = (int)(round($total * (1 + $C['spread']) / 1000) * 1000);
    $months = (int)($C['site']['installmentMonths'] ?? 12);
    return ['min' => $min, 'max' => $max, 'month' => (int)(round($min / $months / 100) * 100), 'months' => $months, 'L' => $L, 'F' => $F, 'T' => $T, 'H' => $H];
}

function rub(int $n): string { return number_format($n, 0, ',', "\u{202F}") . ' ₽'; }
