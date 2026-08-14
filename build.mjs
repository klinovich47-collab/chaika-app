import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';

const files = [
  'index.html',
  'styles.css',
  'chaika-main.png',
  'chaika-point.png'
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of files) await copyFile(file, `dist/${file}`);

const app = await readFile('app.js', 'utf8');
const live = await readFile('supabase-live.js', 'utf8');
const enhancements = await readFile('frontend-enhancements.js', 'utf8');
await writeFile('dist/app.js', `${app}\n\n${live}\n\n${enhancements}\n`);
console.log('Prepared CHAIKA static build with Supabase integration and frontend enhancements.');
