<?php
/**
 * Telegram-бот (webhook).
 *  • Клиентам: /start → расчёт кухни кнопками (планировка → длина → фасады → столешница) → ориентир цены →
 *    запись на замер (город → день → время → телефон одной кнопкой) → заявка менеджеру.
 *  • Менеджерам: кнопки «Взял в работу / Замер назначен / Не дозвонился / Отказ» под каждой заявкой, /id — узнать chat_id.
 * Регистрация вебхука: scripts/tg-setup.sh
 */
declare(strict_types=1);
require __DIR__ . '/_lib.php';
header('Content-Type: application/json; charset=utf-8');

$c = cfg();
if ($c['webhook_secret'] !== '' && ($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '') !== $c['webhook_secret']) { http_response_code(403); exit('{"ok":false}'); }
$u = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($u)) { http_response_code(400); exit('{"ok":false}'); }
http_response_code(200);
echo '{"ok":true}';
if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();

$C = calc_data();
$S = $C['site'] ?? ['brand' => 'ДВИНА', 'phone' => '', 'hours' => '', 'address' => ''];

/* ───────── Состояние диалога ───────── */
function st_load(int $chat): array {
    $f = store_dir('state') . "/$chat.json";
    $s = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    return $s + ['step' => '', 'sel' => [], 'book' => []];
}
function st_save(int $chat, array $s): void { @file_put_contents(store_dir('state') . "/$chat.json", json_encode($s, JSON_UNESCAPED_UNICODE), LOCK_EX); }

/* ───────── Отправка / редактирование ───────── */
function show(int $chat, ?int $mid, string $text, array $kb = []): void {
    $p = ['chat_id' => $chat, 'text' => $text, 'parse_mode' => 'HTML', 'disable_web_page_preview' => true];
    if ($kb) $p['reply_markup'] = ['inline_keyboard' => $kb];
    if ($mid) { $p['message_id'] = $mid; $r = tg('editMessageText', $p); if (!empty($r['ok'])) return; unset($p['message_id']); }
    tg('sendMessage', $p);
}
function btn(string $t, string $d): array { return ['text' => $t, 'callback_data' => $d]; }
function rows(array $btns, int $per = 2): array { return array_chunk($btns, $per); }

