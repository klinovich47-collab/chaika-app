const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#0b0b0d'); tg.setBackgroundColor('#0b0b0d'); }

const DAY = 86400000;
const bootNow = new Date();
const dateISO = (offset = 0) => new Date(bootNow.getTime() + offset * DAY).toISOString().slice(0,10);
const iconCategories = [
  ['guitar','Гитара','i-guitar'],['music','Музыка','i-music'],['mic','Микрофон','i-mic'],['drink','Посиделки','i-drink'],['chess','Шахматы','i-chess'],
  ['chat','Поговорить','i-chat'],['coffee','Кофе','i-coffee'],['game','Игры','i-game'],['art','Творчество','i-art'],['walk','Прогулка','i-walk'],
  ['sport','Спорт','i-sport'],['dog','С собакой','i-dog'],['study','Учёба','i-study'],['dating','Знакомства','i-heart'],['party','Вечеринка','i-party'],['other','Другое','i-other']
];
const categoryMap = Object.fromEntries(iconCategories.map(x => [x[0], {label:x[1], icon:x[2]}]));
const categoryColors={guitar:'#ff9f43',music:'#a66cff',mic:'#ff5f9e',drink:'#ff7a59',chess:'#59d8ff',chat:'#72e6a6',coffee:'#c89b6d',game:'#54a8ff',art:'#ff6fd8',walk:'#79e67b',sport:'#47d7ff',dog:'#f3c65b',study:'#8b8cff',dating:'#ff667d',party:'#ff4f8b',other:'#b7b7c2'};
function catStyle(key){return `style="--cat-color:${categoryColors[key]||categoryColors.other}"`;}

const seedEvents = [
  {id:'evt_1',title:'Играем на гитаре у Новой Голландии',category:'guitar',date:dateISO(0),time:'19:30',price:0,venue:'Новая Голландия',lat:59.9293,lng:30.2892,ageLimit:0,promoted:false,description:'Берём гитару, садимся на траве. Можно приходить со своим инструментом.',going:8,owner:false,type:'planned'},
  {id:'evt_2',title:'Хочу поболтать в Таврическом',category:'chat',date:dateISO(0),time:new Date().toTimeString().slice(0,5),price:0,venue:'Таврический сад',lat:59.9478,lng:30.3723,ageLimit:18,promoted:false,description:'Сижу у пруда ещё примерно час. Можно просто подойти познакомиться и поговорить.',going:2,owner:false,type:'instant',expiresAt:Date.now()+60*60*1000},
  {id:'evt_3',title:'Шахматы и кофе',category:'chess',date:dateISO(0),time:'18:00',price:0,venue:'Петроградская сторона',lat:59.9614,lng:30.3125,ageLimit:0,promoted:false,description:'Несколько досок, уровень любой. Кофе берём рядом.',going:11,owner:false,type:'planned'},
  {id:'evt_4',title:'Ночной квартирник на Лиговке',category:'music',date:dateISO(0),time:'21:00',price:500,venue:'Лиговский проспект',lat:59.9278,lng:30.3609,ageLimit:18,promoted:true,description:'Живой сет, небольшой бар и ограниченное количество мест.',going:34,owner:false,type:'planned'},
  {id:'evt_5',title:'Рисуем городской скетч',category:'art',date:dateISO(1),time:'17:30',price:0,venue:'Севкабель Порт',lat:59.9241,lng:30.2417,ageLimit:0,promoted:false,description:'Берите скетчбук. Рисуем город и знакомимся.',going:15,owner:false,type:'planned'},
  {id:'evt_6',title:'Фрисби после работы',category:'sport',date:dateISO(3),time:'19:00',price:0,venue:'Парк 300-летия',lat:59.9827,lng:30.1992,ageLimit:0,promoted:false,description:'Обычная дружеская игра, без подготовки.',going:6,owner:false,type:'planned'},
  {id:'evt_7',title:'Техно-вечеринка',category:'party',date:dateISO(12),time:'23:00',price:1500,venue:'Обводный канал',lat:59.9139,lng:30.3467,ageLimit:18,promoted:true,description:'Два танцпола и локальные артисты.',going:87,owner:false,type:'planned'}
];
const concerts = [
  {id:'c1',artist:'Большой концерт · Artist A',date:new Date(bootNow.getTime()+42*DAY),venue:'СКА Арена',price:'от 2 900 ₽',genre:'pop',url:'https://example.com/?ref=tuda'},
  {id:'c2',artist:'Artist B · Live',date:new Date(bootNow.getTime()+97*DAY),venue:'А2',price:'от 3 500 ₽',genre:'rock',url:'https://example.com/?ref=tuda'},
  {id:'c3',artist:'Electronic Night · Artist C',date:new Date(bootNow.getTime()+166*DAY),venue:'Севкабель Порт',price:'от 2 400 ₽',genre:'electronic',url:'https://example.com/?ref=tuda'},
  {id:'c4',artist:'Artist D · Stadium Show',date:new Date(bootNow.getTime()+280*DAY),venue:'Газпром Арена',price:'от 4 900 ₽',genre:'pop',url:'https://example.com/?ref=tuda'}
];

const state = {
  events: JSON.parse(localStorage.getItem('tuda_events') || 'null') || seedEvents,
  going: new Set(JSON.parse(localStorage.getItem('tuda_going') || '[]')),
  time:'today', categories:new Set(), price:null, distance:0, query:'', selectedId:null, markers:[], userLocation:null, nearbyMode:false, eventType:'planned', concertGenre:'all', refCount:Number(localStorage.getItem('tuda_refCount')||0)
};
const user = tg?.initDataUnsafe?.user || {first_name:'Илья',username:'telegram_user'};
const startParam = tg?.initDataUnsafe?.start_param || new URLSearchParams(location.search).get('tgWebAppStartParam');
if (startParam?.includes('ref_') && !sessionStorage.getItem('tuda_refCounted')) { state.refCount++; localStorage.setItem('tuda_refCount',String(state.refCount)); sessionStorage.setItem('tuda_refCounted','1'); }

const map = L.map('map',{zoomControl:false,attributionControl:true}).setView([59.9343,30.3351],12);
map.attributionControl.setPrefix(false);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
L.control.zoom({position:'topright'}).addTo(map);

const $ = id => document.getElementById(id);
const els = {sheet:$('eventSheet'),feed:$('feedList'),eventCount:$('eventCount'),empty:$('mapEmpty'),form:$('eventForm'),toast:$('toast'),search:$('searchInput'),filterModal:$('filterModal'),moderationModal:$('moderationModal'),detail:$('eventDetailView'),detailBody:$('eventDetailBody'),detailHero:$('eventDetailHero'),detailHeroIcon:$('eventDetailHeroIcon'),photoInput:$('eventPhotoInput'),photoPreview:$('photoPreview'),removePhotoBtn:$('removePhotoBtn'),nearbyBtn:$('nearbyFeedBtn')};
let pendingPhotoData='';
function svgIcon(id, cls=''){ return `<svg class="${cls}" viewBox="0 0 24 24"><use href="#${id}"/></svg>`; }
function persist(){ localStorage.setItem('tuda_events',JSON.stringify(state.events)); localStorage.setItem('tuda_going',JSON.stringify([...state.going])); }
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function parseEventDate(e){return new Date(`${e.date}T${e.time||'00:00'}:00`)}
function formatDate(e){if(e.type==='instant')return 'Сейчас';const d=e.date===dateISO(0)?'Сегодня':e.date===dateISO(1)?'Завтра':new Date(e.date+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short'});return `${d}, ${e.time}`}
function kmBetween(a,b){const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]),la1=rad(a[0]),la2=rad(b[0]);const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function isWithinTime(e){const n=new Date();const d=parseEventDate(e);if(state.time==='now')return e.type==='instant' && (!e.expiresAt || e.expiresAt>Date.now());if(e.type==='instant' && state.time==='today')return !e.expiresAt || e.expiresAt>Date.now();if(state.time==='today')return e.date===dateISO(0);if(state.time==='tomorrow')return e.date===dateISO(1);const days=(new Date(e.date+'T23:59')-n)/DAY;if(state.time==='week')return days>=0&&days<=7;if(state.time==='month')return days>=0&&days<=30;return true}
function filteredEvents(){const q=state.query.trim().toLowerCase();const list=state.events.filter(e=>{if(!isWithinTime(e))return false;if(state.categories.size&&!state.categories.has(e.category))return false;if(state.price==='free'&&Number(e.price)!==0)return false;if(state.price==='paid'&&Number(e.price)===0)return false;if(q&&!`${e.title} ${e.description} ${e.venue} ${categoryMap[e.category]?.label||''}`.toLowerCase().includes(q))return false;if(state.distance&&state.userLocation&&kmBetween(state.userLocation,[e.lat,e.lng])>state.distance)return false;if(state.nearbyMode&&state.userLocation&&kmBetween(state.userLocation,[e.lat,e.lng])>3)return false;return true});if(state.nearbyMode&&state.userLocation)return list.sort((a,b)=>kmBetween(state.userLocation,[a.lat,a.lng])-kmBetween(state.userLocation,[b.lat,b.lng]));return list.sort((a,b)=>Number(b.promoted)-Number(a.promoted)||parseEventDate(a)-parseEventDate(b))}
function markerIcon(e){const icon=categoryMap[e.category]?.icon||'i-other';const color=categoryColors[e.category]||categoryColors.other;return L.divIcon({className:'',html:`<div class="${e.promoted?'premium-marker':'regular-marker'}" style="--cat-color:${color}">${svgIcon(icon,'marker-svg')}</div>`,iconSize:e.promoted?[46,46]:[38,38],iconAnchor:e.promoted?[23,23]:[19,19]})}
function renderMap(){state.markers.forEach(m=>map.removeLayer(m));state.markers=[];const list=filteredEvents();els.empty.classList.toggle('hidden',list.length>0);list.forEach(e=>{const m=L.marker([e.lat,e.lng],{icon:markerIcon(e),bubblingMouseEvents:false}).addTo(map);m.on('click',()=>showEvent(e.id));state.markers.push(m)});renderFeed()}
function eventCoverClass(e){return `cover-${e.category||'other'}`}
function closeEventSheet(){state.selectedId=null;els.sheet.classList.add('hidden')}
function showEvent(id){const e=state.events.find(x=>x.id===id);if(!e)return;state.selectedId=id;map.panTo([e.lat,e.lng],{animate:true});const cat=categoryMap[e.category]||categoryMap.other;const photo=e.imageData?`<img class="event-sheet-cover-photo" src="${e.imageData}" alt="">`:'';els.sheet.innerHTML=`<button class="event-sheet-cover ${eventCoverClass(e)} ${e.imageData?'has-photo':''}" data-open-detail="${e.id}" type="button" aria-label="Открыть событие">${photo}<span class="event-sheet-cover-icon">${svgIcon(cat.icon)}</span><span class="event-sheet-cover-hint">Открыть событие</span></button><div class="sheet-row"><div class="event-type-icon" ${catStyle(e.category)}>${svgIcon(cat.icon)}</div><div class="event-main">${e.promoted?'<span class="badge">ПРЕМИУМ</span>':''}${e.type==='instant'?'<span class="badge live-badge">СЕЙЧАС</span>':''}<h3 class="event-title">${escapeHtml(e.title)}</h3><div class="event-meta">${formatDate(e)} · ${e.price?e.price+' ₽':'Бесплатно'}<br>${escapeHtml(e.venue)} · ${e.ageLimit}+</div></div></div><p class="event-meta">${escapeHtml(e.description||'')}</p><div class="actions"><button class="primary-btn" data-going="${e.id}">${state.going.has(e.id)?'Вы идёте':'Пойду'} · ${e.going+(state.going.has(e.id)?1:0)}</button><button class="secondary-btn" data-share="${e.id}">Поделиться</button></div>`;els.sheet.classList.remove('hidden');els.sheet.querySelector('[data-open-detail]').onclick=()=>openEventDetail(e.id);els.sheet.querySelector('[data-going]').onclick=()=>toggleGoing(e.id);els.sheet.querySelector('[data-share]').onclick=()=>shareEvent(e.id)}
function openEventDetail(id){const e=state.events.find(x=>x.id===id);if(!e)return;const cat=categoryMap[e.category]||categoryMap.other;els.detail.dataset.eventId=id;els.detailHero.className=`event-detail-hero ${eventCoverClass(e)} ${e.imageData?'has-photo':''}`;els.detailHero.querySelectorAll('.event-detail-photo').forEach(x=>x.remove());if(e.imageData){const img=document.createElement('img');img.className='event-detail-photo';img.src=e.imageData;img.alt='';els.detailHero.prepend(img)}els.detailHeroIcon.innerHTML=svgIcon(cat.icon);els.detailBody.innerHTML=`${e.promoted?'<span class="badge">ПРЕМИУМ</span>':''}${e.type==='instant'?'<span class="badge live-badge">СЕЙЧАС</span>':''}<h2>${escapeHtml(e.title)}</h2><div class="detail-meta-row"><span>${formatDate(e)}</span><span>${e.price?e.price+' ₽':'Бесплатно'}</span><span>${escapeHtml(e.venue)}</span><span>${e.ageLimit}+</span></div><div class="detail-section"><h3>О событии</h3><p>${escapeHtml(e.description||'Описание пока не добавлено.')}</p></div><div class="detail-section"><h3>Активность</h3><p>${escapeHtml(cat.label)} · ${e.going+(state.going.has(e.id)?1:0)} ${state.going.has(e.id)?'включая вас':''}</p></div><div class="detail-actions"><button class="primary-btn" data-detail-going="${e.id}">${state.going.has(e.id)?'Вы идёте':'Пойду'}</button><button class="secondary-btn" data-detail-share="${e.id}">Поделиться</button></div>`;els.detail.classList.remove('hidden');els.detail.setAttribute('aria-hidden','false');els.detailBody.querySelector('[data-detail-going]').onclick=()=>{toggleGoing(e.id);openEventDetail(e.id)};els.detailBody.querySelector('[data-detail-share]').onclick=()=>shareEvent(e.id);tg?.BackButton?.show?.()}
function closeEventDetail(){els.detail.classList.add('hidden');els.detail.setAttribute('aria-hidden','true');tg?.BackButton?.hide?.()}
function renderFeed(){const list=filteredEvents();els.eventCount.textContent=`${list.length}`;if(els.nearbyBtn){els.nearbyBtn.classList.toggle('active',state.nearbyMode);els.nearbyBtn.setAttribute('aria-pressed',String(state.nearbyMode));}els.feed.innerHTML=list.length?list.map(e=>{const c=categoryMap[e.category]||categoryMap.other;const dist=state.userLocation?kmBetween(state.userLocation,[e.lat,e.lng]):null;const distanceText=dist!==null?` · ${dist<1?Math.max(50,Math.round(dist*1000/50)*50)+' м':dist.toFixed(1)+' км'}`:'';return `<article class="feed-card ${e.promoted?'promoted':''}"><div class="activity-icon" ${catStyle(e.category)}>${svgIcon(c.icon)}</div><div>${e.promoted?'<span class="badge">ПРЕМИУМ</span>':''}${e.type==='instant'?'<span class="badge live-badge">СЕЙЧАС</span>':''}<h3>${escapeHtml(e.title)}</h3><p>${formatDate(e)} · ${e.price?e.price+' ₽':'Бесплатно'} · ${escapeHtml(e.venue)}${distanceText}<br>${escapeHtml(c.label)}</p><div class="mini-actions"><button data-map="${e.id}">На карте</button><button data-going="${e.id}">${state.going.has(e.id)?'Иду ✓':'Пойду'}</button></div></div></article>`}).join(''):`<div class="empty-feed">${state.nearbyMode?'Рядом пока нет подходящих событий. Попробуй другой фильтр или отключи «Рядом».':'Ничего не найдено.'}</div>`;els.feed.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>openOnMap(b.dataset.map));els.feed.querySelectorAll('[data-going]').forEach(b=>b.onclick=()=>toggleGoing(b.dataset.going))}
function toggleGoing(id){state.going.has(id)?state.going.delete(id):state.going.add(id);persist();renderFeed();if(state.selectedId===id)showEvent(id);updateProfile();tg?.HapticFeedback?.impactOccurred('light')}
function openOnMap(id){switchView('mapView');setTimeout(()=>showEvent(id),80)}
async function shareEvent(id){const bot='eventmap_demo_bot';const ref=user.id||'guest';const url=`https://t.me/${bot}?startapp=event_${id}_ref_${ref}`;const e=state.events.find(x=>x.id===id);const share=`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Смотри событие: '+e.title)}`;if(tg?.openTelegramLink)tg.openTelegramLink(share);else if(navigator.share)await navigator.share({title:e.title,url});else toast('Ссылка: '+url)}
function switchView(viewId){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id===viewId));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===viewId));els.sheet.classList.add('hidden');const showSearch=['mapView','feedView'].includes(viewId);$('globalSearch').classList.toggle('hidden',!showSearch);document.querySelector('.time-filters').classList.toggle('hidden',!showSearch);if(viewId==='mapView')setTimeout(()=>map.invalidateSize(),60);if(viewId==='feedView')renderFeed();if(viewId==='concertsView')renderConcerts();if(viewId==='profileView')updateProfile()}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
map.on('click',()=>closeEventSheet());
$('eventDetailBack').onclick=closeEventDetail;
if(tg?.BackButton)tg.BackButton.onClick(()=>{if(!els.detail.classList.contains('hidden'))closeEventDetail()});

document.querySelectorAll('[data-time]').forEach(ch=>ch.addEventListener('click',()=>{state.time=ch.dataset.time;document.querySelectorAll('[data-time]').forEach(x=>x.classList.toggle('active',x===ch));els.sheet.classList.add('hidden');renderMap()}));
els.search.addEventListener('input',()=>{state.query=els.search.value;renderMap()});

function renderCategoryUI(){const picker=$('iconPicker');picker.innerHTML=iconCategories.map(([key,label,icon],i)=>`<button type="button" class="icon-choice ${i===0?'active':''}" ${catStyle(key)} data-pick="${key}" title="${label}" aria-label="${label}">${svgIcon(icon)}<span>${label}</span></button>`).join('');picker.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{picker.querySelectorAll('.icon-choice').forEach(x=>x.classList.toggle('active',x===b));$('categoryInput').value=b.dataset.pick});const filters=$('categoryFilters');filters.innerHTML=iconCategories.map(([key,label,icon])=>`<button type="button" class="category-filter" ${catStyle(key)} data-cat="${key}">${svgIcon(icon)}<span>${label}</span></button>`).join('');filters.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.categories.has(b.dataset.cat)?state.categories.delete(b.dataset.cat):state.categories.add(b.dataset.cat);b.classList.toggle('active');renderMap()})}
renderCategoryUI();

$('openFiltersBtn').onclick=()=>{els.filterModal.classList.remove('hidden');els.filterModal.setAttribute('aria-hidden','false')};document.querySelectorAll('[data-close-modal]').forEach(x=>x.onclick=()=>{els.filterModal.classList.add('hidden');els.filterModal.setAttribute('aria-hidden','true')});document.querySelectorAll('[data-price]').forEach(b=>b.onclick=()=>{state.price=state.price===b.dataset.price?null:b.dataset.price;document.querySelectorAll('[data-price]').forEach(x=>x.classList.toggle('active',x.dataset.price===state.price));renderMap()});$('distanceFilter').onchange=e=>{state.distance=Number(e.target.value);if(state.distance&&!state.userLocation)requestLocation(false);renderMap()};$('resetFiltersBtn').onclick=()=>{state.categories.clear();state.price=null;state.distance=0;document.querySelectorAll('.category-filter,[data-price]').forEach(x=>x.classList.remove('active'));$('distanceFilter').value='0';renderMap()};

function requestLocation(center=true,onSuccess=null){if(!navigator.geolocation){toast('Геолокация недоступна');return}navigator.geolocation.getCurrentPosition(pos=>{state.userLocation=[pos.coords.latitude,pos.coords.longitude];if(center)map.setView(state.userLocation,14);L.circleMarker(state.userLocation,{radius:6,color:'#d8ff43',fillColor:'#d8ff43',fillOpacity:1,weight:2}).addTo(map);els.form.lat.value=state.userLocation[0].toFixed(6);els.form.lng.value=state.userLocation[1].toFixed(6);onSuccess?.();renderMap();toast('Геолокация определена')},()=>toast('Разреши доступ к геолокации, чтобы показать события рядом'))}
$('locationBtn').onclick=()=>requestLocation(true);$('useLocationBtn').onclick=()=>requestLocation(false);
if(els.nearbyBtn)els.nearbyBtn.onclick=()=>{if(state.nearbyMode){state.nearbyMode=false;renderFeed();return}const enableNearby=()=>{state.nearbyMode=true;renderFeed()};if(state.userLocation)enableNearby();else requestLocation(false,enableNearby)};

function setEventType(type){state.eventType=type;document.querySelectorAll('[data-event-type]').forEach(b=>b.classList.toggle('active',b.dataset.eventType===type));$('plannedFields').classList.toggle('hidden',type!=='planned');$('instantFields').classList.toggle('hidden',type!=='instant')}
document.querySelectorAll('[data-event-type]').forEach(b=>b.onclick=()=>setEventType(b.dataset.eventType));
els.form.date.min=dateISO(0);els.form.date.max=dateISO(30);els.form.date.value=dateISO(0);els.form.time.value='20:00';
function resetPhotoUI(){pendingPhotoData='';if(els.photoInput)els.photoInput.value='';if(els.photoPreview)els.photoPreview.innerHTML=svgIcon('i-plus');$('photoUploadTitle').textContent='Добавить фотографию';els.removePhotoBtn?.classList.add('hidden')}
function compressPhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.78))};img.src=reader.result};reader.readAsDataURL(file)})}
if(els.photoInput)els.photoInput.addEventListener('change',async()=>{const file=els.photoInput.files?.[0];if(!file)return resetPhotoUI();if(!file.type.startsWith('image/')){toast('Выбери изображение');return resetPhotoUI()}if(file.size>12*1024*1024){toast('Файл слишком большой');return resetPhotoUI()}try{pendingPhotoData=await compressPhoto(file);els.photoPreview.innerHTML=`<img src="${pendingPhotoData}" alt="Предпросмотр фотографии">`;$('photoUploadTitle').textContent='Фотография добавлена';els.removePhotoBtn.classList.remove('hidden')}catch{toast('Не удалось обработать фотографию');resetPhotoUI()}});
els.removePhotoBtn?.addEventListener('click',resetPhotoUI);

