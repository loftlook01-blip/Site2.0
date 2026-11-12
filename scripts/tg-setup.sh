#!/usr/bin/env bash
# Регистрация Telegram-бота: вебхук, команды и описание.
# Использование:
#   TG_TOKEN=123:ABC TG_SECRET=длинная-случайная-строка SITE_URL=https://dvina-kuhni.ru bash scripts/tg-setup.sh
# Секрет должен совпадать с webhook_secret в public/api/config.php (на сервере).
set -euo pipefail
: "${TG_TOKEN:?нужен TG_TOKEN от @BotFather}" "${TG_SECRET:?нужен TG_SECRET}" "${SITE_URL:?нужен SITE_URL, например https://dvina-kuhni.ru}"
API="https://api.telegram.org/bot${TG_TOKEN}"
post() { curl -sS -X POST "$API/$1" -H 'Content-Type: application/json' -d "$2"; echo; }
post setWebhook "{\"url\":\"${SITE_URL}/api/tg.php\",\"secret_token\":\"${TG_SECRET}\",\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}"
post setMyCommands '{"commands":[{"command":"calc","description":"Рассчитать кухню"},{"command":"zamer","description":"Записаться на бесплатный замер"},{"command":"contacts","description":"Адрес и телефон"},{"command":"id","description":"Показать chat_id (для настройки)"}]}'
post setMyShortDescription '{"short_description":"Рассчитаю кухню на заказ за минуту и запишу на бесплатный замер. Архангельск, Северодвинск, Новодвинск."}'
post setMyDescription '{"description":"Кухни и мебель на заказ с собственного производства в Архангельске. Посчитаю ориентировочную стоимость и запишу на бесплатный замер."}'
echo "Готово. Проверка: curl $API/getWebhookInfo"