/* ───────── Экраны ───────── */
function scr_menu(int $chat, ?int $mid): void {
    global $S;
    show($chat, $mid, "Здравствуйте! Это бот <b>{$S['brand']}</b> — кухни и мебель на заказ в Архангельске, Северодвинске и Новодвинске.\n\nПосчитаю ориентировочную стоимость кухни за минуту и запишу на бесплатный замер.", [
        [btn('🧮 Рассчитать кухню', 'c:go')],
        [btn('📅 Сразу вызвать замерщика', 'b:start')],
        [btn('📍 Адрес и телефон', 'c:info')],
    ]);
}
function scr_info(int $chat, ?int $mid): void {
    global $S;
    show($chat, $mid, "📍 <b>{$S['address']}</b>\n📞 {$S['phone']}\n🕒 {$S['hours']}\n\nПроизводство и приём заказов. Замер, 3D-проект, доставка и монтаж — бесплатно в Архангельске, Северодвинске и Новодвинске.", [[btn('🧮 Рассчитать кухню', 'c:go')], [btn('📅 Вызвать замерщика', 'b:start')]]);
}
function scr_layout(int $chat, ?int $mid): void {
    global $C;
    show($chat, $mid, "<b>Шаг 1 из 4.</b> Какая планировка кухни?", rows(array_map(fn($l) => btn($l['name'], 'l:' . $l['id']), $C['layouts'])));
}
function scr_len(int $chat, ?int $mid, string $lid): void {
    global $C;
    $L = find_by_id($C['layouts'], $lid);
    $opts = ['straight' => [2.4, 3.0, 3.6, 4.2, 5.0], 'corner' => [3.6, 4.2, 5.0, 6.0, 7.0], 'u' => [5.0, 6.0, 7.0, 8.0, 9.0], 'island' => [5.0, 6.0, 6.5, 8.0, 9.0]][$lid] ?? [3.0, 4.0, 5.0];
    $b = array_map(fn($m) => btn(str_replace('.', ',', (string)$m) . ' м', 'm:' . $m), $opts);
    show($chat, $mid, "<b>Шаг 2 из 4.</b> Какой длины гарнитур?\n\nСчитаем сумму длин всех сторон. Не знаете точно — выберите примерно или напишите число сообщением (от {$L['min']} до {$L['max']} м).", rows($b, 3));
}
function scr_facade(int $chat, ?int $mid): void {
    global $C;
    show($chat, $mid, "<b>Шаг 3 из 4.</b> Из чего фасады?", rows(array_map(fn($f) => btn($f['name'] . ' · от ' . number_format($f['price'] / 1000, 0) . ' тыс.', 'f:' . $f['id']), $C['facades']), 1));
}
function scr_top(int $chat, ?int $mid): void {
    global $C;
    show($chat, $mid, "<b>Шаг 4 из 4.</b> Какая столешница?", rows(array_map(fn($t) => btn($t['name'], 't:' . $t['id']), $C['tops'])));
}
function summary(array $sel): string {
    $e = estimate($sel + ['h' => 'comfort']);
    return "{$e['L']['name']} " . str_replace('.', ',', (string)$sel['m']) . " м · фасады {$e['F']['name']} · столешница {$e['T']['name']} · " . rub($e['min']) . '–' . rub($e['max']);
}
function scr_result(int $chat, ?int $mid, array $sel): void {
    $e = estimate($sel + ['h' => 'comfort']);
    show($chat, $mid, "<b>Ориентир по цене</b>\n\n▫️ {$e['L']['name']}, " . str_replace('.', ',', (string)$sel['m']) . " м\n▫️ Фасады: {$e['F']['name']}\n▫️ Столешница: {$e['T']['name']}\n▫️ Фурнитура: {$e['H']['name']} ({$e['H']['note']})\n\n💰 <b>" . rub($e['min']) . ' – ' . rub($e['max']) . "</b>\nВ рассрочку — от " . rub($e['month']) . " в месяц ({$e['months']} мес.)\n\nЭто ориентир с вилкой ±8%, без техники. Точную цену фиксируем в договоре после бесплатного замера: дизайнер приедет с образцами и через 2 дня покажет вашу кухню в 3D.", [
        [btn('📅 Записаться на бесплатный замер', 'b:start')],
        [btn('🔁 Посчитать заново', 'c:go')],
    ]);
}
function scr_city(int $chat, ?int $mid): void {
    show($chat, $mid, "<b>Запись на замер.</b> В каком городе?", [[btn('Архангельск', 'b:city:Архангельск'), btn('Северодвинск', 'b:city:Северодвинск')], [btn('Новодвинск', 'b:city:Новодвинск'), btn('Другой', 'b:city:Другой населённый пункт')]]);
}
function scr_day(int $chat, ?int $mid): void {
    $b = array_map(fn($d) => btn(day_label($d), 'b:day:' . $d), next_days(6));
    $b[] = btn('Как можно скорее', 'b:day:-');
    show($chat, $mid, "На какой день?", rows($b, 2));
}
function scr_time(int $chat, ?int $mid): void {
    $b = [];
    foreach (SLOTS as $i => $s) $b[] = btn($s, "b:time:$i");
    $b[] = btn('Позвоните, договоримся', 'b:time:-');
    show($chat, $mid, "В какое время удобнее?", rows($b, 2));
}
function scr_phone(int $chat): void {
    tg('sendMessage', ['chat_id' => $chat, 'text' => "Остался телефон, чтобы замерщик мог подтвердить визит. Нажмите кнопку — номер отправится из Telegram. Или напишите его сообщением.", 'reply_markup' => ['keyboard' => [[['text' => '📱 Отправить мой номер', 'request_contact' => true]]], 'resize_keyboard' => true, 'one_time_keyboard' => true]]);
}