const hardBlockPatterns=[/наркот|закладк|героин|кокаин|амфетамин|оружи|взрывчат|террор|экстрем|проституц|купить\s+паспорт|продам\s+паспорт/i];
const profanityPatterns=[/\b(хуй|хуя|хуе|пизд|ебан|ёбан|ебат|бляд|сука)\w*/i];
const suspiciousPatterns=[/без\s+правил/i,/секретн\w*\s+адрес/i,/только\s+налич/i,/100%\s+заработ/i,/лёгк\w*\s+деньг/i];
function moderate(text){if(hardBlockPatterns.some(r=>r.test(text)))return {status:'block',title:'Публикация отклонена',text:'Обнаружены признаки запрещённого или опасного содержания. В боевой версии такое событие не будет опубликовано.'};if(profanityPatterns.some(r=>r.test(text)))return {status:'review',title:'Нужно исправить текст',text:'В названии или описании обнаружена грубая лексика. Переформулируй текст — так карточка будет понятнее и аккуратнее.'};if(suspiciousPatterns.some(r=>r.test(text)))return {status:'review',title:'Нужна ручная проверка',text:'Система обнаружила формулировки, которые требуют проверки модератором. В боевой версии событие попадёт в очередь review.'};return {status:'ok',title:'Проверка пройдена',text:'Событие прошло автоматическую проверку и опубликовано в локальном MVP.'}}
function showModeration(result,onOk){$('moderationIcon').className=`moderation-icon ${result.status}`;$('moderationIcon').textContent=result.status==='ok'?'✓':result.status==='review'?'!':'×';$('moderationTitle').textContent=result.title;$('moderationText').textContent=result.text;els.moderationModal.classList.remove('hidden');$('moderationOkBtn').onclick=()=>{els.moderationModal.classList.add('hidden');onOk?.()}}

els.form.addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(els.form).entries());if(state.eventType==='planned'){const chosen=new Date(`${data.date}T12:00`);const max=new Date(`${dateISO(30)}T23:59`);if(chosen<new Date(`${dateISO(0)}T00:00`)||chosen>max)return showModeration({status:'block',title:'Дата вне диапазона',text:'Пользовательские события можно создавать только на ближайшие 30 дней.'})}const mod=moderate(`${data.title} ${data.description||''}`);if(mod.status!=='ok')return showModeration(mod);const event={id:`evt_${Date.now()}`,title:data.title.trim(),category:data.category,date:state.eventType==='instant'?dateISO(0):data.date,time:state.eventType==='instant'?new Date().toTimeString().slice(0,5):data.time,price:Number(data.price||0),venue:data.venue.trim(),lat:Number(data.lat),lng:Number(data.lng),ageLimit:Number(data.ageLimit||0),promoted:data.promoted==='on',description:(data.description||'').trim(),ticketUrl:data.ticketUrl||'',imageData:pendingPhotoData,going:0,owner:true,type:state.eventType,expiresAt:state.eventType==='instant'?Date.now()+Number(data.duration||60)*60*1000:null};state.events.unshift(event);persist();showModeration(mod,()=>{els.form.reset();resetPhotoUI();els.form.date.min=dateISO(0);els.form.date.max=dateISO(30);els.form.date.value=dateISO(0);els.form.time.value='20:00';$('categoryInput').value='guitar';document.querySelectorAll('.icon-choice').forEach((x,i)=>x.classList.toggle('active',i===0));setEventType('planned');renderMap();updateProfile();switchView('mapView');setTimeout(()=>{map.setView([event.lat,event.lng],14);showEvent(event.id)},100);tg?.HapticFeedback?.notificationOccurred('success')})});

function renderConcerts(){const list=concerts.filter(c=>state.concertGenre==='all'||c.genre===state.concertGenre);$('concertList').innerHTML=list.map(c=>`<article class="concert-card"><div class="concert-visual"><span class="badge">${c.genre.toUpperCase()}</span><strong>${escapeHtml(c.artist)}</strong></div><div class="concert-body"><div class="concert-meta">${c.date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}<br>${escapeHtml(c.venue)}</div><div class="concert-bottom"><b>${c.price}</b><button data-buy="${c.id}">Купить билет ↗</button></div></div></article>`).join('');$('concertList').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const c=concerts.find(x=>x.id===b.dataset.buy);if(tg?.openLink)tg.openLink(c.url);else window.open(c.url,'_blank')})}
document.querySelectorAll('[data-concert]').forEach(b=>b.onclick=()=>{state.concertGenre=b.dataset.concert;document.querySelectorAll('[data-concert]').forEach(x=>x.classList.toggle('active',x===b));renderConcerts()});

function updateProfile(){$('profileName').textContent=user.first_name||'Пользователь';$('profileUsername').textContent=user.username?'@'+user.username:'Telegram Mini App';$('avatar').textContent=(user.first_name||'П')[0].toUpperCase();$('goingStat').textContent=state.going.size;$('createdStat').textContent=state.events.filter(e=>e.owner).length;$('refStat').textContent=state.refCount}
$('resetBtn').onclick=()=>{localStorage.removeItem('tuda_events');localStorage.removeItem('tuda_going');localStorage.removeItem('tuda_refCount');location.reload()};
function toast(message){els.toast.textContent=message;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),1900)}


const MASCOT_URL="./chaika-main.png?rev=2";
const MASCOT_POINT_URL="./chaika-point.png?rev=2";
const onboardingSteps=[
  {kicker:'ЗНАКОМСТВО',title:'Покажу, как тут всё работает',text:'На карте — события вокруг тебя. Быстро покажу основные кнопки.',speech:'Йоу! Я Чайка',mascot:MASCOT_URL,button:'Начать'},
  {kicker:'КАРТА',title:'Смотри, что происходит рядом',text:'Тут события на карте. Нажимай на маркеры и выбирай, куда пойти.',speech:'Вот что рядом',mascot:MASCOT_URL,button:'Дальше'},
  {kicker:'ЛЕНТА',title:'Листай события списком',text:'В ленте удобно смотреть фото, расстояние, время и кто идёт.',speech:'Можно и так',mascot:MASCOT_URL,button:'Дальше'},
  {kicker:'СОЗДАТЬ',title:'Создай своё событие',text:'Нажми +, выбери иконку, добавь одно фото, место и время.',speech:'Теперь твоя очередь',mascot:MASCOT_POINT_URL,button:'Понял!'}
]
let onboardingStep=0;
const onboardingEl=$('onboarding'), onboardingDots=$('onboardingDots');
function renderOnboarding(){
  const step=onboardingSteps[onboardingStep], card=onboardingEl.querySelector('.onboarding-card');
  card.dataset.step=String(onboardingStep);
  $('onboardingKicker').textContent=step.kicker;$('onboardingTitle').textContent=step.title;$('onboardingText').textContent=step.text;$('onboardingSpeech').textContent=step.speech;
  const mascot=$('onboardingMascot'); if(mascot){ mascot.classList.remove('mascot-fallback'); mascot.style.display='block'; mascot.src=step.mascot; mascot.onload=()=>{ const fb=document.getElementById('mascotFallbackCard'); if(fb) fb.hidden=true; }; mascot.onerror=()=>{ mascot.classList.add('mascot-fallback'); mascot.style.display='none'; const fb=document.getElementById('mascotFallbackCard'); if(fb) fb.hidden=false; }; const fb=document.getElementById('mascotFallbackCard'); if(fb) fb.hidden=true; }
  $('onboardingNext').textContent=step.button;
  onboardingDots.innerHTML=onboardingSteps.map((_,i)=>`<button class="onboarding-dot ${i===onboardingStep?'active':''}" type="button" aria-label="Шаг ${i+1}"></button>`).join('');
  onboardingDots.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{onboardingStep=i;renderOnboarding()});
}
function closeOnboarding(){localStorage.setItem('chaika_onboarding_clean_2','done');onboardingEl.classList.add('hidden');onboardingEl.setAttribute('aria-hidden','true');tg?.HapticFeedback?.impactOccurred('light')}
function showOnboarding(){onboardingStep=0;renderOnboarding();onboardingEl.classList.remove('hidden');onboardingEl.setAttribute('aria-hidden','false')}
$('onboardingNext')?.addEventListener('click',()=>{if(onboardingStep<onboardingSteps.length-1){onboardingStep++;renderOnboarding();tg?.HapticFeedback?.selectionChanged()}else closeOnboarding()});
$('onboardingSkip')?.addEventListener('click',closeOnboarding);$('onboardingSkipTop')?.addEventListener('click',closeOnboarding);
if(!localStorage.getItem('chaika_onboarding_clean_2'))setTimeout(showOnboarding,220);

renderMap();renderConcerts();updateProfile();


/* CHAIKA Supabase + verified Telegram Mini App integration. */
const CHAIKA_DB_URL='https://vxebzzwquvgzpbktjigp.supabase.co';
const CHAIKA_DB_KEY='sb_publishable_xkcPYIVEkGc2QZ0AsCU1qA_g3BywKNA';
const CHAIKA_EDGE_JWT='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZWJ6endxdXZnenBia3RqaWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NTAzMzYsImV4cCI6MjEwMjIyNjMzNn0.jJusld8wIoMigOPWj92hm3xyVajlgYmsCFf5Ki9OYAU';
const CHAIKA_CLIENT_KEY='chaika_client_key_v1';
const CHAIKA_CREATED_KEY='chaika_created_ids';
const chaikaAuth={status:'idle',user:null,error:null,createdIds:[]};

function chaikaClientKey(){let key=localStorage.getItem(CHAIKA_CLIENT_KEY);if(!key){key=window.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});localStorage.setItem(CHAIKA_CLIENT_KEY,key)}return key}
const chaikaClientId=chaikaClientKey();
state.createdIds=new Set(JSON.parse(localStorage.getItem(CHAIKA_CREATED_KEY)||'[]'));

