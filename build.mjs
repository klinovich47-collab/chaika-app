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
const eventVisualsRev25 = await readFile('event-visuals-rev25.js', 'utf8');
const userMapPivotRev36 = await readFile('user-map-pivot-rev36.js', 'utf8');
const quickCreateRev37 = await readFile('quick-create-rev37.js', 'utf8');
const mobilePolishRev39 = await readFile('mobile-polish-rev39.js', 'utf8');
const overlaySafeAreaRev40 = await readFile('overlay-safearea-rev40.js', 'utf8');
const webappLockRev41 = await readFile('webapp-lock-rev41.js', 'utf8');

// Creator-type switch is intentionally excluded: CHAIKA is people-only.
await writeFile('dist/index.html', index.replace('./app.js?rev=1', './app.js?rev=41'));
await writeFile('dist/app.js', `${app}\n\n${live}\n\n${enhancements}\n\n${safetyShare}\n\n${mapStress}\n\n${eventChat}\n\n${forumAutoconfigRev12}\n\n${mapUiRev10}\n\n${darkShellRev11}\n\n${interactionStabilityRev13}\n\n${profileActivityRev14}\n\n${safeAreaRev16}\n\n${headerLayoutRev17}\n\n${supportFeedbackRev18}\n\n${sheetGeolocationRev19}\n\n${sheetLayoutRev20}\n\n${museumExhibitionsRev21}\n\n${eventVisualsRev25}\n\n${userMapPivotRev36}\n\n${quickCreateRev37}\n\n${mobilePolishRev39}\n\n${overlaySafeAreaRev40}\n\n${webappLockRev41}\n`);
console.log('Prepared CHAIKA production build: locked Telegram viewport (rev=41).');