function finish_booking(int $chat, array $s, string $phone, array $from): void {
    global $S;
    $b = $s['book'];
    $name = trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? '')) ?: 'Клиент из Telegram';
    $tgLink = !empty($from['username']) ? '@' . esc($from['username']) : '<a href="tg://user?id=' . (int)$from['id'] . '">профиль</a>';
    $lead = lead_build([
        'name' => $name, 'phone' => $phone, 'city' => $b['city'] ?? '', 'day' => $b['day'] ?? '', 'time' => $b['time'] ?? '',
        'extra' => !empty($s['sel']['f']) ? summary($s['sel']) : '', 'source' => 'Telegram-бот', 'tg' => $tgLink,
    ]);
    lead_save($lead, true);
    lead_notify($lead);
    $when = $lead['day'] ? day_label($lead['day']) : 'в ближайшее время';
    if ($lead['time']) $when .= ', ' . $lead['time'];
    tg('sendMessage', ['chat_id' => $chat, 'parse_mode' => 'HTML', 'text' => "✅ <b>Заявка принята.</b>\n\nЗамер: {$when}, " . ($lead['city'] ?: 'ваш адрес') . "\nТелефон: {$phone}\n\nМенеджер позвонит в течение 15 минут в рабочее время ({$S['hours']}) и подтвердит визит. Замер бесплатный и ни к чему не обязывает.", 'reply_markup' => ['remove_keyboard' => true]]);
    st_save($chat, ['step' => '', 'sel' => $s['sel'], 'book' => []]);
}

/* ───────── Callback-кнопки ───────── */
if (isset($u['callback_query'])) {
    $q = $u['callback_query'];
    $data = (string)($q['data'] ?? '');
    $chat = (int)($q['message']['chat']['id'] ?? 0);
    $mid = (int)($q['message']['message_id'] ?? 0) ?: null;
    $from = $q['from'] ?? [];
    $toast = '';

    if (str_starts_with($data, 'x:')) {                          // менеджер: статус заявки
        [, $act, $id] = array_pad(explode(':', $data), 3, '');
        $isMgr = in_array((string)$chat, managers(), true) || in_array((string)($from['id'] ?? ''), managers(), true);
        $l = $isMgr ? lead_load($id) : null;
        if (!$l) { $toast = $isMgr ? 'Заявка не найдена' : 'Нет доступа'; }
        else {
            $map = ['take' => 'taken', 'set' => 'set', 'nocall' => 'nocall', 'drop' => 'drop'];
            if (isset($map[$act])) {
                $l['status'] = $map[$act];
                $l['status_at'] = time();
                $l['by'] = !empty($from['username']) ? '@' . $from['username'] : trim(($from['first_name'] ?? '') . ' ' . ($from['last_name'] ?? ''));
                lead_save($l);
                lead_refresh($l);
                $toast = STATUS[$l['status']];
            }
        }
    } elseif ($chat) {                                           // клиент: диалог
        $s = st_load($chat);
        $p = explode(':', $data, 3);
        switch ($p[0] . ':' . ($p[1] ?? '')) {
            case 'c:go': $s = ['step' => 'l', 'sel' => [], 'book' => []]; scr_layout($chat, $mid); break;
            case 'c:info': scr_info($chat, $mid); break;
            case 'c:menu': scr_menu($chat, $mid); break;
            case 'b:start': $s['step'] = 'city'; $s['book'] = []; scr_city($chat, $mid); break;
            case 'b:city': $s['book']['city'] = $p[2] ?? ''; $s['step'] = 'day'; scr_day($chat, $mid); break;
            case 'b:day': $s['book']['day'] = ($p[2] ?? '-') === '-' ? '' : $p[2]; $s['step'] = 'time'; scr_time($chat, $mid); break;
            case 'b:time':
                $i = $p[2] ?? '-';
                $s['book']['time'] = $i === '-' ? '' : (SLOTS[(int)$i] ?? '');
                $s['step'] = 'phone';
                show($chat, $mid, '✔️ ' . esc($s['book']['city'] ?? '') . ', ' . ($s['book']['day'] ? day_label($s['book']['day']) : 'как можно скорее') . ($s['book']['time'] ? ', ' . $s['book']['time'] : ''));
                scr_phone($chat);
                break;
            default:
                $k = $p[0];
                if ($k === 'l' && find_by_id($C['layouts'], $p[1] ?? '')) { $s['sel'] = ['l' => $p[1]]; $s['step'] = 'm'; scr_len($chat, $mid, $p[1]); }
                elseif ($k === 'm' && isset($s['sel']['l'])) { $s['sel']['m'] = (float)$p[1]; $s['step'] = 'f'; scr_facade($chat, $mid); }
                elseif ($k === 'f' && find_by_id($C['facades'], $p[1] ?? '')) { $s['sel']['f'] = $p[1]; $s['step'] = 't'; scr_top($chat, $mid); }
                elseif ($k === 't' && find_by_id($C['tops'], $p[1] ?? '') && isset($s['sel']['f'])) { $s['sel']['t'] = $p[1]; $s['step'] = 'done'; scr_result($chat, $mid, $s['sel']); }
        }
        st_save($chat, $s);
    }
    tg('answerCallbackQuery', ['callback_query_id' => $q['id'], 'text' => $toast]);
    exit;
}