async function chaikaRequest(path,{method='GET',body=null}={}){const response=await fetch(`${CHAIKA_DB_URL}/rest/v1/${path}`,{method,headers:{apikey:CHAIKA_DB_KEY,'Content-Type':'application/json','Accept':'application/json'},body:body===null?null:JSON.stringify(body)});const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!response.ok){const error=new Error(typeof data==='string'?data:(data?.message||`HTTP ${response.status}`));error.status=response.status;error.data=data;throw error}return data}
async function chaikaEdge(name,payload){const response=await fetch(`${CHAIKA_DB_URL}/functions/v1/${name}`,{method:'POST',headers:{apikey:CHAIKA_DB_KEY,Authorization:`Bearer ${CHAIKA_EDGE_JWT}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json().catch(()=>({}));if(!response.ok||data?.ok===false){const error=new Error(data?.error||`HTTP ${response.status}`);error.status=response.status;error.data=data;throw error}return data}
function chaikaDateParts(value){const d=new Date(value),pad=n=>String(n).padStart(2,'0');return {date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`}}
function chaikaEvent(row){const start=chaikaDateParts(row.starts_at),mine=state.going.has(row.id);return {id:row.id,title:row.title,category:row.category,date:start.date,time:start.time,price:Number(row.price_rub||0),venue:row.venue,lat:Number(row.lat),lng:Number(row.lng),ageLimit:Number(row.age_limit||0),promoted:Boolean(row.promoted),description:row.description||'',ticketUrl:row.ticket_url||'',imageData:row.image_url||'',going:Math.max(0,Number(row.going_count||0)-(mine?1:0)),owner:state.createdIds.has(row.id),source:row.source||null,type:row.event_type||'planned',expiresAt:row.expires_at?new Date(row.expires_at).getTime():null}}
function chaikaConcert(row){return {id:row.id,artist:row.title||row.artist,date:new Date(row.starts_at),venue:row.venue,price:row.price_label||'',genre:row.genre||'other',url:row.ticket_url}}

async function chaikaLoadEvents(showError=false){try{const from=new Date(Date.now()-6*60*60*1000).toISOString(),to=new Date(Date.now()+31*DAY).toISOString();const q=new URLSearchParams();q.set('select','id,title,category,event_type,starts_at,expires_at,price_rub,venue,lat,lng,age_limit,description,ticket_url,image_url,promoted,going_count,source');q.append('starts_at',`gte.${from}`);q.append('starts_at',`lte.${to}`);q.set('order','promoted.desc,starts_at.asc');const rows=await chaikaRequest(`events?${q}`);state.events=(rows||[]).map(chaikaEvent);renderMap();updateProfile();return true}catch(error){console.error('CHAIKA Supabase events',error);if(showError)toast('Не удалось обновить события');return false}}
async function chaikaLoadConcerts(){try{const q=new URLSearchParams();q.set('select','id,artist,title,starts_at,venue,genre,price_label,ticket_url');q.append('starts_at',`gte.${new Date().toISOString()}`);q.append('starts_at',`lte.${new Date(Date.now()+366*DAY).toISOString()}`);q.set('order','starts_at.asc');const rows=await chaikaRequest(`concerts?${q}`);if(rows?.length){concerts.splice(0,concerts.length,...rows.map(chaikaConcert));renderConcerts()}return true}catch(error){console.error('CHAIKA Supabase concerts',error);return false}}
async function chaikaSync(){await Promise.all([chaikaLoadEvents(false),chaikaLoadConcerts()])}

const originalUpdateProfile=updateProfile;
updateProfile=function(){originalUpdateProfile();const name=$('profileName'),username=$('profileUsername'),avatar=$('avatar'),created=$('createdStat');if(chaikaAuth.status==='ready'&&chaikaAuth.user){const u=chaikaAuth.user;name.textContent=[u.first_name,u.last_name].filter(Boolean).join(' ')||'Пользователь';username.textContent=u.username?`@${u.username} · Telegram подтверждён`:'Telegram подтверждён';avatar.textContent=(u.first_name||'Ч').slice(0,1).toUpperCase();created.textContent=String(chaikaAuth.createdIds.length)}else if(!window.Telegram?.WebApp?.initData){name.textContent='Гостевой режим';username.textContent='Публикация доступна после запуска в Telegram'}else if(chaikaAuth.status==='error'){username.textContent='Telegram-авторизация не настроена'}};

async function chaikaAuthenticate(){const initData=window.Telegram?.WebApp?.initData||'';if(!initData){chaikaAuth.status='browser';updateProfile();return false}chaikaAuth.status='loading';try{const data=await chaikaEdge('telegram-auth',{initData});chaikaAuth.status='ready';chaikaAuth.user=data.user;chaikaAuth.createdIds=data.created_event_ids||[];state.createdIds=new Set(chaikaAuth.createdIds);localStorage.setItem(CHAIKA_CREATED_KEY,JSON.stringify(chaikaAuth.createdIds));updateProfile();await chaikaLoadEvents(false);return true}catch(error){console.error('CHAIKA Telegram auth',error);chaikaAuth.status='error';chaikaAuth.error=error.message;updateProfile();return false}}

persist=function(){localStorage.setItem('tuda_going',JSON.stringify([...state.going]));localStorage.setItem(CHAIKA_CREATED_KEY,JSON.stringify([...state.createdIds]))};

/* Attendance stays on the current guest counter until the next server patch. */
toggleGoing=async function(id){const event=state.events.find(x=>x.id===id);if(!event)return;if(!/^[0-9a-f-]{36}$/i.test(id)){const was=state.going.has(id);was?state.going.delete(id):state.going.add(id);event.going=Math.max(0,Number(event.going||0)+(was?-1:1));persist();renderFeed();if(state.selectedId===id)showEvent(id);updateProfile();return}try{const rows=await chaikaRequest('rpc/toggle_event_attendance',{method:'POST',body:{p_event_id:id,p_client_key:chaikaClientId}}),row=Array.isArray(rows)?rows[0]:rows;if(row?.going)state.going.add(id);else state.going.delete(id);event.going=Math.max(0,Number(row?.going_count||0)-(row?.going?1:0));persist();renderFeed();if(state.selectedId===id)showEvent(id);updateProfile();tg?.HapticFeedback?.impactOccurred('light')}catch(error){console.error('CHAIKA attendance',error);toast('Не удалось обновить «Пойду»')}};

async function chaikaCreateEvent(e){e.preventDefault();e.stopImmediatePropagation();const initData=window.Telegram?.WebApp?.initData||'';if(!initData)return showModeration({status:'review',title:'Открой ЧАЙКУ в Telegram',text:'Просматривать карту можно в браузере, но публиковать события можно только после подтверждения Telegram-профиля.'});if(chaikaAuth.status!=='ready'&&!(await chaikaAuthenticate()))return showModeration({status:'block',title:'Telegram-авторизация недоступна',text:chaikaAuth.error==='bot_not_configured'?'Нужно завершить настройку Telegram-бота в Supabase.':'Перезапусти Mini App из Telegram и попробуй ещё раз.'});const data=Object.fromEntries(new FormData(els.form).entries());if(state.eventType==='planned'){const chosen=new Date(`${data.date}T12:00`),max=new Date(`${dateISO(30)}T23:59`);if(chosen<new Date(`${dateISO(0)}T00:00`)||chosen>max)return showModeration({status:'block',title:'Дата вне диапазона',text:'Пользовательские события можно создавать только на ближайшие 30 дней.'})}const mod=moderate(`${data.title} ${data.description||''}`);if(mod.status==='block'||mod.title==='Нужно исправить текст')return showModeration(mod);if(pendingPhotoData.length>1450000)return showModeration({status:'block',title:'Фото слишком тяжёлое',text:'Выбери фотографию поменьше. После сжатия она должна быть меньше примерно 1 МБ.'});const startsAt=state.eventType==='instant'?new Date():new Date(`${data.date}T${data.time||'20:00'}:00`),expiresAt=state.eventType==='instant'?new Date(Date.now()+Number(data.duration||60)*60*1000):null;const button=els.form.querySelector('button[type="submit"]'),oldText=button.textContent;button.disabled=true;button.textContent='Публикуем…';try{const result=await chaikaEdge('telegram-create-event',{initData,event:{title:data.title.trim(),category:data.category,event_type:state.eventType,starts_at:startsAt.toISOString(),expires_at:expiresAt?expiresAt.toISOString():null,price_rub:Number(data.price||0),venue:data.venue.trim(),lat:Number(data.lat),lng:Number(data.lng),age_limit:Number(data.ageLimit||0),description:(data.description||'').trim(),ticket_url:data.ticketUrl||'',image_url:pendingPhotoData||''}});if(result?.id){state.createdIds.add(result.id);chaikaAuth.createdIds=[...state.createdIds];persist()}const finish=async()=>{els.form.reset();resetPhotoUI();els.form.date.min=dateISO(0);els.form.date.max=dateISO(30);els.form.date.value=dateISO(0);els.form.time.value='20:00';$('categoryInput').value='guitar';document.querySelectorAll('.icon-choice').forEach((x,i)=>x.classList.toggle('active',i===0));setEventType('planned');await chaikaLoadEvents(true);updateProfile()};if(result?.moderation_status==='review')return showModeration({status:'review',title:'Отправлено на модерацию',text:'Событие привязано к твоему Telegram-профилю и появится после проверки.'},finish);showModeration({status:'ok',title:'Событие опубликовано',text:'Готово — событие опубликовано от подтверждённого Telegram-профиля.'},async()=>{await finish();switchView('mapView');const event=state.events.find(x=>x.id===result?.id);if(event)setTimeout(()=>{map.setView([event.lat,event.lng],14);showEvent(event.id)},100);tg?.HapticFeedback?.notificationOccurred('success')})}catch(error){console.error('CHAIKA secure create',error);const blocked=String(error.message||'').includes('event_blocked');showModeration({status:'block',title:blocked?'Публикация отклонена':'Не удалось создать событие',text:blocked?'Серверная модерация обнаружила запрещённое или опасное содержание.':'Проверь данные и попробуй ещё раз.'})}finally{button.disabled=false;button.textContent=oldText}}
els.form.addEventListener('submit',chaikaCreateEvent,true);

$('resetBtn').onclick=()=>{localStorage.removeItem('tuda_events');localStorage.removeItem('tuda_going');localStorage.removeItem('tuda_refCount');localStorage.removeItem(CHAIKA_CREATED_KEY);localStorage.removeItem(CHAIKA_CLIENT_KEY);location.reload()};

chaikaSync();chaikaAuthenticate();


/* CHAIKA frontend enhancements: map placement, grouped markers, ownership/admin management. */
const chaikaManagement={isAdmin:false,myEvents:[],moderation:[],loading:false,error:null,lastLoadedAt:0};
let chaikaPickingLocation=false;
let chaikaPlacementMarker=null;

function chaikaInjectEnhancementStyles(){
  if(document.getElementById('chaikaEnhancementStyles'))return;
  const style=document.createElement('style');
  style.id='chaikaEnhancementStyles';
  style.textContent=`
.chaika-location-tools{display:grid;gap:8px;margin-top:8px}.chaika-location-tools .secondary-btn{width:100%}.chaika-location-note{font-size:12px;color:#94949f;margin:0}.chaika-picking{cursor:crosshair!important}.chaika-group-marker{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;position:relative;background:#111116;border:2px solid var(--cat-color,#fff);box-shadow:0 5px 18px rgba(0,0,0,.42)}.chaika-group-marker.premium{width:50px;height:50px;border-color:#d8ff43;box-shadow:0 0 0 3px rgba(216,255,67,.18),0 7px 22px rgba(0,0,0,.5)}.chaika-group-marker svg{width:21px;height:21px;color:var(--cat-color,#fff);fill:currentColor}.chaika-group-count{position:absolute;right:-5px;top:-5px;min-width:21px;height:21px;padding:0 5px;border-radius:12px;background:#fff;color:#09090b;font:800 11px/21px system-ui;text-align:center;border:2px solid #09090b}.chaika-group-sheet{display:grid;gap:10px}.chaika-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.chaika-group-head h3{margin:0}.chaika-group-event{width:100%;text-align:left;border:1px solid #2c2c34;background:#17171c;color:#fff;border-radius:16px;padding:12px;display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px}.chaika-group-event .event-type-icon{width:38px;height:38px}.chaika-group-event h4{font-size:14px;margin:0 0 4px}.chaika-group-event p{font-size:12px;color:#9f9faa;margin:0}.chaika-group-chevron{font-size:22px;color:#8b8b95}.chaika-profile-section{margin-top:14px;padding:14px;border-radius:18px;background:#151519;border:1px solid #27272f}.chaika-profile-section h3{margin:0 0 4px}.chaika-profile-section>.muted{margin-top:0}.chaika-manage-list{display:grid;gap:9px;margin-top:12px}.chaika-manage-item{border:1px solid #2b2b33;border-radius:14px;padding:11px;background:#111115}.chaika-manage-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.chaika-manage-title{font-weight:800;font-size:14px;line-height:1.25}.chaika-manage-meta{color:#9999a4;font-size:12px;margin-top:5px;line-height:1.35}.chaika-status{display:inline-flex;align-items:center;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900;letter-spacing:.04em;white-space:nowrap}.chaika-status.published{background:rgba(114,230,166,.12);color:#72e6a6}.chaika-status.review{background:rgba(243,198,91,.12);color:#f3c65b}.chaika-status.rejected{background:rgba(255,102,125,.12);color:#ff667d}.chaika-manage-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.chaika-manage-actions button{border:1px solid #33333c;background:#1b1b21;color:#fff;border-radius:10px;padding:7px 9px;font-size:12px;font-weight:700}.chaika-manage-actions button.danger{color:#ff7a8e}.chaika-manage-actions button.approve{color:#d8ff43}.chaika-admin-section{border-color:#41412b}.chaika-admin-badge{display:inline-flex;margin-left:7px;padding:3px 6px;border-radius:7px;background:#d8ff43;color:#09090b;font-size:10px;font-weight:900;vertical-align:middle}.chaika-empty-manage{color:#92929d;font-size:13px;padding:8px 0}.chaika-detail-status{margin-bottom:10px}
`;
  document.head.appendChild(style);
}

function chaikaEnsureLocationPicker(){
  if(document.getElementById('chaikaPickLocationBtn'))return;
  const coords=document.querySelector('#eventForm .coords-row');
  if(!coords)return;
  const tools=document.createElement('div');
  tools.className='chaika-location-tools';
  tools.innerHTML='<button id="chaikaPickLocationBtn" class="secondary-btn small" type="button">Выбрать точку на карте</button><p id="chaikaLocationNote" class="chaika-location-note">Можно указать координаты вручную, взять геолокацию или ткнуть точку на карте.</p>';
  coords.insertAdjacentElement('afterend',tools);
  $('chaikaPickLocationBtn').addEventListener('click',()=>{
    chaikaPickingLocation=true;
    map.getContainer().classList.add('chaika-picking');
    $('chaikaPickLocationBtn').textContent='Ткни точку на карте…';
    switchView('mapView');
    toast('Нажми на нужное место на карте');
  });
}

function chaikaSetChosenPoint(lat,lng,returnToForm=false){
  els.form.lat.value=Number(lat).toFixed(6);
  els.form.lng.value=Number(lng).toFixed(6);
  if(!chaikaPlacementMarker){
    chaikaPlacementMarker=L.marker([lat,lng],{draggable:true,zIndexOffset:1200}).addTo(map);
    chaikaPlacementMarker.on('dragend',()=>{
      const p=chaikaPlacementMarker.getLatLng();
      chaikaSetChosenPoint(p.lat,p.lng,false);
      toast('Точка обновлена');
    });
  }else chaikaPlacementMarker.setLatLng([lat,lng]);
  chaikaPickingLocation=false;
  map.getContainer().classList.remove('chaika-picking');
  const btn=$('chaikaPickLocationBtn');
  if(btn)btn.textContent='Изменить точку на карте';
  const note=$('chaikaLocationNote');
  if(note)note.textContent=`Выбрано: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
  if(returnToForm)setTimeout(()=>switchView('createView'),160);
}

function chaikaResetPointPicker(){
  chaikaPickingLocation=false;
  map.getContainer().classList.remove('chaika-picking');
  if(chaikaPlacementMarker){map.removeLayer(chaikaPlacementMarker);chaikaPlacementMarker=null}
  const btn=$('chaikaPickLocationBtn');
  if(btn)btn.textContent='Выбрать точку на карте';
  const note=$('chaikaLocationNote');
  if(note)note.textContent='Можно указать координаты вручную, взять геолокацию или ткнуть точку на карте.';
}

map.on('click',e=>{
  if(!chaikaPickingLocation)return;
  chaikaSetChosenPoint(e.latlng.lat,e.latlng.lng,true);
  tg?.HapticFeedback?.selectionChanged?.();
});
els.form.addEventListener('reset',()=>setTimeout(chaikaResetPointPicker,0));

function chaikaGroupKey(e){return `${Number(e.lat).toFixed(5)}:${Number(e.lng).toFixed(5)}`}
function chaikaGroupEvents(list){
  const groups=new Map();
  list.forEach(e=>{const key=chaikaGroupKey(e);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e)});
  return [...groups.values()].map(group=>group.sort((a,b)=>Number(b.promoted)-Number(a.promoted)||parseEventDate(a)-parseEventDate(b)));
}
function chaikaGroupMarkerIcon(group){
  if(group.length===1)return markerIcon(group[0]);
  const top=group[0],cat=categoryMap[top.category]||categoryMap.other,color=categoryColors[top.category]||categoryColors.other,premium=group.some(e=>e.promoted);
  return L.divIcon({className:'',html:`<div class="chaika-group-marker ${premium?'premium':''}" style="--cat-color:${color}">${svgIcon(cat.icon)}<span class="chaika-group-count">${group.length}</span></div>`,iconSize:premium?[50,50]:[44,44],iconAnchor:premium?[25,25]:[22,22]});
}
function chaikaShowEventGroup(group){
  if(!group?.length)return;
  if(group.length===1)return showEvent(group[0].id);
  state.selectedId=null;
  map.panTo([group[0].lat,group[0].lng],{animate:true});
  els.sheet.innerHTML=`<div class="chaika-group-sheet"><div class="chaika-group-head"><h3>${group.length} события здесь</h3><span class="muted">премиум выше</span></div>${group.map(e=>{const cat=categoryMap[e.category]||categoryMap.other;return `<button class="chaika-group-event" data-group-event="${e.id}" type="button"><div class="event-type-icon" ${catStyle(e.category)}>${svgIcon(cat.icon)}</div><div>${e.promoted?'<span class="badge">ПРЕМИУМ</span>':''}<h4>${escapeHtml(e.title)}</h4><p>${formatDate(e)} · ${e.price?e.price+' ₽':'Бесплатно'}<br>${escapeHtml(e.venue)}</p></div><span class="chaika-group-chevron">›</span></button>`}).join('')}</div>`;
  els.sheet.classList.remove('hidden');
  els.sheet.querySelectorAll('[data-group-event]').forEach(btn=>btn.onclick=()=>showEvent(btn.dataset.groupEvent));
}

renderMap=function(){
  state.markers.forEach(m=>map.removeLayer(m));
  state.markers=[];
  const list=filteredEvents();
  els.empty.classList.toggle('hidden',list.length>0);
  chaikaGroupEvents(list).forEach(group=>{
    const top=group[0];
    const marker=L.marker([top.lat,top.lng],{icon:chaikaGroupMarkerIcon(group),bubblingMouseEvents:false}).addTo(map);
    marker.on('click',()=>chaikaShowEventGroup(group));
    state.markers.push(marker);
  });
  renderFeed();
};

function chaikaManagedToEvent(row){
  const start=chaikaDateParts(row.starts_at);
  return {id:row.id,title:row.title,category:row.category,date:start.date,time:start.time,price:Number(row.price_rub||0),venue:row.venue||'',lat:Number(row.lat),lng:Number(row.lng),ageLimit:Number(row.age_limit||0),promoted:Boolean(row.promoted),description:row.description||'',ticketUrl:row.ticket_url||'',imageData:row.image_url||'',going:Number(row.going_count||0),owner:true,type:row.event_type||'planned',expiresAt:row.expires_at?new Date(row.expires_at).getTime():null,moderationStatus:row.moderation_status||'review'};
}
function chaikaStatusLabel(status){return status==='published'?'Опубликовано':status==='rejected'?'Отклонено':'На проверке'}
function chaikaEnsureManagementUI(){
  if(document.getElementById('chaikaMyEventsSection'))return;
  const profile=$('profileView');
  if(!profile)return;
  const moderationCard=profile.querySelector('.moderation-card');
  const mine=document.createElement('section');
  mine.id='chaikaMyEventsSection';mine.className='chaika-profile-section';
  mine.innerHTML='<h3>Мои события</h3><p class="muted">Созданные с этого Telegram-профиля.</p><div id="chaikaMyEventsList" class="chaika-manage-list"></div>';
  const admin=document.createElement('section');
  admin.id='chaikaAdminSection';admin.className='chaika-profile-section chaika-admin-section hidden';
  admin.innerHTML='<h3>Админ-модерация <span class="chaika-admin-badge">ADMIN</span></h3><p class="muted">Открыть, одобрить, отклонить или удалить событие.</p><div id="chaikaAdminEventsList" class="chaika-manage-list"></div>';
  profile.insertBefore(mine,moderationCard||$('resetBtn'));
  profile.insertBefore(admin,moderationCard||$('resetBtn'));
}
function chaikaManagedEventCard(row,admin=false){
  const e=chaikaManagedToEvent(row),status=row.moderation_status||'review';
  const adminButtons=admin?`${status!=='published'?`<button class="approve" data-admin-decision="published" data-event-id="${row.id}">Одобрить</button>`:''}${status!=='rejected'?`<button data-admin-decision="rejected" data-event-id="${row.id}">Отклонить</button>`:''}`:'';
  return `<article class="chaika-manage-item"><div class="chaika-manage-top"><div><div class="chaika-manage-title">${escapeHtml(row.title)}</div><div class="chaika-manage-meta">${formatDate(e)} · ${escapeHtml(row.venue||'')} ${row.promoted?'· PREMIUM':''}</div></div><span class="chaika-status ${status}">${chaikaStatusLabel(status)}</span></div><div class="chaika-manage-actions"><button data-managed-open="${row.id}" data-managed-source="${admin?'admin':'mine'}">Открыть</button>${adminButtons}<button class="danger" data-managed-delete="${row.id}">Удалить</button></div></article>`;
}
function chaikaRenderManagementPanels(){
  chaikaEnsureManagementUI();
  const mine=$('chaikaMyEventsList'),admin=$('chaikaAdminEventsList'),adminSection=$('chaikaAdminSection');
  if(!mine)return;
  if(chaikaAuth.status==='browser')mine.innerHTML='<div class="chaika-empty-manage">Открой ЧАЙКУ в Telegram, чтобы увидеть свои события.</div>';
  else if(chaikaManagement.loading)mine.innerHTML='<div class="chaika-empty-manage">Загрузка…</div>';
  else if(chaikaManagement.error)mine.innerHTML='<div class="chaika-empty-manage">Не удалось загрузить управление событиями.</div>';
  else mine.innerHTML=chaikaManagement.myEvents.length?chaikaManagement.myEvents.map(row=>chaikaManagedEventCard(row,false)).join(''):'<div class="chaika-empty-manage">Ты пока не создавал событий.</div>';
  adminSection?.classList.toggle('hidden',!chaikaManagement.isAdmin);
  if(admin&&chaikaManagement.isAdmin){
    const rank={review:0,published:1,rejected:2};
    const sorted=[...chaikaManagement.moderation].sort((a,b)=>(rank[a.moderation_status]??3)-(rank[b.moderation_status]??3)||new Date(b.created_at)-new Date(a.created_at));
    admin.innerHTML=sorted.length?sorted.map(row=>chaikaManagedEventCard(row,true)).join(''):'<div class="chaika-empty-manage">Событий для модерации нет.</div>';
  }
  document.querySelectorAll('[data-managed-open]').forEach(btn=>btn.onclick=()=>chaikaOpenManagedEvent(btn.dataset.managedOpen,btn.dataset.managedSource));
  document.querySelectorAll('[data-managed-delete]').forEach(btn=>btn.onclick=()=>chaikaDeleteManagedEvent(btn.dataset.managedDelete));
  document.querySelectorAll('[data-admin-decision]').forEach(btn=>btn.onclick=()=>chaikaModerateManagedEvent(btn.dataset.eventId,btn.dataset.adminDecision));
}
async function chaikaLoadManagement(showError=false){
  const initData=window.Telegram?.WebApp?.initData||'';
  if(!initData||chaikaAuth.status!=='ready'){chaikaRenderManagementPanels();return false}
  if(chaikaManagement.loading)return false;
  chaikaManagement.loading=true;chaikaManagement.error=null;chaikaRenderManagementPanels();
  try{
    const data=await chaikaEdge('telegram-event-management',{initData,action:'dashboard'});
    chaikaManagement.isAdmin=Boolean(data.is_admin);
    chaikaManagement.myEvents=data.my_events||[];
    chaikaManagement.moderation=data.moderation||[];
    chaikaManagement.lastLoadedAt=Date.now();
    chaikaAuth.createdIds=chaikaManagement.myEvents.map(x=>x.id);
    state.createdIds=new Set(chaikaAuth.createdIds);
    localStorage.setItem(CHAIKA_CREATED_KEY,JSON.stringify(chaikaAuth.createdIds));
    return true;
  }catch(error){
    console.error('CHAIKA management',error);chaikaManagement.error=error.message;if(showError)toast('Не удалось загрузить управление событиями');return false;
  }finally{
    chaikaManagement.loading=false;chaikaRenderManagementPanels();
  }
}
function chaikaFindManagedRow(id,source){
  const list=source==='admin'?chaikaManagement.moderation:chaikaManagement.myEvents;
  return list.find(x=>x.id===id)||chaikaManagement.myEvents.find(x=>x.id===id)||chaikaManagement.moderation.find(x=>x.id===id);
}
function chaikaOpenManagedEvent(id,source='mine'){
  const publicEvent=state.events.find(x=>x.id===id),row=chaikaFindManagedRow(id,source);
  if(publicEvent&&row?.moderation_status==='published')return openOnMap(id);
  if(!row)return;
  const e=chaikaManagedToEvent(row),cat=categoryMap[e.category]||categoryMap.other;
  els.detail.dataset.eventId=id;
  els.detailHero.className=`event-detail-hero ${eventCoverClass(e)} ${e.imageData?'has-photo':''}`;
  els.detailHero.querySelectorAll('.event-detail-photo').forEach(x=>x.remove());
  if(e.imageData){const img=document.createElement('img');img.className='event-detail-photo';img.src=e.imageData;img.alt='';els.detailHero.prepend(img)}
  els.detailHeroIcon.innerHTML=svgIcon(cat.icon);
  els.detailBody.innerHTML=`<div class="chaika-detail-status"><span class="chaika-status ${e.moderationStatus}">${chaikaStatusLabel(e.moderationStatus)}</span></div>${e.promoted?'<span class="badge">ПРЕМИУМ</span>':''}<h2>${escapeHtml(e.title)}</h2><div class="detail-meta-row"><span>${formatDate(e)}</span><span>${e.price?e.price+' ₽':'Бесплатно'}</span><span>${escapeHtml(e.venue)}</span><span>${e.ageLimit}+</span></div><div class="detail-section"><h3>О событии</h3><p>${escapeHtml(e.description||'Описание пока не добавлено.')}</p></div>`;
  els.detail.classList.remove('hidden');els.detail.setAttribute('aria-hidden','false');tg?.BackButton?.show?.();
}
async function chaikaDeleteManagedEvent(eventId){
  if(!window.confirm('Удалить это событие?'))return;
  try{
    await chaikaEdge('telegram-event-management',{initData:window.Telegram?.WebApp?.initData||'',action:'delete',eventId});
    toast('Событие удалено');state.createdIds.delete(eventId);
    await Promise.all([chaikaLoadEvents(false),chaikaLoadManagement(false)]);
    if(els.detail?.dataset.eventId===eventId)closeEventDetail();
  }catch(error){console.error('CHAIKA delete event',error);toast(error.message==='forbidden'?'Нет прав на удаление':'Не удалось удалить событие')}
}
async function chaikaModerateManagedEvent(eventId,decision){
  try{
    await chaikaEdge('telegram-event-management',{initData:window.Telegram?.WebApp?.initData||'',action:'moderate',eventId,decision});
    toast(decision==='published'?'Событие одобрено':'Событие отклонено');
    await Promise.all([chaikaLoadEvents(false),chaikaLoadManagement(false)]);
  }catch(error){console.error('CHAIKA moderate event',error);toast(error.message==='forbidden'?'Нужны права администратора':'Не удалось изменить статус')}
}

const chaikaBaseUpdateProfile=updateProfile;
updateProfile=function(){
  chaikaBaseUpdateProfile();
  const username=$('profileUsername'),created=$('createdStat');
  if(chaikaAuth.status==='ready'&&chaikaAuth.user){
    if(chaikaManagement.isAdmin&&!username.textContent.includes('админ'))username.textContent+=' · админ';
    if(chaikaManagement.lastLoadedAt)created.textContent=String(chaikaManagement.myEvents.length);
  }
  chaikaRenderManagementPanels();
  const profileOpen=$('profileView')?.classList.contains('active-view');
  if(profileOpen&&chaikaAuth.status==='ready'&&!chaikaManagement.loading&&Date.now()-chaikaManagement.lastLoadedAt>4000){
    queueMicrotask(()=>chaikaLoadManagement(false));
  }
};

const chaikaBaseToggleGoing=toggleGoing;
toggleGoing=async function(id){
  const event=state.events.find(x=>x.id===id);
  if(!event)return;
  if(!/^[0-9a-f-]{36}$/i.test(id))return chaikaBaseToggleGoing(id);
  const initData=window.Telegram?.WebApp?.initData||'';
  if(!initData)return toast('Открой ЧАЙКУ в Telegram, чтобы отметить «Пойду»');
  if(chaikaAuth.status!=='ready'&&!(await chaikaAuthenticate()))return toast('Не удалось подтвердить Telegram-профиль');
  try{
    const row=await chaikaEdge('telegram-toggle-attendance',{initData,eventId:id});
    if(row?.going)state.going.add(id);else state.going.delete(id);
    event.going=Math.max(0,Number(row?.going_count||0)-(row?.going?1:0));
    persist();renderFeed();if(state.selectedId===id)showEvent(id);updateProfile();tg?.HapticFeedback?.impactOccurred('light');
  }catch(error){console.error('CHAIKA attendance',error);toast('Не удалось обновить «Пойду»')}
};

const chaikaDangerBlockPatterns=[/наркот|закладк|героин|кокаин|амфетамин|мефедрон|метамфетамин/i,/оружи|боеприпас|взрывчат|бомб[ау]|террор|экстрем/i,/массов\w*\s+(убий|расстрел|резн)|массовое\s+убийство/i,/убийств|убить\s+(люд|человек|кого|всех)|расстрел|резн[яи]|пытк|казн[ьи]|линч/i,/жертвопринош|человеческ\w*\s+жертв|ритуальн\w*\s+убий/i,/изнасил|сексуальн\w*\s+насили/i,/самоубий|суицид|прыгн\w*\s+с\s+(крыши|моста)|вскрыть\s+вен/i,/убить\s+(кот|кош|собак|живот)|мучить\s+(кот|кош|собак|живот)|издев\w*\s+над\s+(кот|кош|собак|живот)|живодер/i,/проституц|купить\s+паспорт|продам\s+паспорт/i];
const chaikaReviewPatterns=[/\b(хуй|хуя|хуе|пизд|ебан|ёбан|ебат|бляд)\w*/i,/без\s+правил|секретн\w*\s+адрес|только\s+налич|100%\s+заработ|л[её]гк\w*\s+деньг/i,/по\s+приколу|рофл|прикол\w*\s+событ|поюзат\w*\s+(кот|кош|живот)/i,/драка|подраться|мордобой|охот\w*\s+на\s+люд/i,/кровав\w*\s+(вечерин|ритуал)|сатанин\w*\s+ритуал/i];
moderate=function(text){
  const normalized=String(text||'').replace(/ё/g,'е');
  if(chaikaDangerBlockPatterns.some(r=>r.test(normalized)))return {status:'block',title:'Публикация отклонена',text:'Обнаружено опасное, насильственное или незаконное содержание. Такое событие нельзя публиковать.'};
  if(chaikaReviewPatterns.some(r=>r.test(normalized)))return {status:'review',title:'Нужна ручная проверка',text:'Формулировка выглядит сомнительно или провокационно. Событие будет проверено модератором.'};
  return {status:'ok',title:'Проверка пройдена',text:'Событие прошло предварительную проверку.'};
};

async function chaikaBootstrapManagement(){
  for(let i=0;i<20;i++){
    if(chaikaAuth.status==='ready'){await chaikaLoadManagement(false);return}
    if(chaikaAuth.status==='browser'||chaikaAuth.status==='error'){chaikaRenderManagementPanels();return}
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  chaikaRenderManagementPanels();
}

chaikaInjectEnhancementStyles();
chaikaEnsureLocationPicker();
chaikaEnsureManagementUI();
chaikaRenderManagementPanels();
renderMap();
chaikaBootstrapManagement();


/* CHAIKA safety + stable event deep links. Loaded after Supabase and map enhancements. */

const chaikaSafetyLatinToCyr={a:'а',c:'с',e:'е',o:'о',p:'р',x:'х',y:'у',k:'к',m:'м',t:'т',h:'н',b:'в'};
const chaikaSafetyCyrToLatin={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
function chaikaSafetySplit(s=''){
  const spaced=String(s).replace(/[^a-zа-я0-9]+/giu,' ').replace(/\s+/g,' ').trim();
  return {spaced,compact:spaced.replace(/\s+/g,'')};
}
function chaikaSafetyNormalize(raw=''){
  const src=String(raw).normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\u200B-\u200D\uFEFF]/g,'');
  const cyrLeet=src.replace(/[0346@$]/g,ch=>({'0':'о','3':'з','4':'ч','6':'б','@':'а','$':'с'}[ch]||ch));
  const cyr=chaikaSafetySplit(cyrLeet.replace(/[aceopxykmthb]/g,ch=>chaikaSafetyLatinToCyr[ch]||ch));
  const latLeet=src.replace(/[0134@$]/g,ch=>({'0':'o','1':'i','3':'e','4':'a','@':'a','$':'s'}[ch]||ch));
  const lat=chaikaSafetySplit([...latLeet].map(ch=>chaikaSafetyCyrToLatin[ch]??ch).join(''));
  return {spaced:cyr.spaced,compact:cyr.compact,latinSpaced:lat.spaced,latinCompact:lat.compact};
}
function chaikaSafetyHas(v,terms){return terms.some(term=>v.includes(term))}
function chaikaSafetyPattern(values,patterns){return patterns.some(r=>values.some(v=>r.test(v)))}

const chaikaSafetyHardRu=[
  'наркот','закладк','кладмен','героин','кокаин','амфетамин','метамфетамин','мефедрон','марихуан','каннабис','экстази','псилоциб',
  'оружи','боеприпас','взрывчат','террор','экстрем','проституц','интимуслуг','сексзаденьги',
  'массовоеубий','массовыйрасстрел','жертвопринош','человеческаяжертв','ритуальноеубий','изнасил','сексуальноенасили','самоубий','суицид','живодер'
];
const chaikaSafetyHardLat=['narkot','zaklad','heroin','cocaine','kokain','amphetamine','amfetamin','methamphetamine','metamfetamin','mefedron','marijuana','marihuana','cannabis','kanabis','ecstasy','mdma','lsd','psilocybin','weapon','explosive','terror','suicide','rape','prostitution'];
const chaikaSafetyHardPatterns=[
  /массов\S*\s+(убий|расстрел|резн)/u,
  /убить\s+(люд|человек|кого|всех)/u,
  /(расстрел|резн[яи]|пытк|казн[ьи]|линч)/u,
  /(убить|мучить|издев\S*)\s+(кот|кош|собак|живот)/u,
  /(прыгн\S*\s+с\s+(крыши|моста)|вскрыть\s+вен)/u,
  /(юз\S*|поюз\S*)\s+(кот|кош|котик)/u,
  /(упорот|вмаз|ширнут|снюх|под\s+веществ)/u,
  /(дорожк\S*\s+(кокс|кокаин)|колоть\s+(героин|наркот))/u,
  /(сексуал\S*|секс)\s+.*(дет|ребен|подрост|несовершеннолет)/u,
  /mass\w*\s+(kill|shoot|murder)/i,
  /kill\s+(people|everyone|person)/i,
  /self\s*harm|suicid/i
];
const chaikaSafetyReviewRu=[
  'хуй','хуя','хуе','хер','пизд','пиздец','ебан','ебат','ебля','ебуч','ебнут','уеб','заеб','наеб','поеб','выеб','бляд','шлюх','манда','елда','залуп',
  'фаллос','фалос','пенис','писюн','письк','вагин','вареник','сперм','конч','дроч','отсос','минет','куни','порно','оргия','сиськ','титьк','жоп','анус','секс','анал','член',
  'шмаль','гашиш','травка','косяк','спиды','скорость','кислота','таблы','колеса','кокс','эскорт','драка','подраться','мордобой','охотаналюд','кровавыйритуал','сатанинскийритуал','безправил','секретныйадрес','тольконалич','легкиеденьги','100заработ'
];
const chaikaSafetyReviewLat=['hui','huy','khui','pizda','pizdec','pizdets','ebat','eblya','blyad','blyat','chlen','zalupa','fallos','penis','vagina','dick','cock','pussy','blowjob','porn','porno','fuck','sex','anal','escort','hashish','gashish','weed'];
const chaikaSafetyReviewPatterns=[
  /(по\s+приколу|рофл|прикол\S*\s+событ)/u,
  /(кур\S*|забить|пыхн\S*)\s+.*(шмаль|трав|косяк|гаш)/u,
  /(поюз\S*|юз\S*)\s+.*(веществ|табл|колес|скорост)/u,
  /\b(fuck|blowjob|pussy|cock|dick|porn)\w*/i
];

moderate=function(text){
  const form=els?.form;
  const venue=form?.elements?.namedItem?.('venue')?.value||'';
  const title=form?.elements?.namedItem?.('title')?.value||'';
  const description=form?.elements?.namedItem?.('description')?.value||'';
  const f=chaikaSafetyNormalize(`${text||''} ${title} ${description} ${venue}`);
  if(chaikaSafetyHas(f.compact,chaikaSafetyHardRu)||chaikaSafetyHas(f.latinCompact,chaikaSafetyHardLat)||chaikaSafetyPattern([f.spaced,f.latinSpaced],chaikaSafetyHardPatterns)){
    return {status:'block',title:'Публикация отклонена',text:'В названии, описании или месте обнаружено опасное, незаконное или явно запрещённое содержание.'};
  }
  if(chaikaSafetyHas(f.compact,chaikaSafetyReviewRu)||chaikaSafetyHas(f.latinCompact,chaikaSafetyReviewLat)||chaikaSafetyPattern([f.spaced,f.latinSpaced],chaikaSafetyReviewPatterns)){
    return {status:'review',title:'Нужна ручная проверка',text:'Сленг или двусмысленная формулировка найдены в названии, описании или месте. Событие попадёт администратору на проверку.'};
  }
  return {status:'ok',title:'Проверка пройдена',text:'Предварительная проверка текста пройдена.'};
};

const CHAIKA_PUBLIC_EVENT_URL='https://chaika-app.vercel.app/';
const CHAIKA_BOT_USERNAME='chaika47bot';
function chaikaEventDeepLink(id){return `https://t.me/${CHAIKA_BOT_USERNAME}?startapp=${encodeURIComponent(`event_${id}`)}`}
shareEvent=async function(id){
  const event=state.events.find(x=>x.id===id);
  if(!event)return toast('Событие не найдено');
  const webUrl=new URL(CHAIKA_PUBLIC_EVENT_URL);
  webUrl.searchParams.set('event',id);
  const direct=webUrl.toString();
  const miniApp=chaikaEventDeepLink(id);
  const text=`Смотри событие в ЧАЙКЕ: ${event.title}`;
  const telegramShare=`https://t.me/share/url?url=${encodeURIComponent(miniApp)}&text=${encodeURIComponent(text)}`;
  try{
    if(tg?.openTelegramLink){tg.openTelegramLink(telegramShare);return;}
    if(navigator.share){await navigator.share({title:event.title,text,url:miniApp});return;}
    await navigator.clipboard?.writeText?.(miniApp);
    toast('Ссылка на событие скопирована');
  }catch(error){
    console.error('CHAIKA share',error);
    try{await navigator.clipboard?.writeText?.(direct);toast('Ссылка скопирована')}catch{toast(direct)}
  }
};

(function chaikaOpenDeepLinkedEvent(){
  const queryId=new URLSearchParams(location.search).get('event');
  const rawStart=window.Telegram?.WebApp?.initDataUnsafe?.start_param||startParam||'';
  const startId=String(rawStart).match(/^event_([0-9a-f-]{36})(?:_|$)/i)?.[1]||'';
  const id=queryId||startId;
  if(!id)return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    const event=state.events.find(x=>x.id===id);
    if(event){clearInterval(timer);switchView('mapView');setTimeout(()=>{map.setView([event.lat,event.lng],14);showEvent(id)},100);return;}
    if(attempts>=40){clearInterval(timer);toast('Событие уже недоступно или ещё не опубликовано');}
  },250);
})();

/* Discovery-first boot: the external catalog spans a month, so do not hide almost all of it behind "Сегодня". */
(function chaikaDiscoveryBoot(){
  const queryId=new URLSearchParams(location.search).get('event');
  const rawStart=window.Telegram?.WebApp?.initDataUnsafe?.start_param||startParam||'';
  const deepLinked=Boolean(queryId||String(rawStart).startsWith('event_'));
  if(deepLinked)return;

  state.time='week';
  document.querySelectorAll('[data-time]').forEach(btn=>btn.classList.toggle('active',btn.dataset.time==='week'));
  renderMap();

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    const hasRemote=state.events.some(e=>/^[0-9a-f-]{36}$/i.test(String(e.id||'')));
    if(hasRemote){
      clearInterval(timer);
      renderMap();
      const list=filteredEvents().filter(e=>Number.isFinite(Number(e.lat))&&Number.isFinite(Number(e.lng)));
      if(list.length===1)map.setView([list[0].lat,list[0].lng],13);
      else if(list.length>1){
        const bounds=L.latLngBounds(list.map(e=>[e.lat,e.lng]));
        map.fitBounds(bounds,{padding:[28,28],maxZoom:13,animate:false});
      }
      return;
    }
    if(attempts>=40)clearInterval(timer);
  },250);
})();

