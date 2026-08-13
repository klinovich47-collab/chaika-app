import { mkdir, copyFile, rm } from 'node:fs/promises';

const files = [
  'index.html',
  'app.js',
  'styles.css',
  'chaika-main.png',
  'chaika-point.png'
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of files) {
  await copyFile(file, `dist/${file}`);
}
console.log(`Prepared ${files.length} static files in dist/`);
