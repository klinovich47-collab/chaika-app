# ЧАЙКА

Telegram Mini App / web-карта событий Санкт-Петербурга.

## Production

- Frontend: Vercel, `https://chaika-app.vercel.app/`
- Telegram bot: `@chaika47bot`
- Backend/database: Supabase
- Static production build: `npm run build` → `dist/`

## Что уже работает

- карта и лента событий;
- ручной выбор точки на карте;
- группировка событий в одной координате, premium первыми;
- verified Telegram auth;
- создание и удаление собственных событий;
- «Мои события»;
- админская модерация;
- серверная проверка названия, описания и места со сленгом/обфускацией;
- ручной fallback для изображений, если AI moderation недоступна;
- deep links на конкретное событие через `@chaika47bot`;
- автоматический импорт публичных событий каждый час;
- KudaGo: общий поток + отдельные проходы по concert / party / festival;
- Union Bar: расписание с официального сайта;
- VNVNC: публичная афиша/Telegram как источник, когда появляются актуальные даты;
- синхронизация внешних музыкальных событий во вкладку «Концерты».

## Supabase

Актуальные Edge Functions лежат в `supabase/functions/`.
Последние изменения схемы — в `supabase/migrations/`.

Секреты **не хранить в GitHub**. В Supabase Secrets используются:

- `TELEGRAM_BOT_TOKEN` — обязателен;
- `OPENAI_API_KEY` — включает автоматическую `omni-moderation-latest` проверку текста и изображений;
- `TIMEPAD_TOKEN` — опциональный дополнительный источник.

Если `OPENAI_API_KEY` отсутствует, пользовательское событие с фотографией автоматически получает `review` и ждёт ручной проверки администратора.

## Персонаж

- `chaika-main.png` — основная чайка;
- `chaika-point.png` — чайка для шага создания события.