const chaikaFormNote=document.querySelector('#eventForm .form-note');
if(chaikaFormNote)chaikaFormNote.textContent='Название, описание и место проходят автоматическую проверку. Сленг, обфускация и двусмысленные формулировки уходят на ручную модерацию; фото также проверяется перед публикацией.';
const chaikaConcertNote=document.querySelector('#concertsView .legal-note');
if(chaikaConcertNote)chaikaConcertNote.textContent='Концерты автоматически обновляются из внешних источников. Кнопка покупки открывает страницу источника или регистрации.';


/* CHAIKA map UX + clustering + hidden stress-test mode (rev8). */
(() => {
  const MAP_CLUSTER_MAX_METERS = 130;

  function chaikaInjectMapRev8Styles() {
    if (document.getElementById('chaikaMapRev8Styles')) return;
    const style = document.createElement('style');
    style.id = 'chaikaMapRev8Styles';
    style.textContent = `
      .leaflet-tile-pane{filter:saturate(.78) contrast(1.05) brightness(.92)}
      .chaika-group-marker{transition:transform .16s ease,box-shadow .16s ease}
      .chaika-group-marker:hover{transform:scale(1.05)}
      .chaika-group-marker.premium,.premium-marker{animation:chaikaPremiumGlow 1.75s ease-in-out infinite!important}
      @keyframes chaikaPremiumGlow{0%,100%{transform:scale(1);box-shadow:0 0 0 2px rgba(216,255,67,.18),0 0 18px rgba(216,255,67,.34),0 8px 24px rgba(0,0,0,.48)}50%{transform:scale(1.07);box-shadow:0 0 0 5px rgba(216,255,67,.10),0 0 30px rgba(216,255,67,.62),0 10px 30px rgba(0,0,0,.58)}}
      .chaika-location-confirm{position:absolute;z-index:1200;left:12px;right:12px;bottom:14px;display:flex;align-items:center;gap:10px;padding:11px 12px;border:1px solid #3a3a42;border-radius:17px;background:rgba(17,17,21,.96);box-shadow:0 18px 45px #0009;backdrop-filter:blur(18px)}
      .chaika-location-confirm strong{font-size:13px;line-height:1.2;flex:1}.chaika-location-confirm button{border:0;border-radius:11px;padding:9px 12px;font-size:12px;font-weight:800}.chaika-location-confirm .yes{background:#d8ff43;color:#111207}.chaika-location-confirm .no{background:#2a2a31;color:#fff}
      .chaika-stress-badge{position:absolute;z-index:1100;top:10px;left:10px;max-width:calc(100% - 70px);padding:8px 10px;border-radius:12px;background:rgba(11,11,13,.9);border:1px solid #45452e;color:#d8ff43;font:800 10px/1.25 system-ui;letter-spacing:.03em;pointer-events:none;box-shadow:0 8px 24px #0007}
    `;
    document.head.appendChild(style);
  }

  function chaikaUseDarkMapTiles() {
    if (!window.L || typeof map === 'undefined') return;
    let removed = false;
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
        removed = true;
      }
    });
    if (!removed && map.__chaikaDarkTiles) return;
    map.__chaikaDarkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 20,
        detectRetina: true,
        attribution: '© OpenStreetMap contributors © CARTO'
      }
    ).addTo(map);
  }

  function chaikaClusterConfig() {
    const zoom = map.getZoom();
    if (zoom >= 18) return { px: 32, meters: 38 };
    if (zoom >= 16) return { px: 38, meters: 70 };
    if (zoom >= 14) return { px: 43, meters: 105 };
    return { px: 46, meters: MAP_CLUSTER_MAX_METERS };
  }

  function chaikaClusterSort(a, b) {
    return Number(b.promoted) - Number(a.promoted) || parseEventDate(a) - parseEventDate(b);
  }

  chaikaGroupEvents = function(list) {
    const sorted = [...list].sort(chaikaClusterSort);
    const zoom = map.getZoom();
    const cfg = chaikaClusterConfig();
    const cell = cfg.px;
    const buckets = new Map();
    const groups = [];

    const bucketKey = (x, y) => `${x}:${y}`;
    const put = (index, x, y) => {
      const key = bucketKey(x, y);
      const arr = buckets.get(key) || [];
      arr.push(index);
      buckets.set(key, arr);
    };

    for (const event of sorted) {
      const point = map.project([event.lat, event.lng], zoom);
      const cx = Math.floor(point.x / cell);
      const cy = Math.floor(point.y / cell);
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const candidates = buckets.get(bucketKey(cx + dx, cy + dy)) || [];
          for (const index of candidates) {
            const group = groups[index];
            const pxDistance = Math.hypot(point.x - group.anchorPoint.x, point.y - group.anchorPoint.y);
            if (pxDistance > cfg.px || pxDistance >= bestDistance) continue;
            const meterDistance = kmBetween([event.lat, event.lng], [group.anchor.lat, group.anchor.lng]) * 1000;
            if (meterDistance > cfg.meters) continue;
            bestIndex = index;
            bestDistance = pxDistance;
          }
        }
      }

      if (bestIndex >= 0) {
        groups[bestIndex].events.push(event);
      } else {
        const index = groups.length;
        groups.push({ events: [event], anchor: event, anchorPoint: point });
        put(index, cx, cy);
      }
    }

    return groups.map(group => group.events.sort(chaikaClusterSort));
  };

  chaikaGroupMarkerIcon = function(group) {
    if (group.length === 1) return markerIcon(group[0]);
    const top = group[0];
    const cat = categoryMap[top.category] || categoryMap.other;
    const color = categoryColors[top.category] || categoryColors.other;
    const premium = group.some(event => event.promoted);
    const growth = Math.min(27, Math.round(Math.log2(Math.max(2, group.length)) * 7));
    const size = 42 + growth + (premium ? 4 : 0);
    const iconSize = Math.max(19, Math.min(25, Math.round(size * .43)));
    const countSize = group.length >= 100 ? 25 : 22;
    return L.divIcon({
      className: '',
      html: `<div class="chaika-group-marker ${premium ? 'premium' : ''}" style="--cat-color:${color};width:${size}px;height:${size}px"><span style="display:grid;place-items:center;width:${iconSize}px;height:${iconSize}px">${svgIcon(cat.icon)}</span><span class="chaika-group-count" style="min-width:${countSize}px;height:${countSize}px;line-height:${countSize - 4}px">${group.length}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  renderMap = function() {
    state.markers.forEach(marker => map.removeLayer(marker));
    state.markers = [];
    const list = filteredEvents();
    els.empty.classList.toggle('hidden', list.length > 0);
    const groups = chaikaGroupEvents(list);
    groups.forEach(group => {
      const top = group[0];
      const marker = L.marker([top.lat, top.lng], {
        icon: chaikaGroupMarkerIcon(group),
        bubblingMouseEvents: false,
        zIndexOffset: group.some(event => event.promoted) ? 600 : Math.min(400, group.length * 8)
      }).addTo(map);
      marker.on('click', () => chaikaShowEventGroup(group));
      state.markers.push(marker);
    });
    renderFeed();
    if (window.CHAIKA_STRESS?.enabled) window.CHAIKA_STRESS.updateBadge(groups.length);
  };

  if (!map.__chaikaClusterZoomListener) {
    map.__chaikaClusterZoomListener = true;
    map.on('zoomend', () => renderMap());
  }

  function chaikaInstallLongPressPlacement() {
    const container = map.getContainer();
    if (container.dataset.chaikaLongPress === '1') return;
    container.dataset.chaikaLongPress = '1';

    let timer = null;
    let start = null;
    let suppressClick = false;
    let previewMarker = null;
    let pendingLatLng = null;

    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      start = null;
    };

    const clearPreview = () => {
      if (previewMarker) map.removeLayer(previewMarker);
      previewMarker = null;
      pendingLatLng = null;
      document.getElementById('chaikaLocationConfirm')?.remove();
    };

    const ask = latlng => {
      clearPreview();
      pendingLatLng = latlng;
      previewMarker = L.circleMarker(latlng, {
        radius: 10,
        color: '#d8ff43',
        fillColor: '#d8ff43',
        fillOpacity: .25,
        weight: 3,
        interactive: false
      }).addTo(map);
      const box = document.createElement('div');
      box.id = 'chaikaLocationConfirm';
      box.className = 'chaika-location-confirm';
      box.innerHTML = '<strong>Поставить точку здесь?</strong><button class="no" type="button">Нет</button><button class="yes" type="button">Да</button>';
      document.getElementById('mapView').appendChild(box);
      box.querySelector('.no').onclick = clearPreview;
      box.querySelector('.yes').onclick = () => {
        const point = pendingLatLng;
        clearPreview();
        if (!point) return;
        chaikaSetChosenPoint(point.lat, point.lng, true);
        tg?.HapticFeedback?.notificationOccurred?.('success');
      };
    };

    container.addEventListener('pointerdown', event => {
      if (!chaikaPickingLocation || event.button > 0) return;
      if (event.target.closest('.leaflet-marker-icon,.leaflet-control,button,input,select,textarea')) return;
      start = { x: event.clientX, y: event.clientY };
      timer = setTimeout(() => {
        if (!start || !chaikaPickingLocation) return;
        const rect = container.getBoundingClientRect();
        const point = L.point(start.x - rect.left, start.y - rect.top);
        const latlng = map.containerPointToLatLng(point);
        suppressClick = true;
        ask(latlng);
        tg?.HapticFeedback?.impactOccurred?.('medium');
      }, 580);
    }, { passive: true });

    container.addEventListener('pointermove', event => {
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 11) clearTimer();
    }, { passive: true });
    container.addEventListener('pointerup', clearTimer, { passive: true });
    container.addEventListener('pointercancel', clearTimer, { passive: true });
    container.addEventListener('pointerleave', clearTimer, { passive: true });
    container.addEventListener('click', event => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    const note = document.getElementById('chaikaLocationNote');
    if (note) note.textContent = 'Можно ткнуть точку на карте или удерживать место ~0,6 сек и подтвердить установку.';
  }

  function stressRng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function makeStressEvents(count) {
    const rand = stressRng(470047);
    const centers = Array.from({ length: 36 }, (_, i) => ({
      lat: 59.9343 + (rand() - .5) * .16,
      lng: 30.3351 + (rand() - .5) * .25,
      category: iconCategories[i % iconCategories.length][0]
    }));
    const now = dateISO(0);
    return Array.from({ length: count }, (_, i) => {
      const center = centers[i % centers.length];
      const dense = i % 5 !== 0;
      const spread = dense ? .00034 : .0016;
      return {
        id: `stress_${i}`,
        title: `STRESS событие ${i + 1}`,
        category: center.category,
        date: now,
        time: `${String(10 + (i % 13)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
        price: i % 4 === 0 ? 500 : 0,
        venue: `Тестовая точка ${i % centers.length + 1}`,
        lat: center.lat + (rand() - .5) * spread,
        lng: center.lng + (rand() - .5) * spread,
        ageLimit: i % 3 === 0 ? 18 : 0,
        promoted: i % 17 === 0,
        description: 'Синтетическое событие для скрытого стресс-теста карты.',
        going: i % 91,
        owner: false,
        type: 'planned'
      };
    });
  }

  const stress = {
    enabled: false,
    count: 0,
    originalEvents: null,
    originalTime: null,
    lastMs: 0,
    enable(count = 1200) {
      const safeCount = Math.max(100, Math.min(5000, Number(count) || 1200));
      if (!this.originalEvents) { this.originalEvents = state.events; this.originalTime = state.time; }
      const events = makeStressEvents(safeCount);
      const started = performance.now();
      state.events = events;
      state.time = 'today';
      this.enabled = true;
      this.count = safeCount;
      renderMap();
      this.lastMs = performance.now() - started;
      this.updateBadge(state.markers.length);
      console.info(`[CHAIKA STRESS] ${safeCount} events -> ${state.markers.length} markers in ${this.lastMs.toFixed(1)} ms`);
      return { events: safeCount, markers: state.markers.length, renderMs: Number(this.lastMs.toFixed(1)) };
    },
    disable() {
      if (this.originalEvents) state.events = this.originalEvents;
      this.originalEvents = null;
      if (this.originalTime) state.time = this.originalTime;
      this.originalTime = null;
      this.enabled = false;
      document.getElementById('chaikaStressBadge')?.remove();
      renderMap();
    },
    benchmark(count = 2000, rounds = 5) {
      const events = makeStressEvents(Math.max(100, Math.min(5000, Number(count) || 2000)));
      const timings = [];
      for (let i = 0; i < Math.max(1, Math.min(20, rounds)); i++) {
        const started = performance.now();
        chaikaGroupEvents(events);
        timings.push(performance.now() - started);
      }
      const avg = timings.reduce((sum, value) => sum + value, 0) / timings.length;
      const result = { events: events.length, rounds: timings.length, avgClusterMs: Number(avg.toFixed(2)), maxClusterMs: Number(Math.max(...timings).toFixed(2)) };
      console.table(result);
      return result;
    },
    updateBadge(markers) {
      if (!this.enabled) return;
      let badge = document.getElementById('chaikaStressBadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'chaikaStressBadge';
        badge.className = 'chaika-stress-badge';
        document.getElementById('mapView').appendChild(badge);
      }
      badge.textContent = `STRESS · ${this.count} событий · ${markers} маркеров · ${this.lastMs.toFixed(1)} ms`;
    }
  };
  window.CHAIKA_STRESS = stress;

  chaikaInjectMapRev8Styles();
  chaikaUseDarkMapTiles();
  chaikaInstallLongPressPlacement();
  renderMap();

  const params = new URLSearchParams(location.search);
  if (params.get('stress') === '1') {
    const count = params.get('stressCount') || 1500;
    setTimeout(() => stress.enable(count), 350);
    setTimeout(() => { if (stress.enabled) stress.enable(count); }, 1600);
  }
})();

