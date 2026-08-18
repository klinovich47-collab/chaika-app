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
const forumAutoconfigRev12 = await readFile('forum-autoconfig-rev12.js', 'utf8');
const mapUiRev10 = await readFile('map-ui-rev10.js', 'utf8');
const darkShellRev11 = await readFile('dark-shell-rev11.js', 'utf8');
const interactionStabilityRev13 = await readFile('interaction-stability-rev13.js', 'utf8');
const profileActivityRev14 = await readFile('profile-activity-rev14.js', 'utf8');
const safeAreaRev16 = await readFile('safe-area-rev16.js', 'utf8');
const headerLayoutRev17 = await readFile('header-layout-rev17.js', 'utf8');
const supportFeedbackRev18 = await readFile('support-feedback-rev18.js', 'utf8');
const sheetGeolocationRev19 = await readFile('sheet-geolocation-rev19.js', 'utf8');
const sheetLayoutRev20 = await readFile('sheet-layout-rev20.js', 'utf8');
const museumExhibitionsRev21 = await readFile('museum-exhibitions-rev21.js', 'utf8');
const mapSourceToggleRev24 = await readFile('map-source-toggle-rev24.js', 'utf8');
const eventVisualsRev25 = await readFile('event-visuals-rev25.js', 'utf8');

// Cache-bust the production bundle so Telegram WebView cannot keep an older app.js.
await writeFile('dist/index.html', index.replace('./app.js?rev=1', './app.js?rev=35'));
await writeFile('dist/app.js', `${app}\n\n${live}\n\n${enhancements}\n\n${safetyShare}\n\n${mapStress}\n\n${eventChat}\n\n${forumAutoconfigRev12}\n\n${mapUiRev10}\n\n${darkShellRev11}\n\n${interactionStabilityRev13}\n\n${profileActivityRev14}\n\n${safeAreaRev16}\n\n${headerLayoutRev17}\n\n${supportFeedbackRev18}\n\n${sheetGeolocationRev19}\n\n${sheetLayoutRev20}\n\n${museumExhibitionsRev21}\n\n${mapSourceToggleRev24}\n\n${eventVisualsRev25}\n`);
console.log('Prepared CHAIKA production build with automatic safety checks and manual fallback (rev=35).');