/* ───────── Сообщения ───────── */
$m = $u['message'] ?? null;
if (!$m) exit;
$chat = (int)$m['chat']['id'];
$text = trim((string)($m['text'] ?? ''));
$from = $m['from'] ?? [];
$private = ($m['chat']['type'] ?? '') === 'private';
$cmd = strtolower(explode('@', explode(' ', $text)[0])[0]);

if ($cmd === '/id') { tg('sendMessage', ['chat_id' => $chat, 'text' => "chat_id этого чата: {$chat}\nВпишите его в telegram_chat в api/config.php — сюда будут приходить заявки."]); exit; }
if (!$private) exit;                                              // в группах бот отвечает только на /id

$s = st_load($chat);
if ($cmd === '/start' || $cmd === '/menu' || $cmd === '/help') { scr_menu($chat, null); exit; }
if ($cmd === '/calc') { $s = ['step' => 'l', 'sel' => [], 'book' => []]; st_save($chat, $s); scr_layout($chat, null); exit; }
if ($cmd === '/zamer') { $s['step'] = 'city'; $s['book'] = []; st_save($chat, $s); scr_city($chat, null); exit; }
if ($cmd === '/contacts') { scr_info($chat, null); exit; }

if ($s['step'] === 'phone') {
    $raw = isset($m['contact']) ? (string)$m['contact']['phone_number'] : $text;
    $phone = norm_phone($raw);
    if ($phone === '') { tg('sendMessage', ['chat_id' => $chat, 'text' => 'Не получилось распознать номер. Нажмите «📱 Отправить мой номер» или напишите в формате +7 900 123-45-67.']); exit; }
    finish_booking($chat, $s, $phone, $from);
    exit;
}
if ($s['step'] === 'm' && preg_match('/^\d+([.,]\d+)?/', $text, $mm)) {
    $L = find_by_id($C['layouts'], $s['sel']['l'] ?? '');
    $v = (float)str_replace(',', '.', $mm[0]);
    if ($L && $v >= $L['min'] && $v <= $L['max']) { $s['sel']['m'] = round($v, 1); $s['step'] = 'f'; st_save($chat, $s); scr_facade($chat, null); exit; }
    tg('sendMessage', ['chat_id' => $chat, 'text' => "Для этой планировки длина от {$L['min']} до {$L['max']} м. Напишите число или выберите кнопкой выше."]);
    exit;
}
scr_menu($chat, null);