/* CHAIKA Telegram forum chat integration (rev9). */
(() => {
  const UUID_RE=/^[0-9a-f-]{36}$/i;
  const busy=new Set();
  const forumState={loaded:false,loading:false,error:null,forum:null};

  function injectStyles(){
    if(document.getElementById('chaikaEventChatStyles'))return;
    const style=document.createElement('style');
    style.id='chaikaEventChatStyles';
    style.textContent=`
      .chaika-chat-action{background:#2a2a31!important;color:#fff!important;border:1px solid #41414a!important}
      .event-sheet .chaika-chat-action{grid-column:1/-1}
      .detail-actions .chaika-chat-action{grid-column:1/-1}
      .chaika-forum-setup{display:grid;gap:10px}
      .chaika-forum-status{padding:10px 11px;border-radius:12px;background:#101014;border:1px solid #2d2d35;font-size:12px;line-height:1.45;color:#aaaab4}
      .chaika-forum-status.ok{border-color:#465229;color:#d8ff43}
      .chaika-forum-steps{margin:0;padding-left:18px;color:#9b9ba6;font-size:11px;line-height:1.5}
      .chaika-forum-row{display:grid;grid-template-columns:1fr auto;gap:8px}
      .chaika-forum-row input{min-width:0}
      .chaika-forum-row button{white-space:nowrap;padding:10px 12px}
    `;
    document.head.appendChild(style);
  }

  function openTelegram(url){
    if(!url)return;
    if(tg?.openTelegramLink)tg.openTelegramLink(url);
    else window.open(url,'_blank','noopener,noreferrer');
  }

  function chatErrorMessage(code){
    const value=String(code||'');
    if(value==='forum_not_configured')return 'Ты идёшь. Общий чат ещё не подключён администратором.';
    if(value==='topic_creation_pending')return 'Чат создаётся. Нажми «Чат» ещё раз через секунду.';
    if(value.includes('bot_needs_manage_topics'))return 'Боту нужны права администратора «Управление темами».';
    if(value.includes('topics_not_enabled'))return 'В Telegram-группе нужно включить режим «Темы».';
    return 'Не удалось открыть чат события.';
  }

  async function getEventChat(id,open=true){
    const event=state.events.find(x=>x.id===id);
    if(!event||!UUID_RE.test(String(id)))return false;
    if(event.chatUrl){if(open)openTelegram(event.chatUrl);return true;}
    const initData=window.Telegram?.WebApp?.initData||'';
    if(!initData)return toast('Открой ЧАЙКУ в Telegram, чтобы войти в чат');
    try{
      const row=await chaikaEdge('telegram-toggle-attendance',{initData,eventId:id,action:'chat'});
      if(row?.chat_url){event.chatUrl=row.chat_url;if(open)openTelegram(row.chat_url);return true;}
      toast(chatErrorMessage(row?.chat_error));
      return false;
    }catch(error){
      console.error('CHAIKA event chat open',error);
      if(error?.message==='not_attending'){
        state.going.delete(id);persist();renderFeed();
        if(state.selectedId===id)showEvent(id);
        toast('Сначала отметь «Пойду»');
        return false;
      }
      toast('Не удалось открыть чат события');
      return false;
    }
  }
  window.chaikaOpenEventChat=getEventChat;

  const baseToggleGoing=toggleGoing;
  toggleGoing=async function(id){
    if(!UUID_RE.test(String(id)))return baseToggleGoing(id);
    const event=state.events.find(x=>x.id===id);if(!event||busy.has(id))return;
    const initData=window.Telegram?.WebApp?.initData||'';
    if(!initData)return toast('Открой ЧАЙКУ в Telegram, чтобы отметить «Пойду»');
    if(chaikaAuth.status!=='ready'&&!(await chaikaAuthenticate()))return toast('Не удалось подтвердить Telegram-профиль');
    busy.add(id);
    try{
      const row=await chaikaEdge('telegram-toggle-attendance',{initData,eventId:id,action:'toggle'});
      const going=Boolean(row?.going);
      if(going)state.going.add(id);else state.going.delete(id);
      event.going=Math.max(0,Number(row?.going_count||0)-(going?1:0));
      if(row?.chat_url)event.chatUrl=row.chat_url;
      if(!going)delete event.chatUrl;
      persist();renderFeed();
      if(state.selectedId===id)showEvent(id);
      if(els.detail?.dataset.eventId===id&&!els.detail.classList.contains('hidden'))openEventDetail(id);
      updateProfile();tg?.HapticFeedback?.impactOccurred?.('light');
      if(going&&row?.chat_url){
        tg?.HapticFeedback?.notificationOccurred?.('success');
        openTelegram(row.chat_url);
      }else if(going&&row?.chat_error){
        toast(chatErrorMessage(row.chat_error));
      }
    }catch(error){
      console.error('CHAIKA attendance + chat',error);
      toast('Не удалось обновить «Пойду»');
    }finally{busy.delete(id);}
  };

  function makeChatButton(id,label='Чат'){
    const btn=document.createElement('button');
    btn.type='button';btn.className='secondary-btn chaika-chat-action';btn.dataset.chatEvent=id;btn.textContent=`💬 ${label}`;
    btn.onclick=()=>getEventChat(id,true);
    return btn;
  }

  function injectSheetChat(id){
    const event=state.events.find(x=>x.id===id);if(!event||!state.going.has(id))return;
    const actions=els.sheet?.querySelector('.actions');if(!actions||actions.querySelector('[data-chat-event]'))return;
    actions.appendChild(makeChatButton(id,'Чат участников'));
  }

  function injectDetailChat(id){
    const event=state.events.find(x=>x.id===id);if(!event||!state.going.has(id))return;
    const actions=els.detailBody?.querySelector('.detail-actions');if(!actions||actions.querySelector('[data-chat-event]'))return;
    actions.appendChild(makeChatButton(id,'Чат участников'));
  }

  function injectFeedChats(){
    if(!els.feed)return;
    els.feed.querySelectorAll('button[data-going]').forEach(goingBtn=>{
      const id=goingBtn.dataset.going;if(!id||!state.going.has(id))return;
      const actions=goingBtn.closest('.mini-actions');if(!actions||actions.querySelector('[data-chat-event]'))return;
      const btn=document.createElement('button');btn.type='button';btn.dataset.chatEvent=id;btn.textContent='💬 Чат';btn.onclick=()=>getEventChat(id,true);actions.appendChild(btn);
    });
  }

  const baseShowEvent=showEvent;
  showEvent=function(id){baseShowEvent(id);injectSheetChat(id);};
  const baseOpenEventDetail=openEventDetail;
  openEventDetail=function(id){baseOpenEventDetail(id);injectDetailChat(id);};
  const baseRenderFeed=renderFeed;
  renderFeed=function(){baseRenderFeed();injectFeedChats();};

  function forumErrorMessage(error){
    const code=String(error?.message||error||'');
    if(code==='invalid_forum_username')return 'Укажи @username публичной Telegram-группы.';
    if(code==='forum_must_be_supergroup')return 'Нужна Telegram-супергруппа, а не канал.';
    if(code==='topics_not_enabled')return 'В группе не включены «Темы». Включи их в настройках группы.';
    if(code==='forum_must_be_public')return 'Для MVP группа должна быть публичной и иметь @username.';
    if(code==='bot_needs_manage_topics')return 'Добавь @chaika47bot администратором и включи право «Управление темами».';
    if(code.includes('telegram_getChat'))return 'Группа не найдена. Проверь @username и доступ бота.';
    return 'Не удалось подключить Telegram-форум.';
  }

  async function loadForumStatus(){
    if(forumState.loading||!chaikaManagement?.isAdmin||chaikaAuth.status!=='ready')return;
    const initData=window.Telegram?.WebApp?.initData||'';if(!initData)return;
    forumState.loading=true;forumState.error=null;
    try{
      const data=await chaikaEdge('telegram-event-management',{initData,action:'forum_status'});
      forumState.forum=data.forum||{configured:false};forumState.loaded=true;
    }catch(error){forumState.error=error.message;forumState.loaded=true;console.error('CHAIKA forum status',error);}
    finally{forumState.loading=false;renderForumAdminUI();}
  }

  async function configureForum(){
    const input=document.getElementById('chaikaForumUsername');
    const button=document.getElementById('chaikaForumConnectBtn');
    const value=input?.value?.trim()||'';if(!value)return toast('Укажи @username Telegram-группы');
    const initData=window.Telegram?.WebApp?.initData||'';if(!initData)return;
    if(button){button.disabled=true;button.textContent='Проверяю…';}
    try{
      const data=await chaikaEdge('telegram-event-management',{initData,action:'forum_configure',forumUsername:value});
      forumState.forum=data.forum;forumState.loaded=true;forumState.error=null;
      toast('Общий чат ЧАЙКИ подключён');tg?.HapticFeedback?.notificationOccurred?.('success');
    }catch(error){forumState.error=error.message;toast(forumErrorMessage(error));}
    finally{if(button){button.disabled=false;button.textContent='Подключить';}renderForumAdminUI();}
  }

  function ensureForumSection(){
    let section=document.getElementById('chaikaForumSection');if(section)return section;
    const profile=document.getElementById('profileView');if(!profile)return null;
    section=document.createElement('section');section.id='chaikaForumSection';section.className='chaika-profile-section chaika-admin-section hidden';
    const adminSection=document.getElementById('chaikaAdminSection');
    profile.insertBefore(section,adminSection||profile.querySelector('.moderation-card')||document.getElementById('resetBtn'));
    return section;
  }

  function renderForumAdminUI(){
    const section=ensureForumSection();if(!section)return;
    const isAdmin=Boolean(chaikaManagement?.isAdmin);section.classList.toggle('hidden',!isAdmin);if(!isAdmin)return;
    const forum=forumState.forum;
    const configured=Boolean(forum?.configured);
    const status=forumState.loading?'Проверяю подключение…':configured?`Подключено: @${escapeHtml(forum.username||'')} · ${escapeHtml(forum.title||'Telegram')}`:'Общий Telegram-форум пока не подключён.';
    const error=forumState.error?`<div class="chaika-forum-status">${escapeHtml(forumErrorMessage(forumState.error))}</div>`:'';
    section.innerHTML=`<div class="chaika-forum-setup"><h3>Чаты событий <span class="chaika-admin-badge">ADMIN</span></h3><div class="chaika-forum-status ${configured?'ok':''}">${status}</div>${error}<ol class="chaika-forum-steps"><li>Создай публичную Telegram-супергруппу.</li><li>Включи в ней режим «Темы».</li><li>Добавь @chaika47bot администратором с правом «Управление темами».</li><li>Вставь @username группы ниже.</li></ol><div class="chaika-forum-row"><input id="chaikaForumUsername" type="text" placeholder="@chaika_events_spb" value="${configured?'@'+escapeHtml(forum.username||''):''}"><button id="chaikaForumConnectBtn" class="secondary-btn small" type="button">Подключить</button></div><p class="muted" style="margin:0;font-size:11px">После подключения первый «Пойду» создаёт тему события, а участник сразу переходит в неё.</p></div>`;
    document.getElementById('chaikaForumConnectBtn')?.addEventListener('click',configureForum);
    if(!forumState.loaded&&!forumState.loading)queueMicrotask(loadForumStatus);
  }

  if(typeof chaikaRenderManagementPanels==='function'){
    const baseRenderManagement=chaikaRenderManagementPanels;
    chaikaRenderManagementPanels=function(){baseRenderManagement();renderForumAdminUI();};
  }

  injectStyles();
  injectFeedChats();
  renderForumAdminUI();
})();


/* CHAIKA auto-connect default Telegram forum for admin (rev12). */
(() => {
  const DEFAULT_FORUM='@ckaikamain';
  const KEY='chaika_forum_autoconfig_rev12';
  let busy=false,done=false,attempts=0;

  function friendly(error){
    const code=String(error?.message||error||'');
    if(code.includes('forum_must_be_supergroup'))return 'Группа @ckaikamain должна быть супергруппой.';
    if(code.includes('topics_not_enabled'))return 'В @ckaikamain нужно включить «Темы».';
    if(code.includes('bot_needs_manage_topics'))return 'Добавь @chaika47bot администратором @ckaikamain с правом «Управление темами».';
    if(code.includes('telegram_getChat'))return 'Бот пока не видит группу @ckaikamain.';
    return 'Не удалось автоматически подключить чат @ckaikamain.';
  }

  async function connect(){
    if(done||busy)return;
    if(!window.Telegram?.WebApp?.initData||typeof chaikaEdge!=='function'||typeof chaikaManagement==='undefined'||typeof chaikaAuth==='undefined')return;
    if(chaikaAuth.status!=='ready'||!chaikaManagement.isAdmin)return;
    busy=true;
    try{
      const initData=window.Telegram.WebApp.initData;
      const status=await chaikaEdge('telegram-event-management',{initData,action:'forum_status'});
      if(status?.forum?.configured){done=true;sessionStorage.setItem(KEY,'ok');return;}
      const result=await chaikaEdge('telegram-event-management',{initData,action:'forum_configure',forumUsername:DEFAULT_FORUM});
      if(result?.forum?.configured){
        done=true;sessionStorage.setItem(KEY,'ok');
        if(typeof toast==='function')toast('Общий чат ЧАЙКИ подключён');
        if(typeof chaikaRenderManagementPanels==='function')chaikaRenderManagementPanels();
      }
    }catch(error){
      attempts++;
      console.error('CHAIKA forum auto-config',error);
      if(attempts===1&&typeof toast==='function')toast(friendly(error));
    }finally{busy=false;}
  }

  const timer=setInterval(()=>{
    if(done||sessionStorage.getItem(KEY)==='ok'){done=true;clearInterval(timer);return;}
    connect();
    if(attempts>=4)clearInterval(timer);
  },1200);
  setTimeout(connect,350);
})();


