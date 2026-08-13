# ЧАЙКА — Vercel fixed build

Эта сборка принудительно создаёт `dist/` при деплое.

Файлы в корне репозитория:
- index.html
- app.js
- styles.css
- onboard-intro.jpg
- onboard-point.png
- build.mjs
- package.json
- vercel.json

Vercel запустит `npm run build`, после чего опубликует папку `dist`.
