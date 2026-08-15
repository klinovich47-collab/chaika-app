import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';

const files = [
  'styles.css',
  'chaika-main.png',
  'chaika-point.png'
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of files) await copyFile(file, `dist/${file}`);

const index = await readFile('index.html', 'utf8');
const app = await readFile('app.js', 'utf8');
const live = await readFile('supabase-live.js', 'utf8');
const enhancements = await readFile('frontend-enhancements.js', 'utf8');
const safetyShare = await readFile('safety-share-enhancements.js', 'utf8');
const mapStress = await readFile('map-stress-enhancements.js', 'utf8');
const eventChat = await readFile('event-chat-enhancements.js', 'utf8');
const mapUiRev10 = await readFile('map-ui-rev10.js', 'utf8');

// Cache-bust the production bundle so Telegram WebView cannot keep an older app.js.
await writeFile('dist/index.html', index.replace('./app.js?rev=1', './app.js?rev=10'));
await writeFile('dist/app.js', `${app}\n\n${live}\n\n${enhancements}\n\n${safetyShare}\n\n${mapStress}\n\n${eventChat}\n\n${mapUiRev10}\n`);
console.log('Prepared CHAIKA production build with light map UI, hierarchical clustering and scrollable cluster sheets (rev=10).');