/* CHAIKA light UI + hierarchical clustering + scrollable cluster sheet (rev10). */
(() => {
  if (!window.L || typeof map === 'undefined') return;

  const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  function injectLightUiStyles() {
    if (document.getElementById('chaikaLightUiRev10Styles')) return;
    const style = document.createElement('style');
    style.id = 'chaikaLightUiRev10Styles';
    style.textContent = `
      :root{--bg:#f5f6f1;--card:#ffffff;--card2:#f0f2ec;--card3:#e7eae2;--text:#111315;--muted:#777b73;--accent:#d8ff43;--accentText:#101207;--danger:#e74d5c;--warning:#d99b25}
      html,body{background:var(--bg)!important;color:var(--text)!important}
      body{color-scheme:light}
      #app{background:var(--bg)}
      .topbar{background:rgba(255,255,255,.94);border-bottom:1px solid #e7e9e2;backdrop-filter:blur(18px)}
      .brand-mark{background:#111315!important;box-shadow:0 5px 18px rgba(17,19,21,.12)}
      .eyebrow,.muted,.event-meta,.feed-card p,.concert-meta,.helper,.form-note,.profile-card p,.chaika-location-note{color:var(--muted)!important}
      .icon-btn,.search-wrap,.chip,.feed-card,.concert-card,.form-card,.profile-card,.stats-grid div,.moderation-card,.chaika-profile-section,.chaika-manage-item{background:#fff!important;border-color:#e1e4dc!important;color:var(--text)!important;box-shadow:0 7px 24px rgba(26,31,24,.055)}
      .search-wrap input,.chip,.filter-btn,.icon-btn{color:var(--text)!important}
      .search-wrap input::placeholder{color:#9a9e96!important}
      .filter-btn{border-left-color:#e4e6df!important}
      .chip.active,.primary-btn,.concert-bottom button,.badge,.create-circle{background:var(--accent)!important;color:var(--accentText)!important;border-color:var(--accent)!important}
      .secondary-btn,.mini-actions button,.chaika-manage-actions button,.segmented,.seg-btn.active{background:#eef0ea!important;color:var(--text)!important;border-color:#dfe2da!important}
      .seg-btn{color:#7b7f77!important}.seg-btn.active{color:#111315!important}
      input,select,textarea,.date-shell{background:#fff!important;color:var(--text)!important;border-color:#d9ddd4!important}
      input:focus,select:focus,textarea:focus,.date-shell:focus-within{border-color:#9ebd24!important;box-shadow:0 0 0 3px rgba(216,255,67,.22)}
      .field-label,label{color:#353934!important}
      .icon-choice,.category-filter{background:#fff!important;color:#30342f!important;border-color:#dde0d8!important}
      .icon-choice.active,.category-filter.active{background:#f6ffd8!important;border-color:#a9c92f!important;color:#6f8615!important}
      .bottom-nav{background:rgba(255,255,255,.96)!important;border-top-color:#e1e4dc!important;box-shadow:0 -8px 28px rgba(25,30,23,.06)}
      .nav-item{color:#858a82!important}.nav-item.active{color:#111315!important}
      .leaflet-tile-pane{filter:saturate(.86) contrast(.98) brightness(1.025)!important}
      #map{background:#edf0e8!important}
      .leaflet-control-attribution{background:rgba(255,255,255,.82)!important;color:#777!important}
      .leaflet-control-attribution a{color:#555!important}
      .leaflet-control-zoom{border:0!important;box-shadow:0 6px 22px rgba(31,35,29,.12)!important}
      .leaflet-control-zoom a{background:#fff!important;color:#151715!important;border-color:#e1e4dc!important}
      .regular-marker{background:#fff!important;color:var(--cat-color)!important;border:2px solid var(--cat-color)!important;box-shadow:0 6px 18px rgba(19,24,17,.18)!important}
      .premium-marker{background:var(--accent)!important;color:#111315!important;border:3px solid #fff!important}
      .chaika-group-marker{background:#fff!important;color:var(--cat-color,#111)!important;border:3px solid var(--cat-color,#111)!important;box-shadow:0 7px 24px rgba(17,23,15,.18)!important}
      .chaika-group-marker.premium{background:#f7ffd9!important;border-color:#9fbe24!important;color:#53660d!important}
      .chaika-group-count{background:#111315!important;color:#fff!important;border-color:#fff!important;box-shadow:0 3px 10px rgba(0,0,0,.14)}
      .chaika-group-marker.premium .chaika-group-count{background:var(--accent)!important;color:#111315!important}
      .event-sheet{background:rgba(255,255,255,.97)!important;border-color:#dfe3da!important;color:var(--text)!important;box-shadow:0 18px 48px rgba(30,35,28,.18)!important}
      .event-type-icon,.activity-icon{background:#f0f2ec!important}
      .chaika-group-open{padding:0!important;overflow:hidden!important;max-height:min(68dvh,590px)!important}
      .chaika-group-sheet{display:flex!important;flex-direction:column;gap:0;max-height:min(68dvh,590px);min-height:0}
      .chaika-group-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 14px 11px;background:rgba(255,255,255,.98);border-bottom:1px solid #eceee8}
      .chaika-group-head-main{min-width:0}.chaika-group-head h3{margin:0;color:#111315;font-size:17px}.chaika-group-head .muted{display:block;margin-top:3px;font-size:11px}
      .chaika-group-close{flex:none;width:34px;height:34px;border:0;border-radius:50%;background:#eef0ea;color:#111315;font-size:22px;line-height:1;display:grid;place-items:center}
      .chaika-group-list{min-height:0;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;padding:10px 10px calc(12px + env(safe-area-inset-bottom,0px));display:grid;gap:8px;scrollbar-width:thin;scrollbar-color:#cdd1c7 transparent}
      .chaika-group-list::-webkit-scrollbar{width:5px}.chaika-group-list::-webkit-scrollbar-thumb{background:#cdd1c7;border-radius:999px}
      .chaika-group-event{background:#f8f9f6!important;color:#111315!important;border:1px solid #e2e5dd!important;border-radius:16px!important;box-shadow:none!important;touch-action:manipulation}
      .chaika-group-event:active{transform:scale(.99);background:#f0f2ec!important}
      .chaika-group-event p{color:#777b73!important}.chaika-group-chevron{color:#8b9087!important}
      .modal-backdrop{background:rgba(35,39,33,.28)!important}.modal-card{background:#fff!important;border-color:#e1e4dc!important;color:#111315!important}
      .modal-close{background:#eef0ea!important;color:#111315!important}
      .event-detail-view{background:#f5f6f1!important;color:#111315!important}.event-detail-body{background:#fff!important;color:#111315!important}
      .chaika-location-confirm{background:rgba(255,255,255,.97)!important;border-color:#dfe3da!important;color:#111315!important;box-shadow:0 18px 45px rgba(25,30,23,.18)!important}
      .chaika-location-confirm .no{background:#eef0ea!important;color:#111315!important}.chaika-location-confirm .yes{background:var(--accent)!important;color:#111315!important}
      .chaika-stress-badge{background:rgba(255,255,255,.94)!important;border-color:#dfe3da!important;color:#53660d!important;box-shadow:0 8px 24px rgba(30,35,28,.12)!important}
      .chaika-chat-action{background:#eef0ea!important;color:#111315!important;border-color:#dfe2da!important}
      .chaika-forum-status{background:#f5f6f1!important;border-color:#dde1d7!important;color:#72776e!important}.chaika-forum-status.ok{border-color:#b7ce58!important;color:#607515!important}
      .chaika-forum-steps{color:#777b73!important}
      .toast{background:#111315!important;color:#fff!important}
      .empty-state{background:#fff!important;color:#777b73!important;border:1px solid #e1e4dc;box-shadow:0 10px 28px rgba(25,30,23,.10)}
      @keyframes chaikaLightPremiumGlow{0%,100%{transform:scale(1);box-shadow:0 0 0 2px rgba(176,210,46,.18),0 0 16px rgba(177,215,37,.34),0 7px 22px rgba(17,23,15,.16)}50%{transform:scale(1.07);box-shadow:0 0 0 6px rgba(188,224,46,.15),0 0 28px rgba(177,215,37,.52),0 9px 26px rgba(17,23,15,.18)}}
      .chaika-group-marker.premium,.premium-marker{animation:chaikaLightPremiumGlow 1.8s ease-in-out infinite!important}
    `;
    document.head.appendChild(style);
  }

  function useLightMapTiles() {
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    map.__chaikaLightTiles = L.tileLayer(LIGHT_TILE_URL, {
      subdomains: 'abcd',
      maxZoom: 20,
      detectRetina: true,
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);
  }

  function clusterRadiusPx(zoom) {
    if (zoom >= 18) return 34;
    if (zoom === 17) return 40;
    if (zoom === 16) return 48;
    if (zoom === 15) return 58;
    if (zoom === 14) return 70;
    if (zoom === 13) return 82;
    if (zoom === 12) return 96;
    return 116;
  }

  function clusterSort(a, b) {
    return Number(b.promoted) - Number(a.promoted) || parseEventDate(a) - parseEventDate(b);
  }

  function attachCenter(events, lat, lng) {
    Object.defineProperty(events, '__chaikaCenter', {
      value: { lat, lng }, configurable: true, enumerable: false, writable: true
    });
    return events;
  }

  chaikaGroupEvents = function(list) {
    const sorted = [...list].sort(clusterSort);
    if (!sorted.length) return [];
    const zoom = map.getZoom();

    // At a very distant city/world view the whole visible event set becomes one clear cluster.
    if (zoom <= 10) {
      const sum = sorted.reduce((acc, event) => {
        acc.lat += Number(event.lat);
        acc.lng += Number(event.lng);
        return acc;
      }, { lat: 0, lng: 0 });
      return [attachCenter(sorted, sum.lat / sorted.length, sum.lng / sorted.length)];
    }

    const radius = clusterRadiusPx(zoom);
    const cell = radius;
    const buckets = new Map();
    const groups = [];
    const bucketKey = (x, y) => `${x}:${y}`;
    const addBucket = (groupIndex, x, y) => {
      const key = bucketKey(x, y);
      const group = groups[groupIndex];
      if (group.bucketKeys.has(key)) return;
      group.bucketKeys.add(key);
      const listForCell = buckets.get(key) || [];
      listForCell.push(groupIndex);
      buckets.set(key, listForCell);
    };

    for (const event of sorted) {
      const lat = Number(event.lat);
      const lng = Number(event.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const point = map.project([lat, lng], zoom);
      const cx = Math.floor(point.x / cell);
      const cy = Math.floor(point.y / cell);
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const candidates = buckets.get(bucketKey(cx + dx, cy + dy)) || [];
          for (const index of candidates) {
            const group = groups[index];
            const distance = Math.hypot(point.x - group.centerX, point.y - group.centerY);
            if (distance <= radius && distance < bestDistance) {
              bestIndex = index;
              bestDistance = distance;
            }
          }
        }
      }

      if (bestIndex < 0) {
        const index = groups.length;
        groups.push({
          events: [event], count: 1,
          sumLat: lat, sumLng: lng,
          sumX: point.x, sumY: point.y,
          centerX: point.x, centerY: point.y,
          bucketKeys: new Set()
        });
        addBucket(index, cx, cy);
        continue;
      }

      const group = groups[bestIndex];
      group.events.push(event);
      group.count += 1;
      group.sumLat += lat;
      group.sumLng += lng;
      group.sumX += point.x;
      group.sumY += point.y;
      group.centerX = group.sumX / group.count;
      group.centerY = group.sumY / group.count;
      addBucket(bestIndex, Math.floor(group.centerX / cell), Math.floor(group.centerY / cell));
    }

    return groups.map(group => {
      const events = group.events.sort(clusterSort);
      return attachCenter(events, group.sumLat / group.count, group.sumLng / group.count);
    });
  };

  chaikaGroupMarkerIcon = function(group) {
    if (group.length === 1) return markerIcon(group[0]);
    const top = group[0];
    const cat = categoryMap[top.category] || categoryMap.other;
    const color = categoryColors[top.category] || categoryColors.other;
    const premium = group.some(event => event.promoted);
    const zoomBoost = map.getZoom() <= 10 ? 14 : map.getZoom() <= 12 ? 7 : 0;
    const growth = Math.min(30, Math.round(Math.log2(Math.max(2, group.length)) * 6.5));
    const size = Math.min(88, 44 + growth + zoomBoost + (premium ? 3 : 0));
    const iconSize = Math.max(19, Math.min(27, Math.round(size * .38)));
    const countSize = group.length >= 100 ? 28 : 23;
    return L.divIcon({
      className: '',
      html: `<div class="chaika-group-marker ${premium ? 'premium' : ''}" style="--cat-color:${color};width:${size}px;height:${size}px"><span style="display:grid;place-items:center;width:${iconSize}px;height:${iconSize}px">${svgIcon(cat.icon)}</span><span class="chaika-group-count" style="min-width:${countSize}px;height:${countSize}px;line-height:${countSize - 4}px">${group.length}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  chaikaShowEventGroup = function(group) {
    if (!group?.length) return;
    if (group.length === 1) {
      els.sheet.classList.remove('chaika-group-open');
      return showEvent(group[0].id);
    }

    state.selectedId = null;
    const center = group.__chaikaCenter || { lat: group[0].lat, lng: group[0].lng };
    map.panTo([center.lat, center.lng], { animate: true });
    els.sheet.classList.add('chaika-group-open');
    els.sheet.innerHTML = `
      <div class="chaika-group-sheet">
        <div class="chaika-group-head">
          <div class="chaika-group-head-main"><h3>${group.length} событий</h3><span class="muted">Премиум выше · листай список</span></div>
          <button class="chaika-group-close" type="button" aria-label="Закрыть">×</button>
        </div>
        <div class="chaika-group-list">
          ${group.map(event => {
            const cat = categoryMap[event.category] || categoryMap.other;
            return `<button class="chaika-group-event" data-group-event="${event.id}" type="button"><div class="event-type-icon" ${catStyle(event.category)}>${svgIcon(cat.icon)}</div><div>${event.promoted ? '<span class="badge">ПРЕМИУМ</span>' : ''}<h4>${escapeHtml(event.title)}</h4><p>${formatDate(event)} · ${event.price ? event.price + ' ₽' : 'Бесплатно'}<br>${escapeHtml(event.venue)}</p></div><span class="chaika-group-chevron">›</span></button>`;
          }).join('')}
        </div>
      </div>`;
    els.sheet.classList.remove('hidden');

    const listEl = els.sheet.querySelector('.chaika-group-list');
    if (listEl) {
      listEl.scrollTop = 0;
      L.DomEvent.disableClickPropagation(listEl);
      L.DomEvent.disableScrollPropagation(listEl);
    }
    L.DomEvent.disableClickPropagation(els.sheet);
    L.DomEvent.disableScrollPropagation(els.sheet);

    els.sheet.querySelector('.chaika-group-close')?.addEventListener('click', () => {
      els.sheet.classList.remove('chaika-group-open');
      closeEventSheet();
    });
    els.sheet.querySelectorAll('[data-group-event]').forEach(button => {
      button.addEventListener('click', () => {
        els.sheet.classList.remove('chaika-group-open');
        showEvent(button.dataset.groupEvent);
      });
    });
  };

  renderMap = function() {
    state.markers.forEach(marker => map.removeLayer(marker));
    state.markers = [];
    const list = filteredEvents();
    els.empty.classList.toggle('hidden', list.length > 0);
    const groups = chaikaGroupEvents(list);
    groups.forEach(group => {
      const top = group[0];
      const center = group.__chaikaCenter || { lat: top.lat, lng: top.lng };
      const marker = L.marker([center.lat, center.lng], {
        icon: chaikaGroupMarkerIcon(group),
        bubblingMouseEvents: false,
        zIndexOffset: group.some(event => event.promoted) ? 700 : Math.min(500, group.length * 9)
      }).addTo(map);
      marker.on('click', () => chaikaShowEventGroup(group));
      state.markers.push(marker);
    });
    renderFeed();
    if (window.CHAIKA_STRESS?.enabled) window.CHAIKA_STRESS.updateBadge(groups.length);
  };

  injectLightUiStyles();
  useLightMapTiles();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f5f6f1');
  try {
    tg?.setHeaderColor?.('#f5f6f1');
    tg?.setBackgroundColor?.('#f5f6f1');
  } catch (_) {}
  renderMap();
})();


/* CHAIKA premium dark shell over the light map (rev11). */
(() => {
  const style = document.createElement('style');
  style.id = 'chaikaDarkShellRev11';
  style.textContent = `
    :root{--bg:#0b0b0d;--card:#17171b;--card2:#202026;--card3:#27272f;--text:#f7f7f8;--muted:#97979f;--accent:#d8ff43;--accentText:#111207;--danger:#ff5c67;--warning:#ffca55}
    html,body{background:#0b0b0d!important;color:#f7f7f8!important;color-scheme:dark}
    #app{background:#0b0b0d!important}
    .topbar{background:rgba(11,11,13,.97)!important;border-bottom:1px solid #25252c!important;backdrop-filter:blur(20px)!important}
    .brand-mark{background:#050506!important;box-shadow:none!important}
    .eyebrow,.muted,.event-meta,.feed-card p,.concert-meta,.helper,.form-note,.profile-card p,.chaika-location-note{color:#97979f!important}
    .icon-btn,.search-wrap,.chip,.feed-card,.concert-card,.form-card,.profile-card,.stats-grid div,.moderation-card,.chaika-profile-section,.chaika-manage-item{background:#17171b!important;border-color:#2b2b33!important;color:#f7f7f8!important;box-shadow:none!important}
    .search-wrap input,.chip,.filter-btn,.icon-btn{color:#f7f7f8!important}
    .search-wrap input::placeholder{color:#777781!important}.filter-btn{border-left-color:#303038!important}
    .chip.active,.primary-btn,.concert-bottom button,.badge,.create-circle{background:#d8ff43!important;color:#111207!important;border-color:#d8ff43!important}
    .secondary-btn,.mini-actions button,.chaika-manage-actions button,.segmented,.seg-btn.active{background:#202026!important;color:#f7f7f8!important;border-color:#34343d!important}
    .seg-btn{color:#97979f!important}.seg-btn.active{background:#27272f!important;color:#fff!important}
    input,select,textarea,.date-shell{background:#101013!important;color:#fff!important;border-color:#33333c!important}
    input:focus,select:focus,textarea:focus,.date-shell:focus-within{border-color:#d8ff43!important;box-shadow:none!important}
    .field-label,label{color:#c7c7cd!important}
    .icon-choice,.category-filter{background:#111114!important;color:#ddd!important;border-color:#303038!important}
    .icon-choice.active,.category-filter.active{background:#222617!important;border-color:#d8ff43!important;color:#d8ff43!important}
    .bottom-nav{background:rgba(14,14,17,.98)!important;border-top:1px solid #25252c!important;box-shadow:0 -10px 30px rgba(0,0,0,.28)!important;backdrop-filter:blur(20px)!important}
    .nav-item{color:#85858e!important}.nav-item.active{color:#d8ff43!important}

    /* Keep the map itself light. */
    #map{background:#edf0e8!important}
    .leaflet-tile-pane{filter:saturate(.86) contrast(.98) brightness(1.025)!important}
    .leaflet-control-attribution{background:rgba(255,255,255,.82)!important;color:#777!important}.leaflet-control-attribution a{color:#555!important}
    .leaflet-control-zoom a{background:#fff!important;color:#151715!important;border-color:#e1e4dc!important}
    .regular-marker{background:#fff!important;color:var(--cat-color)!important;border:2px solid var(--cat-color)!important;box-shadow:0 6px 18px rgba(19,24,17,.18)!important}
    .premium-marker{background:#d8ff43!important;color:#111315!important;border:3px solid #fff!important}
    .chaika-group-marker{background:#fff!important;color:var(--cat-color,#111)!important;border:3px solid var(--cat-color,#111)!important;box-shadow:0 7px 24px rgba(17,23,15,.18)!important}
    .chaika-group-marker.premium{background:#f7ffd9!important;border-color:#9fbe24!important;color:#53660d!important}
    .chaika-group-count{background:#111315!important;color:#fff!important;border-color:#fff!important}
    .chaika-group-marker.premium .chaika-group-count{background:#d8ff43!important;color:#111315!important}

    .event-sheet{background:rgba(19,19,23,.97)!important;border-color:#303038!important;color:#fff!important;box-shadow:0 18px 50px rgba(0,0,0,.56)!important}
    .event-type-icon,.activity-icon{background:#25252d!important}
    .chaika-group-head{background:rgba(19,19,23,.99)!important;border-bottom-color:#2b2b33!important}
    .chaika-group-head h3{color:#fff!important}.chaika-group-close{background:#292930!important;color:#fff!important}
    .chaika-group-list{scrollbar-color:#4a4a52 transparent!important}
    .chaika-group-event{background:#17171c!important;color:#fff!important;border-color:#2c2c34!important}
    .chaika-group-event:active{background:#202026!important}.chaika-group-event p{color:#9f9faa!important}.chaika-group-chevron{color:#8b8b95!important}
    .modal-backdrop{background:#000a!important}.modal-card{background:#151519!important;border-color:#303038!important;color:#fff!important}.modal-close{background:#292930!important;color:#fff!important}
    .event-detail-view{background:#0b0b0d!important;color:#fff!important}.event-detail-body{background:#0b0b0d!important;color:#fff!important}
    .chaika-location-confirm{background:rgba(17,17,21,.96)!important;border-color:#3a3a42!important;color:#fff!important;box-shadow:0 18px 45px #0009!important}
    .chaika-location-confirm .no{background:#2a2a31!important;color:#fff!important}.chaika-location-confirm .yes{background:#d8ff43!important;color:#111207!important}
    .chaika-stress-badge{background:rgba(11,11,13,.9)!important;border-color:#45452e!important;color:#d8ff43!important;box-shadow:0 8px 24px #0007!important}
    .chaika-chat-action{background:#2a2a31!important;color:#fff!important;border-color:#41414a!important}
    .chaika-forum-status{background:#101014!important;border-color:#2d2d35!important;color:#aaaab4!important}.chaika-forum-status.ok{border-color:#465229!important;color:#d8ff43!important}
    .chaika-forum-steps{color:#9b9ba6!important}.empty-state{background:#17171b!important;color:#97979f!important;border-color:#2b2b33!important;box-shadow:0 10px 28px rgba(0,0,0,.3)!important}
    .toast{background:#f7f7f8!important;color:#111!important}
  `;
  document.head.appendChild(style);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b0b0d');
  try {
    tg?.setHeaderColor?.('#0b0b0d');
    tg?.setBackgroundColor?.('#0b0b0d');
  } catch (_) {}
})();


/* CHAIKA interaction stability: Moscow date filters, atomic marker swaps, Telegram swipe lock (rev13). */
(() => {
  const APP_TZ = 'Europe/Moscow';

  function tzParts(value) {
    const d = value instanceof Date ? value : new Date(value);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(d);
    const out = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return { date: `${out.year}-${out.month}-${out.day}`, time: `${out.hour}:${out.minute}` };
  }

  function addCalendarDays(dateString, amount) {
    const [y,m,d] = dateString.split('-').map(Number);
    const base = new Date(Date.UTC(y, m - 1, d + amount, 12, 0, 0));
    return base.toISOString().slice(0, 10);
  }

  // Keep all event day buckets tied to Saint Petersburg/Moscow calendar dates,
  // regardless of the phone's current timezone.
  try {
    chaikaDateParts = function(value) { return tzParts(value); };
  } catch (_) {}

  try {
    isWithinTime = function(event) {
      const today = tzParts(new Date()).date;
      const eventDate = String(event?.date || '');
      if (state.time === 'now') {
        return event?.type === 'instant' && (!event.expiresAt || event.expiresAt > Date.now());
      }
      if (event?.type === 'instant' && state.time === 'today') {
        return !event.expiresAt || event.expiresAt > Date.now();
      }
      if (state.time === 'today') return eventDate === today;
      if (state.time === 'tomorrow') return eventDate === addCalendarDays(today, 1);
      if (state.time === 'week') return eventDate >= today && eventDate <= addCalendarDays(today, 7);
      if (state.time === 'month') return eventDate >= today && eventDate <= addCalendarDays(today, 30);
      return true;
    };
  } catch (_) {}

  // Replace marker layers atomically so switching Today/Tomorrow/Week/Month
  // does not briefly clear the map before the next marker set is ready.
  if (window.L && typeof map !== 'undefined') {
    let activeLayer = null;
    const previousMarkers = Array.isArray(state?.markers) ? [...state.markers] : [];

    renderMap = function() {
      const baseList = filteredEvents();
      const list = typeof window.chaikaFilterMapEvents === 'function'
        ? window.chaikaFilterMapEvents(baseList)
        : baseList;
      const groups = typeof chaikaGroupEvents === 'function' ? chaikaGroupEvents(list) : list.map(e => [e]);
      const nextLayer = L.layerGroup();
      const nextMarkers = [];

      for (const group of groups) {
        if (!group?.length) continue;
        const center = group.__chaikaCenter || { lat: Number(group[0].lat), lng: Number(group[0].lng) };
        if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) continue;
        const icon = typeof chaikaGroupMarkerIcon === 'function' ? chaikaGroupMarkerIcon(group) : markerIcon(group[0]);
        const marker = L.marker([center.lat, center.lng], { icon, bubblingMouseEvents: false });
        marker.on('click', () => typeof chaikaShowEventGroup === 'function' ? chaikaShowEventGroup(group) : showEvent(group[0].id));
        marker.addTo(nextLayer);
        nextMarkers.push(marker);
      }

      // Add first, remove old second: no blank frame during a filter change.
      nextLayer.addTo(map);
      if (activeLayer) map.removeLayer(activeLayer);
      else previousMarkers.forEach(marker => { try { map.removeLayer(marker); } catch (_) {} });
      activeLayer = nextLayer;
      state.markers = nextMarkers;

      els.empty?.classList.toggle('hidden', list.length > 0);
      if (state.selectedId && !list.some(event => event.id === state.selectedId)) closeEventSheet?.();
      renderFeed();
    };

    map.on('zoomend', () => renderMap());
  }

  // Telegram Mini App: prevent content swipes from minimizing the app.
  // Telegram still reserves its own native header gesture.
  try {
    if (tg) {
      tg.expand?.();
      if (tg.isVersionAtLeast?.('7.7')) tg.disableVerticalSwipes?.();
      tg.enableClosingConfirmation?.();
    }
  } catch (_) {}

  function ensureCloseButton() {
    if (!tg || document.getElementById('chaikaCloseApp')) return;
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const btn = document.createElement('button');
    btn.id = 'chaikaCloseApp';
    btn.type = 'button';
    btn.className = 'chaika-close-app';
    btn.setAttribute('aria-label', 'Закрыть ЧАЙКУ');
    btn.textContent = '×';
    btn.addEventListener('click', () => tg.close?.());
    topbar.appendChild(btn);
  }

  const style = document.createElement('style');
  style.id = 'chaikaInteractionStabilityRev13';
  style.textContent = `
    .topbar{position:relative;padding-right:52px!important}
    .chaika-close-app{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:1px solid #34343d;border-radius:50%;background:#202026;color:#fff;font:400 25px/30px system-ui;display:grid;place-items:center;z-index:5}
    .chaika-close-app:active{transform:translateY(-50%) scale(.94)}
    .chaika-group-marker{display:grid!important;place-items:center!important;overflow:visible!important}
    .chaika-group-marker>span:first-child{display:grid!important;place-items:center!important;color:inherit!important}
    .chaika-group-marker svg{display:block!important;width:100%!important;height:100%!important;fill:currentColor!important;color:inherit!important}
    .chaika-group-count{display:grid!important;place-items:center!important;line-height:1!important;font-weight:900!important;z-index:3!important}
  `;
  document.head.appendChild(style);
  ensureCloseButton();

  // Re-render after time filter interaction only after the original click handler has updated state.
  document.addEventListener('click', event => {
    const btn = event.target?.closest?.('[data-time]');
    if (!btn) return;
    requestAnimationFrame(() => {
      try { renderMap(); map.invalidateSize?.({ pan: false }); } catch (_) {}
    });
  });

  // Reload once so already-fetched rows are converted using the corrected timezone logic.
  if (typeof chaikaLoadEvents === 'function') {
    queueMicrotask(async () => {
      try { await chaikaLoadEvents(false); renderMap(); } catch (_) {}
    });
  } else {
    try { renderMap(); } catch (_) {}
  }
})();


/* CHAIKA profile activity, avatar upload and referrals (rev15). */
(() => {
  const tgApp = window.Telegram?.WebApp;
  const profileState = { loaded:false, loading:false, data:null, active:'going' };

  const profileView = document.getElementById('profileView');
  if (!profileView) return;

  const style = document.createElement('style');
  style.textContent = `
    .profile-card{position:relative}.chaika-avatar-wrap{position:relative;width:66px;height:66px;flex:none}.chaika-avatar-wrap .avatar{width:66px;height:66px;overflow:hidden;padding:0}.chaika-avatar-wrap .avatar img{width:100%;height:100%;object-fit:cover;display:block}.chaika-avatar-edit{position:absolute;right:-3px;bottom:-3px;width:28px;height:28px;border-radius:50%;border:2px solid #0b0b0d;background:#d8ff43;color:#111207;font-size:15px;font-weight:900;display:grid;place-items:center;cursor:pointer}.stats-grid>div{cursor:pointer;transition:transform .15s ease,border-color .15s ease}.stats-grid>div:active{transform:scale(.98)}.stats-grid>div.chaika-stat-active{border-color:#d8ff43!important;background:#202515!important}.chaika-profile-activity{margin-top:14px;padding:14px;border:1px solid #2b2b33;border-radius:18px;background:#151519}.chaika-profile-activity-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.chaika-profile-activity h3{margin:0;font-size:17px}.chaika-activity-list{display:grid;gap:8px;margin-top:10px}.chaika-activity-card{width:100%;text-align:left;border:1px solid #2c2c34;background:#111115;color:#fff;border-radius:14px;padding:11px 12px;display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:center}.chaika-activity-card:active{background:#1b1b21}.chaika-activity-icon{width:42px;height:42px;border-radius:12px;background:#25252d;display:grid;place-items:center;font-size:20px;overflow:hidden}.chaika-activity-icon img{width:100%;height:100%;object-fit:cover}.chaika-activity-main{min-width:0}.chaika-activity-title{font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chaika-activity-meta{font-size:12px;color:#9999a4;margin-top:3px;line-height:1.3}.chaika-activity-arrow{font-size:22px;color:#8b8b95}.chaika-profile-empty{padding:12px 4px;color:#92929d;font-size:13px}.chaika-invite-btn{margin-top:10px;width:100%}.chaika-profile-loading{opacity:.62;pointer-events:none}`;
  document.head.appendChild(style);

  const avatar = document.getElementById('avatar');
  const profileCard = profileView.querySelector('.profile-card');
  if (avatar && profileCard && !document.getElementById('chaikaAvatarInput')) {
    const wrap = document.createElement('div');
    wrap.className = 'chaika-avatar-wrap';
    avatar.parentNode.insertBefore(wrap, avatar);
    wrap.appendChild(avatar);
    const input = document.createElement('input');
    input.id = 'chaikaAvatarInput'; input.type = 'file'; input.accept = 'image/*'; input.hidden = true;
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'chaika-avatar-edit'; edit.textContent = '+'; edit.setAttribute('aria-label','Изменить фотографию');
    wrap.append(input, edit);
    edit.onclick = () => input.click();
    input.onchange = async () => { const file=input.files?.[0]; if(file) await uploadAvatar(file); input.value=''; };
  }

  const stats = [...profileView.querySelectorAll('.stats-grid > div')];
  stats[0]?.setAttribute('data-profile-section','going');
  stats[1]?.setAttribute('data-profile-section','created');
  stats[2]?.setAttribute('data-profile-section','referrals');
  stats.forEach(el => { el.tabIndex=0; el.setAttribute('role','button'); el.onclick=()=>openSection(el.dataset.profileSection); el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSection(el.dataset.profileSection)}}; });

  const panel = document.createElement('section');
  panel.id = 'chaikaProfileActivity'; panel.className = 'chaika-profile-activity';
  panel.innerHTML = '<div class="chaika-profile-activity-head"><h3 id="chaikaActivityTitle">Мои планы</h3></div><div id="chaikaActivityList" class="chaika-activity-list"><div class="chaika-profile-empty">Загрузка…</div></div><button id="chaikaInviteBtn" class="primary-btn chaika-invite-btn hidden" type="button">Пригласить друзей</button>';
  const statsGrid = profileView.querySelector('.stats-grid');
  statsGrid?.insertAdjacentElement('afterend', panel);
  document.getElementById('chaikaInviteBtn').onclick = shareReferral;

  function profileEdge(action, extra={}) {
    const initData = window.Telegram?.WebApp?.initData || '';
    return chaikaEdge('telegram-profile', { initData, action, ...extra });
  }

  function mapRow(row) {
    if (typeof chaikaManagedToEvent === 'function') return chaikaManagedToEvent(row);
    const d = new Date(row.starts_at), parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d); const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    const time = new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
    return {id:row.id,title:row.title,category:row.category,date:`${p.year}-${p.month}-${p.day}`,time,price:Number(row.price_rub||0),venue:row.venue||'',lat:Number(row.lat),lng:Number(row.lng),ageLimit:Number(row.age_limit||0),promoted:Boolean(row.promoted),description:row.description||'',ticketUrl:row.ticket_url||'',imageData:row.image_url||'',going:Number(row.going_count||0),type:row.event_type||'planned'};
  }

  function renderAvatar(profile) {
    const el=document.getElementById('avatar'); if(!el)return;
    const url=profile?.avatar_url||profile?.photo_url||tgApp?.initDataUnsafe?.user?.photo_url||'';
    if(url){el.innerHTML=`<img src="${escapeHtml(url)}" alt="Фото профиля">`;}
  }

  function dateLabel(row){ try{return new Date(row.starts_at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'});}catch{return ''} }

  function renderSection() {
    const d=profileState.data; if(!d)return;
    const list=document.getElementById('chaikaActivityList'), title=document.getElementById('chaikaActivityTitle'), invite=document.getElementById('chaikaInviteBtn');
    stats.forEach(x=>x.classList.toggle('chaika-stat-active',x.dataset.profileSection===profileState.active));
    invite.classList.toggle('hidden',profileState.active!=='referrals');
    if(profileState.active==='going'){
      title.textContent='События, на которые я иду';
      list.innerHTML=d.attending?.length?d.attending.map(r=>`<button class="chaika-activity-card" data-event-open="${r.id}" type="button"><span class="chaika-activity-icon">📍</span><span class="chaika-activity-main"><span class="chaika-activity-title">${escapeHtml(r.title)}</span><span class="chaika-activity-meta">${dateLabel(r)} · ${escapeHtml(r.venue||'')}</span></span><span class="chaika-activity-arrow">›</span></button>`).join(''):'<div class="chaika-profile-empty">Ты пока никуда не собираешься.</div>';
    } else if(profileState.active==='created'){
      title.textContent='Созданные события';
      list.innerHTML=d.created?.length?d.created.map(r=>`<button class="chaika-activity-card" data-event-open="${r.id}" type="button"><span class="chaika-activity-icon">＋</span><span class="chaika-activity-main"><span class="chaika-activity-title">${escapeHtml(r.title)}</span><span class="chaika-activity-meta">${dateLabel(r)} · ${escapeHtml(r.venue||'')} · ${r.moderation_status==='published'?'опубликовано':r.moderation_status==='rejected'?'отклонено':'на проверке'}</span></span><span class="chaika-activity-arrow">›</span></button>`).join(''):'<div class="chaika-profile-empty">Ты пока не создавал событий.</div>';
    } else {
      title.textContent='Мои рефералы';
      list.innerHTML=d.referrals?.length?d.referrals.map(u=>{const name=[u.first_name,u.last_name].filter(Boolean).join(' ')||u.username||'Пользователь';const photo=u.avatar_url||u.photo_url;return `<button class="chaika-activity-card" data-ref-user="${escapeHtml(u.username||'')}" type="button"><span class="chaika-activity-icon">${photo?`<img src="${escapeHtml(photo)}" alt="">`:'👤'}</span><span class="chaika-activity-main"><span class="chaika-activity-title">${escapeHtml(name)}</span><span class="chaika-activity-meta">${u.username?'@'+escapeHtml(u.username):'Пользователь ЧАЙКИ'}</span></span><span class="chaika-activity-arrow">›</span></button>`}).join(''):'<div class="chaika-profile-empty">Пока никто не зарегистрировался по твоей ссылке.</div>';
    }
    list.querySelectorAll('[data-event-open]').forEach(btn=>btn.onclick=()=>openServerEvent(btn.dataset.eventOpen));
    list.querySelectorAll('[data-ref-user]').forEach(btn=>btn.onclick=()=>{const username=btn.dataset.refUser;if(username)tgApp?.openTelegramLink?.(`https://t.me/${username}`)});
  }

  function openServerEvent(id){const row=[...(profileState.data?.attending||[]),...(profileState.data?.created||[])].find(x=>x.id===id);if(!row)return;const e=mapRow(row);const idx=state.events.findIndex(x=>x.id===e.id);if(idx>=0)state.events[idx]={...state.events[idx],...e};else state.events.push(e);switchView('mapView');setTimeout(()=>{renderMap();showEvent(e.id)},80);}

  async function loadProfile(force=false){
    if(profileState.loading||(!force&&profileState.loaded))return;
    if(!window.Telegram?.WebApp?.initData)return;
    profileState.loading=true;panel.classList.add('chaika-profile-loading');
    try{const data=await profileEdge('dashboard');profileState.data=data;profileState.loaded=true;renderAvatar(data.profile);document.getElementById('goingStat').textContent=String(data.counts?.going||0);document.getElementById('createdStat').textContent=String(data.counts?.created||0);document.getElementById('refStat').textContent=String(data.counts?.referrals||0);renderSection();}catch(e){console.error('CHAIKA profile',e);document.getElementById('chaikaActivityList').innerHTML='<div class="chaika-profile-empty">Не удалось загрузить профиль.</div>';}finally{profileState.loading=false;panel.classList.remove('chaika-profile-loading');}
  }

  function openSection(name){profileState.active=name||'going';if(!profileState.loaded)loadProfile();else renderSection();}

  async function avatarDataUrl(file){return await new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{try{const side=Math.min(img.naturalWidth||img.width,img.naturalHeight||img.height);const sx=Math.max(0,((img.naturalWidth||img.width)-side)/2);const sy=Math.max(0,((img.naturalHeight||img.height)-side)/2);const size=512;const c=document.createElement('canvas');c.width=size;c.height=size;const ctx=c.getContext('2d');if(!ctx)throw new Error('canvas_unavailable');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,sx,sy,side,side,0,0,size,size);const out=c.toDataURL('image/jpeg',.78);URL.revokeObjectURL(url);resolve(out);}catch(e){URL.revokeObjectURL(url);reject(e)}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image_decode_failed'))};img.src=url;});}

  async function uploadAvatar(file){
    const type=String(file.type||'').toLowerCase();
    if(!type.startsWith('image/')){toast('Выбери фотографию');return;}
    try{
      toast('Подготавливаю аватар…');
      const dataUrl=await avatarDataUrl(file);
      const data=await profileEdge('avatar',{dataUrl});
      if(profileState.data?.profile)profileState.data.profile.avatar_url=data.avatar_url;
      renderAvatar({avatar_url:data.avatar_url});
      toast('Фото профиля обновлено');
    }catch(e){
      console.error('CHAIKA avatar upload',e);
      const code=String(e?.message||e||'');
      if(code.includes('image_decode_failed')) toast('Не удалось прочитать фото. Попробуй другое изображение');
      else toast('Не удалось загрузить фото. Попробуй ещё раз');
    }
  }

  function shareReferral(){const uid=tgApp?.initDataUnsafe?.user?.id;if(!uid)return;const link=`https://t.me/chaika47bot?startapp=ref_${uid}`;const text='Залетай в ЧАЙКУ — события рядом на карте';const share=`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;tgApp?.openTelegramLink?.(share);}

  async function registerReferralFromStart(){const p=tgApp?.initDataUnsafe?.start_param||new URLSearchParams(location.search).get('tgWebAppStartParam')||'';const m=String(p).match(/^ref_(\d+)$/);if(!m||sessionStorage.getItem('chaika_ref_registered'))return;try{await profileEdge('register_referral',{inviterTelegramUserId:Number(m[1])});sessionStorage.setItem('chaika_ref_registered','1');}catch(e){console.warn('CHAIKA referral',e)}}

  const originalSwitchView = typeof switchView==='function'?switchView:null;
  if(originalSwitchView){switchView=function(id){const r=originalSwitchView(id);if(id==='profileView')setTimeout(()=>loadProfile(true),0);return r;};}
  registerReferralFromStart();
  if(!profileView.classList.contains('hidden'))loadProfile();
})();

/* CHAIKA iOS/Telegram safe-area alignment (rev16). */
(() => {
  const tgApp = window.Telegram?.WebApp;

  function applyInsets() {
    const safe = tgApp?.safeAreaInset || {};
    const contentSafe = tgApp?.contentSafeAreaInset || {};
    const top = Math.max(Number(safe.top || 0), Number(contentSafe.top || 0), 0);
    const bottom = Math.max(Number(safe.bottom || 0), Number(contentSafe.bottom || 0), 0);
    document.documentElement.style.setProperty('--chaika-tg-safe-top', `${top}px`);
    document.documentElement.style.setProperty('--chaika-tg-safe-bottom', `${bottom}px`);
  }

  const style = document.createElement('style');
  style.id = 'chaikaSafeAreaRev16';
  style.textContent = `
    :root{--chaika-tg-safe-top:0px;--chaika-tg-safe-bottom:0px}
    .topbar{
      padding-top:max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top))!important;
      min-height:calc(64px + max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top)))!important;
      box-sizing:border-box!important;
      align-items:flex-end!important;
      padding-bottom:10px!important;
    }
    .chaika-close-app{
      top:calc(max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top)) + 27px)!important;
      transform:none!important;
    }
    .chaika-close-app:active{transform:scale(.94)!important}
    .map-toolbar,.map-controls,.search-row,.map-search-row{
      scroll-margin-top:calc(max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top)) + 8px);
    }
    .bottom-nav{
      padding-bottom:max(env(safe-area-inset-bottom, 0px), var(--chaika-tg-safe-bottom))!important;
      box-sizing:border-box!important;
    }
  `;
  document.head.appendChild(style);

  applyInsets();
  try {
    tgApp?.onEvent?.('safeAreaChanged', applyInsets);
    tgApp?.onEvent?.('contentSafeAreaChanged', applyInsets);
    tgApp?.onEvent?.('viewportChanged', applyInsets);
  } catch (_) {}
  window.addEventListener('resize', applyInsets, { passive: true });
})();


/* CHAIKA Telegram header layout: compact safe-area handling for sheet/fullscreen modes (rev23). */
(() => {
  const tgApp = window.Telegram?.WebApp;
  const root = document.documentElement;

  function pxNumber(value) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function cssInset(name) {
    return pxNumber(getComputedStyle(root).getPropertyValue(name));
  }

  function isTelegramMobile() {
    if (!tgApp) return false;
    const platform = String(tgApp.platform || '').toLowerCase();
    const mobilePlatform = platform === 'ios' || platform === 'android';
    const mobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    const launchedInTelegram = Boolean(tgApp.initData) || (platform && platform !== 'unknown');
    return launchedInTelegram && (mobilePlatform || mobileDevice);
  }

  function resolveHeaderTop(contentTop, safeTop) {
    if (!isTelegramMobile()) return Math.max(contentTop, safeTop);

    if (tgApp?.isFullscreen === true) {
      const contentInsetMissing = contentTop <= safeTop + 8;
      if (contentInsetMissing) return Math.max(safeTop + 36, 82);
      return Math.min(Math.max(contentTop, safeTop), 96);
    }

    // In the regular rounded Telegram sheet the WebView itself is already
    // shifted below the status bar. Large values here are screen-relative on
    // some iOS builds, so applying them unbounded creates a second huge gap.
    return Math.max(safeTop, Math.min(contentTop, 60));
  }

  function syncTelegramInsets() {
    const contentTop = Math.max(
      pxNumber(tgApp?.contentSafeAreaInset?.top),
      cssInset('--tg-content-safe-area-inset-top')
    );
    const safeTop = Math.max(
      pxNumber(tgApp?.safeAreaInset?.top),
      cssInset('--tg-safe-area-inset-top')
    );
    const contentBottom = Math.max(
      pxNumber(tgApp?.contentSafeAreaInset?.bottom),
      cssInset('--tg-content-safe-area-inset-bottom')
    );
    const safeBottom = Math.max(
      pxNumber(tgApp?.safeAreaInset?.bottom),
      cssInset('--tg-safe-area-inset-bottom')
    );

    root.style.setProperty('--chaika-content-safe-top', `${resolveHeaderTop(contentTop, safeTop)}px`);
    root.style.setProperty('--chaika-content-safe-bottom', `${Math.max(contentBottom, safeBottom)}px`);
  }

  function removeDuplicateClose() {
    document.getElementById('chaikaCloseApp')?.remove();
  }

  const style = document.createElement('style');
  style.id = 'chaikaHeaderLayoutRev17';
  style.textContent = `
    :root{
      --chaika-content-safe-top:0px;
      --chaika-content-safe-bottom:0px;
    }

    /* Telegram owns the fullscreen header controls. Do not draw a second close button. */
    #chaikaCloseApp,.chaika-close-app{display:none!important}

    /* Keep CHAIKA brand fully below Telegram's native Close / menu controls. */
    .topbar{
      position:relative!important;
      z-index:1100!important;
      padding-top:calc(max(var(--chaika-content-safe-top), env(safe-area-inset-top, 0px)) + 8px)!important;
      padding-right:16px!important;
      padding-bottom:10px!important;
      padding-left:16px!important;
      min-height:unset!important;
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
    }
    .topbar .brand-wrap{
      position:relative!important;
      z-index:1!important;
      min-width:0!important;
      max-width:100%!important;
      margin:0!important;
    }
    .topbar .brand-wrap h1{white-space:nowrap!important}

    /* Search and time filters always occupy their own rows below the brand. */
    .search-wrap{position:relative!important;z-index:1090!important;margin-top:0!important}
    .filters{position:relative!important;z-index:1090!important}

    /* Bottom bar also respects Telegram/device content safe area. */
    .bottom-nav{
      padding-bottom:calc(7px + max(var(--chaika-content-safe-bottom), var(--tg-content-safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))!important;
    }
  `;
  document.head.appendChild(style);

  removeDuplicateClose();
  syncTelegramInsets();

  try {
    tgApp?.BackButton?.hide?.();
    tgApp?.onEvent?.('safeAreaChanged', syncTelegramInsets);
    tgApp?.onEvent?.('contentSafeAreaChanged', syncTelegramInsets);
    tgApp?.onEvent?.('viewportChanged', syncTelegramInsets);
    tgApp?.onEvent?.('fullscreenChanged', () => {
      syncTelegramInsets();
      removeDuplicateClose();
    });
  } catch (_) {}

  // Rev13 may append its close button slightly later in startup.
  requestAnimationFrame(removeDuplicateClose);
  setTimeout(removeDuplicateClose, 150);
  setTimeout(removeDuplicateClose, 600);
  requestAnimationFrame(syncTelegramInsets);
  setTimeout(syncTelegramInsets, 150);
  setTimeout(syncTelegramInsets, 600);
  window.addEventListener('resize', syncTelegramInsets, { passive: true });
  document.addEventListener('visibilitychange', syncTelegramInsets);
})();


/* CHAIKA in-app support feedback -> Telegram forum topic (rev18). */
(() => {
  const tgApp = window.Telegram?.WebApp;
  if (!document.body || document.getElementById('chaikaSupportButton')) return;

  const style = document.createElement('style');
  style.id = 'chaikaSupportRev18Style';
  style.textContent = `
    .chaika-support-fab{position:fixed;right:14px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:1450;width:38px;height:38px;border-radius:50%;border:1px solid #3a3a42;background:rgba(22,22,27,.94);color:#d8ff43;display:grid;place-items:center;font:900 18px/1 system-ui;box-shadow:0 8px 24px #0007;backdrop-filter:blur(14px)}
    .chaika-support-fab:active{transform:scale(.94)}
    .chaika-support-modal{position:fixed;inset:0;z-index:4200;display:flex;align-items:flex-end;justify-content:center}
    .chaika-support-backdrop{position:absolute;inset:0;background:#000a;backdrop-filter:blur(3px)}
    .chaika-support-card{position:relative;width:min(100%,430px);background:#151519;border:1px solid #303038;border-radius:24px 24px 0 0;padding:17px 16px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -20px 60px #000b}
    .chaika-support-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px}.chaika-support-head h3{font-size:20px;margin:0}.chaika-support-close{width:34px;height:34px;border-radius:50%;border:0;background:#292930;color:#fff;font-size:22px;line-height:1}
    .chaika-support-sub{margin:0 0 14px;color:#97979f;font-size:12px;line-height:1.45}
    .chaika-support-types{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:11px}.chaika-support-type{border:1px solid #33333c;background:#101013;color:#c8c8ce;border-radius:12px;padding:10px 5px;font-size:11px;font-weight:700}.chaika-support-type.active{background:#252b16;border-color:#d8ff43;color:#d8ff43}
    .chaika-support-card textarea{min-height:120px;resize:none;margin:0 0 10px;background:#101013;border:1px solid #33333c;color:#fff;border-radius:14px;padding:12px;width:100%;outline:none}.chaika-support-card textarea:focus{border-color:#d8ff43}
    .chaika-support-send{width:100%;border:0;border-radius:14px;padding:13px 14px;background:#d8ff43;color:#111207;font-weight:900}.chaika-support-send:disabled{opacity:.5;pointer-events:none}
    .chaika-support-note{text-align:center;color:#74747d;font-size:10px;margin:9px 4px 0}
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'chaikaSupportButton';
  fab.className = 'chaika-support-fab';
  fab.type = 'button';
  fab.textContent = '?';
  fab.setAttribute('aria-label', 'Техподдержка');
  fab.title = 'Техподдержка';
  document.body.appendChild(fab);

  let modal = null;
  let kind = 'problem';

  function closeSupport(){ modal?.remove(); modal = null; }
  function openSupport(){
    if (modal) return;
    kind = 'problem';
    modal = document.createElement('div');
    modal.className = 'chaika-support-modal';
    modal.innerHTML = `
      <div class="chaika-support-backdrop"></div>
      <section class="chaika-support-card" role="dialog" aria-modal="true" aria-label="Техподдержка ЧАЙКИ">
        <div class="chaika-support-head"><h3>Техподдержка</h3><button class="chaika-support-close" type="button" aria-label="Закрыть">×</button></div>
        <p class="chaika-support-sub">Расскажи, что сломалось или что стоит улучшить. Сообщение уйдёт команде ЧАЙКИ.</p>
        <div class="chaika-support-types">
          <button class="chaika-support-type active" data-kind="problem" type="button">Проблема</button>
          <button class="chaika-support-type" data-kind="idea" type="button">Идея</button>
          <button class="chaika-support-type" data-kind="other" type="button">Другое</button>
        </div>
        <textarea id="chaikaSupportMessage" maxlength="2000" placeholder="Опиши проблему или идею…"></textarea>
        <button id="chaikaSupportSend" class="chaika-support-send" type="button">Отправить</button>
        <p class="chaika-support-note">К сообщению прикрепятся Telegram-профиль и технический контекст приложения.</p>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector('.chaika-support-backdrop').onclick = closeSupport;
    modal.querySelector('.chaika-support-close').onclick = closeSupport;
    modal.querySelectorAll('[data-kind]').forEach(btn => btn.onclick = () => {
      kind = btn.dataset.kind;
      modal.querySelectorAll('[data-kind]').forEach(x => x.classList.toggle('active', x === btn));
    });
    modal.querySelector('#chaikaSupportSend').onclick = sendSupport;
    setTimeout(() => modal?.querySelector('#chaikaSupportMessage')?.focus(), 120);
  }

  async function sendSupport(){
    const textarea = modal?.querySelector('#chaikaSupportMessage');
    const send = modal?.querySelector('#chaikaSupportSend');
    const message = String(textarea?.value || '').trim();
    if (message.length < 3) { toast?.('Напиши хотя бы пару слов'); return; }
    const initData = tgApp?.initData || '';
    if (!initData) { toast?.('Открой ЧАЙКУ через Telegram'); return; }
    send.disabled = true; send.textContent = 'Отправляю…';
    try {
      const activeView = document.querySelector('.active-view')?.id || '';
      await chaikaEdge('telegram-support', {
        initData,
        kind,
        message,
        context: {
          view: activeView,
          version: 'rev18',
          platform: tgApp?.platform || navigator.platform || ''
        }
      });
      closeSupport();
      toast?.('Спасибо — сообщение отправлено в поддержку');
      tgApp?.HapticFeedback?.notificationOccurred?.('success');
    } catch (e) {
      console.error('CHAIKA support', e);
      send.disabled = false; send.textContent = 'Отправить';
      toast?.('Не удалось отправить. Попробуй ещё раз');
      tgApp?.HapticFeedback?.notificationOccurred?.('error');
    }
  }

  fab.onclick = openSupport;
  window.chaikaOpenSupport = openSupport;
})();

/* CHAIKA draggable event/cluster sheet + geolocated startup (rev19). */
(() => {
  const SPB = [59.9343, 30.3351];
  const CITY_ZOOM = 13;
  const USER_ZOOM = 14;
  let drag = null;
  let userLocated = false;

  function closeSheet() {
    try { els.sheet.classList.add('hidden'); } catch (_) {}
    try { els.sheet.classList.remove('chaika-group-open'); } catch (_) {}
    try { state.selectedId = null; } catch (_) {}
  }

  function ensureSheetChrome() {
    const sheet = els?.sheet;
    if (!sheet || sheet.querySelector('.chaika-sheet-handle')) return;
    const handle = document.createElement('div');
    handle.className = 'chaika-sheet-handle';
    handle.setAttribute('aria-hidden','true');
    sheet.prepend(handle);
  }

  function bindSheetGestures() {
    const sheet = els?.sheet;
    if (!sheet || sheet.__chaikaGestureBound) return;
    sheet.__chaikaGestureBound = true;

    sheet.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button,input,textarea,select,a')) return;
      drag = { id:e.pointerId, y:e.clientY, last:e.clientY, moved:false };
      sheet.setPointerCapture?.(e.pointerId);
      sheet.classList.add('chaika-sheet-dragging');
    });
    sheet.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dy = Math.max(0, e.clientY - drag.y);
      drag.last = e.clientY;
      drag.moved = drag.moved || dy > 4;
      sheet.style.transform = `translateY(${dy}px)`;
      sheet.style.transition = 'none';
    });
    const finish = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dy = Math.max(0, drag.last - drag.y);
      const shouldClose = dy > Math.min(160, window.innerHeight * .18);
      drag = null;
      sheet.classList.remove('chaika-sheet-dragging');
      sheet.style.transition = '';
      if (shouldClose) {
        sheet.style.transform = 'translateY(110%)';
        setTimeout(() => { sheet.style.transform=''; closeSheet(); }, 180);
      } else {
        sheet.style.transform = '';
      }
    };
    sheet.addEventListener('pointerup', finish);
    sheet.addEventListener('pointercancel', finish);
  }

  // Close any open sheet when the map itself is tapped.
  try {
    map.on('click', () => {
      if (!els.sheet.classList.contains('hidden')) closeSheet();
    });
  } catch (_) {}

  // Re-inject drag handle after sheet content is replaced by event/group rendering.
  const mo = new MutationObserver(() => { ensureSheetChrome(); bindSheetGestures(); });
  try { mo.observe(els.sheet, { childList:true, subtree:false }); } catch (_) {}
  ensureSheetChrome(); bindSheetGestures();

  function showUserLocation(lat, lng, accuracy) {
    userLocated = true;
    state.userLocation = [lat, lng];
    map.setView([lat, lng], USER_ZOOM, { animate:false });
    if (window.L) {
      if (window.__chaikaUserDot) map.removeLayer(window.__chaikaUserDot);
      window.__chaikaUserDot = L.circleMarker([lat,lng], {
        radius:7, weight:3, color:'#fff', fillColor:'#4f8cff', fillOpacity:1
      }).addTo(map);
      if (Number.isFinite(accuracy)) {
        if (window.__chaikaUserAccuracy) map.removeLayer(window.__chaikaUserAccuracy);
        window.__chaikaUserAccuracy = L.circle([lat,lng], {
          radius:Math.min(Math.max(accuracy, 20), 1200), weight:1, opacity:.25, fillOpacity:.04
        }).addTo(map);
      }
    }
  }

  function fallbackToCity() {
    if (userLocated) return;
    map.setView(SPB, CITY_ZOOM, { animate:false });
  }

  function locateAtStartup() {
    fallbackToCity();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => showUserLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => fallbackToCity(),
      { enableHighAccuracy:true, timeout:7000, maximumAge:120000 }
    );
  }

  // Make the location icon in the topbar useful as a re-center action.
  document.addEventListener('click', e => {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const svg = btn.querySelector('use')?.getAttribute('href') || '';
    if (!svg.includes('i-pin')) return;
    if (state.userLocation) map.setView(state.userLocation, USER_ZOOM, { animate:true });
    else locateAtStartup();
  }, true);

  const style = document.createElement('style');
  style.id = 'chaikaSheetGeoRev19';
  style.textContent = `
    .event-sheet{max-height:min(72dvh,620px)!important;overflow:hidden!important;touch-action:pan-y;transition:transform .18s ease,opacity .18s ease}
    .event-sheet.chaika-sheet-dragging{will-change:transform}
    .chaika-sheet-handle{width:42px;height:5px;border-radius:999px;background:#5b5c64;margin:8px auto 10px;opacity:.9;flex:none}
    .chaika-group-sheet{max-height:min(68dvh,590px)!important}
    .chaika-group-list{overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
  `;
  document.head.appendChild(style);

  // Run after existing startup rendering so the initial viewport is corrected last.
  setTimeout(locateAtStartup, 120);
})();


/* CHAIKA event sheet layout fix: keep below filters, reliable close/drag (rev20). */
(() => {
  const sheet = els?.sheet;
  if (!sheet) return;

  function controlsBottom() {
    const filters = document.querySelector('.filters');
    const search = document.querySelector('.search-wrap');
    const topbar = document.querySelector('.topbar');
    const candidates = [filters, search, topbar].filter(Boolean);
    return Math.max(0, ...candidates.map(el => el.getBoundingClientRect().bottom));
  }

  function applySheetBounds() {
    const top = Math.ceil(controlsBottom() + 8);
    const nav = document.querySelector('.bottom-nav');
    const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight;
    const available = Math.max(180, navTop - top - 8);
    document.documentElement.style.setProperty('--chaika-sheet-top', `${top}px`);
    document.documentElement.style.setProperty('--chaika-sheet-max', `${available}px`);
  }

  function closeSheetNow() {
    try { sheet.classList.add('hidden'); } catch (_) {}
    try { sheet.classList.remove('chaika-group-open'); } catch (_) {}
    try { sheet.style.transform = ''; } catch (_) {}
    try { state.selectedId = null; } catch (_) {}
  }

  function ensureCloseButton() {
    if (sheet.querySelector('.chaika-sheet-close-fixed')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chaika-sheet-close-fixed';
    btn.setAttribute('aria-label','Закрыть список событий');
    btn.textContent = '×';
    btn.addEventListener('click', e => { e.stopPropagation(); closeSheetNow(); });
    sheet.appendChild(btn);
  }

  const style = document.createElement('style');
  style.id = 'chaikaSheetLayoutRev20';
  style.textContent = `
    .event-sheet{
      position:fixed!important;
      left:12px!important;
      right:12px!important;
      top:var(--chaika-sheet-top)!important;
      bottom:auto!important;
      max-height:var(--chaika-sheet-max)!important;
      height:auto!important;
      border-radius:22px!important;
      overflow:hidden!important;
      z-index:1900!important;
    }
    .event-sheet.chaika-group-open{padding:0!important}
    .chaika-group-sheet{max-height:var(--chaika-sheet-max)!important;height:100%!important;min-height:0!important}
    .chaika-group-list{min-height:0!important;overflow-y:auto!important;padding-bottom:18px!important}
    .chaika-sheet-handle{position:sticky;top:0;z-index:5;margin:7px auto 4px!important}
    .chaika-sheet-close-fixed{
      position:absolute;right:10px;top:8px;z-index:20;width:34px;height:34px;border-radius:50%;
      border:1px solid #34343d;background:#202026;color:#fff;font-size:24px;line-height:1;
      display:grid;place-items:center;
    }
    .chaika-group-head{padding-right:54px!important}
    @media (max-height:720px){.event-sheet{border-radius:18px!important}}
  `;
  document.head.appendChild(style);

  const mo = new MutationObserver(() => {
    applySheetBounds();
    ensureCloseButton();
  });
  mo.observe(sheet, { childList:true, subtree:false, attributes:true, attributeFilter:['class'] });

  // Drag only from the handle/header area; this avoids fighting with list scrolling.
  let drag = null;
  sheet.addEventListener('pointerdown', e => {
    const dragZone = e.target.closest('.chaika-sheet-handle,.chaika-group-head');
    if (!dragZone || e.target.closest('button,a,input,textarea,select')) return;
    drag = { id:e.pointerId, y:e.clientY, last:e.clientY };
    sheet.setPointerCapture?.(e.pointerId);
    sheet.style.transition='none';
  }, true);
  sheet.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - drag.y);
    drag.last = e.clientY;
    sheet.style.transform=`translateY(${dy}px)`;
  }, true);
  const finish = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dy = Math.max(0, drag.last - drag.y);
    drag = null;
    sheet.style.transition='transform .18s ease';
    if (dy > 110) {
      sheet.style.transform='translateY(110%)';
      setTimeout(closeSheetNow, 170);
    } else {
      sheet.style.transform='';
    }
  };
  sheet.addEventListener('pointerup', finish, true);
  sheet.addEventListener('pointercancel', finish, true);

  window.addEventListener('resize', applySheetBounds);
  window.Telegram?.WebApp?.onEvent?.('viewportChanged', applySheetBounds);
  window.Telegram?.WebApp?.onEvent?.('contentSafeAreaChanged', applySheetBounds);

  applySheetBounds();
  ensureCloseButton();
})();


/* CHAIKA museums/exhibitions tab with live imported events (rev21). */
(() => {
  if (!document.body || typeof state === 'undefined') return;

  try { categoryMap.museum = { label:'Музеи', icon:'i-art' }; } catch (_) {}
  try { categoryColors.museum = '#d79bff'; } catch (_) {}

  const style = document.createElement('style');
  style.id = 'chaikaMuseumsRev21Style';
  style.textContent = `
    .bottom-nav.chaika-six-nav{grid-template-columns:repeat(6,1fr)!important;padding-left:4px!important;padding-right:4px!important}
    .bottom-nav.chaika-six-nav .nav-item{font-size:8px!important;min-width:0}
    .bottom-nav.chaika-six-nav .nav-item>svg{width:19px;height:19px}
    .chaika-museum-head{padding:10px 0 14px}.chaika-museum-head h2{margin:0;font-size:22px}.chaika-museum-head p{margin:5px 0 0;color:#97979f;font-size:12px;line-height:1.45}
    .chaika-museum-list{display:grid;gap:12px;padding-bottom:26px}
    .chaika-museum-card{overflow:hidden;border:1px solid #2b2b33;border-radius:20px;background:#17171b;color:#fff}
    .chaika-museum-image{height:184px;background:#222229;position:relative;overflow:hidden;display:flex;align-items:flex-end}
    .chaika-museum-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .chaika-museum-image:after{content:'';position:absolute;inset:35% 0 0;background:linear-gradient(transparent,rgba(10,10,12,.84))}
    .chaika-museum-image-fallback{position:absolute;inset:0;display:grid;place-items:center;font-size:54px;color:#d8ff43;background:linear-gradient(135deg,#25252d,#121216)}
    .chaika-museum-image .badge{position:relative;z-index:2;margin:0 14px 12px}
    .chaika-museum-body{padding:14px}.chaika-museum-body h3{margin:0 0 7px;font-size:18px;line-height:1.2}
    .chaika-museum-meta{color:#a0a0aa;font-size:12px;line-height:1.45}.chaika-museum-desc{color:#c3c3ca;font-size:12px;line-height:1.5;margin:10px 0 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .chaika-museum-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.chaika-museum-actions button{border-radius:13px;padding:11px 10px;font-weight:800;border:1px solid #34343d;background:#202026;color:#fff}.chaika-museum-actions .primary{background:#d8ff43;color:#111207;border-color:#d8ff43}
    .chaika-museum-empty{padding:28px 16px;text-align:center;color:#97979f;background:#17171b;border:1px solid #2b2b33;border-radius:18px;line-height:1.5}
  `;
  document.head.appendChild(style);

  const main = document.querySelector('main');
  const nav = document.querySelector('.bottom-nav');
  if (!main || !nav || document.getElementById('museumsView')) return;

  const view = document.createElement('section');
  view.id = 'museumsView';
  view.className = 'view scroll-view';
  view.innerHTML = `<div class="chaika-museum-head"><h2>Музеи</h2><p>Актуальные выставки и экспозиции Санкт-Петербурга. Афиша обновляется автоматически.</p></div><div id="chaikaMuseumList" class="chaika-museum-list"></div>`;
  main.appendChild(view);

  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.type = 'button';
  btn.dataset.view = 'museumsView';
  btn.setAttribute('aria-label','Музеи');
  btn.innerHTML = `${typeof svgIcon==='function' ? svgIcon('i-art') : '<span>◫</span>'}<span>Музеи</span>`;
  const concertsBtn = nav.querySelector('[data-view="concertsView"]');
  if (concertsBtn?.nextSibling) nav.insertBefore(btn, concertsBtn.nextSibling); else nav.appendChild(btn);
  nav.classList.add('chaika-six-nav');

  function museumRows(){
    return (state.events || [])
      .filter(e => e.category === 'museum')
      .sort((a,b) => parseEventDate(a) - parseEventDate(b));
  }

  function museumDate(e){
    const start = parseEventDate(e);
    const now = new Date();
    const sameDay = start.toDateString() === now.toDateString();
    const label = sameDay ? 'Сегодня' : start.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
    const until = e.expiresAt ? new Date(e.expiresAt) : null;
    if (until && until > now && until.getTime() - start.getTime() > 12*60*60*1000) {
      return `До ${until.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}`;
    }
    return `${label}, ${e.time || ''}`.replace(/,\s*$/,'');
  }

  function renderMuseums(){
    const list = document.getElementById('chaikaMuseumList');
    if (!list) return;
    const rows = museumRows();
    if (!rows.length) {
      list.innerHTML = '<div class="chaika-museum-empty">Пока нет загруженных музейных выставок. Афиша обновляется автоматически каждый час.</div>';
      return;
    }
    list.innerHTML = rows.map(e => {
      const image = e.imageData ? `<img src="${escapeHtml(e.imageData)}" alt="Афиша: ${escapeHtml(e.title)}" loading="lazy">` : '<div class="chaika-museum-image-fallback">◫</div>';
      return `<article class="chaika-museum-card">
        <div class="chaika-museum-image">${image}<span class="badge">ВЫСТАВКА</span></div>
        <div class="chaika-museum-body">
          <h3>${escapeHtml(e.title)}</h3>
          <div class="chaika-museum-meta">${museumDate(e)} · ${e.price ? e.price+' ₽' : 'Цена на странице'}<br>${escapeHtml(e.venue || 'Санкт-Петербург')}</div>
          ${e.description ? `<p class="chaika-museum-desc">${escapeHtml(e.description)}</p>` : ''}
          <div class="chaika-museum-actions">
            <button type="button" data-museum-map="${e.id}">На карте</button>
            <button type="button" class="primary" data-museum-open="${e.id}">${e.ticketUrl ? 'Подробнее ↗' : 'Открыть'}</button>
          </div>
        </div>
      </article>`;
    }).join('');
    list.querySelectorAll('[data-museum-map]').forEach(b => b.onclick = () => {
      const e = state.events.find(x => x.id === b.dataset.museumMap); if (!e) return;
      switchView('mapView'); setTimeout(() => { map.setView([e.lat,e.lng],14); showEvent(e.id); }, 80);
    });
    list.querySelectorAll('[data-museum-open]').forEach(b => b.onclick = () => {
      const e = state.events.find(x => x.id === b.dataset.museumOpen); if (!e) return;
      if (e.ticketUrl) { if (tg?.openLink) tg.openLink(e.ticketUrl); else window.open(e.ticketUrl,'_blank'); }
      else { switchView('mapView'); setTimeout(() => showEvent(e.id),80); }
    });
  }

  btn.addEventListener('click', () => { switchView('museumsView'); renderMuseums(); });

  const originalLoadEvents = typeof chaikaLoadEvents === 'function' ? chaikaLoadEvents : null;
  if (originalLoadEvents) {
    chaikaLoadEvents = async function(...args){ const result = await originalLoadEvents(...args); if (document.getElementById('museumsView')?.classList.contains('active-view')) renderMuseums(); return result; };
  }

  window.chaikaRenderMuseums = renderMuseums;
})();

/* CHAIKA map creator filter: people vs organizations (rev24). */
(() => {
  const STORAGE_KEY = 'chaika_map_creator_type_v1';
  const PEOPLE = 'people';
  const ORGANIZATIONS = 'organizations';
  const savedMode = localStorage.getItem(STORAGE_KEY);

  state.mapCreatorType = savedMode === ORGANIZATIONS ? ORGANIZATIONS : PEOPLE;

  function creatorType(event) {
    return typeof event?.source === 'string' && event.source.trim()
      ? ORGANIZATIONS
      : PEOPLE;
  }

  window.chaikaEventCreatorType = creatorType;
  window.chaikaFilterMapEvents = events => events.filter(
    event => creatorType(event) === state.mapCreatorType
  );

  const mapView = document.getElementById('mapView');
  if (!mapView || document.getElementById('chaikaMapCreatorToggle')) return;

  const toggle = document.createElement('div');
  toggle.id = 'chaikaMapCreatorToggle';
  toggle.className = 'chaika-map-creator-toggle';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Кто создал событие');
  toggle.innerHTML = `
    <button type="button" data-creator-type="${PEOPLE}">Люди</button>
    <button type="button" data-creator-type="${ORGANIZATIONS}">Организации</button>
  `;
  mapView.appendChild(toggle);

  const style = document.createElement('style');
  style.id = 'chaikaMapCreatorToggleStyles';
  style.textContent = `
    #mapView{position:relative}
    .chaika-map-creator-toggle{
      position:absolute;z-index:850;top:10px;left:10px;
      display:flex;align-items:center;gap:2px;padding:3px;
      border:1px solid rgba(255,255,255,.14);border-radius:13px;
      background:rgba(13,13,17,.92);box-shadow:0 5px 18px rgba(0,0,0,.24);
      -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)
    }
    .chaika-map-creator-toggle button{
      height:30px;padding:0 9px;border:0;border-radius:10px;
      background:transparent;color:#b8b8c1;
      font:700 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      letter-spacing:-.1px;white-space:nowrap;cursor:pointer;
      -webkit-tap-highlight-color:transparent;transition:background .16s,color .16s,transform .12s
    }
    .chaika-map-creator-toggle button[aria-pressed="true"]{
      background:var(--accent,#c9ff32);color:var(--accentText,#101106)
    }
    .chaika-map-creator-toggle button:active{transform:scale(.96)}
    @media (max-width:360px){
      .chaika-map-creator-toggle{left:8px;top:8px}
      .chaika-map-creator-toggle button{height:29px;padding:0 8px;font-size:10.5px}
    }
  `;
  document.head.appendChild(style);

  const buttons = [...toggle.querySelectorAll('[data-creator-type]')];

  function syncToggle() {
    buttons.forEach(button => {
      const active = button.dataset.creatorType === state.mapCreatorType;
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function selectCreatorType(nextMode) {
    if (nextMode !== PEOPLE && nextMode !== ORGANIZATIONS) return;
    if (nextMode === state.mapCreatorType) return;
    state.mapCreatorType = nextMode;
    localStorage.setItem(STORAGE_KEY, nextMode);
    syncToggle();
    closeEventSheet?.();
    renderMap();
    tg?.HapticFeedback?.selectionChanged?.();
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => selectCreatorType(button.dataset.creatorType));
  });

  window.chaikaSetMapCreatorType = selectCreatorType;
  syncToggle();
  renderMap();
})();


/* CHAIKA readable category picker + event photo thumbnails (rev25). */
(() => {
  const labelsRev25 = {
    guitar: 'Джем',
    music: 'Концерт',
    mic: 'Микрофон',
    drink: 'Бар',
    chess: 'Шахматы',
    chat: 'Общение',
    coffee: 'Кофе',
    game: 'Игры',
    art: 'Творчество',
    walk: 'Прогулка',
    sport: 'Спорт',
    dog: 'С собакой',
    study: 'Учёба',
    dating: 'Знакомства',
    party: 'Вечеринка',
    other: 'Другое'
  };

  iconCategories.forEach(category => {
    const label = labelsRev25[category[0]];
    if (!label) return;
    category[1] = label;
    if (categoryMap[category[0]]) categoryMap[category[0]].label = label;
  });

  const styleRev25 = document.createElement('style');
  styleRev25.id = 'chaikaEventVisualsRev25';
  styleRev25.textContent = `
    .icon-picker{
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:8px!important;
    }
    .icon-choice{
      aspect-ratio:auto!important;
      min-width:0!important;
      min-height:72px!important;
      padding:8px 4px 7px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
    }
    .icon-choice svg{width:25px!important;height:25px!important;flex:none}
    .icon-choice span{
      position:static!important;
      display:block!important;
      transform:none!important;
      max-width:100%!important;
      color:currentColor!important;
      font-size:9.5px!important;
      font-weight:750!important;
      line-height:1.08!important;
      text-align:center!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
    }
    .icon-choice.active{box-shadow:0 0 0 2px var(--cat-color) inset!important}
    .chaika-event-visual{overflow:hidden!important;position:relative!important;padding:0!important}
    .chaika-event-visual.has-photo{background:#202126!important;border-color:#34363d!important;color:transparent!important}
    .chaika-event-visual>img{
      display:block!important;
      width:100%!important;
      height:100%!important;
      object-fit:cover!important;
      object-position:center!important;
      pointer-events:none!important;
    }
    .chaika-group-event{
      grid-template-columns:52px minmax(0,1fr) auto!important;
      gap:11px!important;
    }
    .chaika-group-event .event-type-icon{
      width:52px!important;
      height:52px!important;
      border-radius:13px!important;
    }
    .feed-card .activity-icon{border-radius:14px!important}
    @media (max-width:340px){
      .icon-picker{gap:6px!important}
      .icon-choice{min-height:68px!important;padding-left:2px!important;padding-right:2px!important}
      .icon-choice span{font-size:8.8px!important}
    }
  `;
  document.head.appendChild(styleRev25);

  function hasEventPhotoRev25(event) {
    const src = String(event?.imageData || '').trim();
    return /^(https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i.test(src);
  }

  function showEventIconRev25(box, event) {
    if (!box) return;
    const category = categoryMap[event?.category] || categoryMap.other;
    box.classList.remove('has-photo');
    box.innerHTML = svgIcon(category.icon);
  }

  function decorateEventVisualRev25(box, event) {
    if (!box || !event) return;
    box.classList.add('chaika-event-visual');
    if (!hasEventPhotoRev25(event)) {
      showEventIconRev25(box, event);
      return;
    }

    const src = String(event.imageData).trim();
    box.classList.add('has-photo');
    box.innerHTML = `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
    box.querySelector('img')?.addEventListener('error', () => showEventIconRev25(box, event), { once:true });
  }

  function decorateFeedRev25() {
    els.feed?.querySelectorAll('.feed-card').forEach(card => {
      const id = card.querySelector('[data-map]')?.dataset.map;
      const event = state.events.find(item => String(item.id) === String(id));
      decorateEventVisualRev25(card.querySelector('.activity-icon'), event);
    });
  }

  const baseShowEventRev25 = showEvent;
  showEvent = function(id) {
    baseShowEventRev25(id);
    const event = state.events.find(item => String(item.id) === String(id));
    decorateEventVisualRev25(els.sheet?.querySelector('.sheet-row > .event-type-icon'), event);
  };

  const baseRenderFeedRev25 = renderFeed;
  renderFeed = function() {
    baseRenderFeedRev25();
    decorateFeedRev25();
  };

  if (typeof chaikaShowEventGroup === 'function') {
    const baseShowEventGroupRev25 = chaikaShowEventGroup;
    chaikaShowEventGroup = function(group) {
      baseShowEventGroupRev25(group);
      if (!group || group.length < 2) return;
      els.sheet?.querySelectorAll('[data-group-event]').forEach(button => {
        const event = group.find(item => String(item.id) === String(button.dataset.groupEvent));
        decorateEventVisualRev25(button.querySelector('.event-type-icon'), event);
      });
    };
  }

  window.chaikaHasEventPhoto = hasEventPhotoRev25;
  window.chaikaDecorateEventVisual = decorateEventVisualRev25;

  renderCategoryUI();
  renderFeed();
})();

