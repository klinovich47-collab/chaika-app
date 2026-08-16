/* CHAIKA frontend enhancements: map placement, grouped markers, ownership/admin management. */
const chaikaManagement={isAdmin:false,isModerator:false,canModerate:false,myEvents:[],moderation:[],loading:false,error:null,lastLoadedAt:0};
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
  admin.innerHTML='<h3>Модерация <span id="chaikaModerationRoleBadge" class="chaika-admin-badge">MODERATOR</span></h3><p class="muted">Открыть, одобрить, отклонить или удалить событие.</p><div id="chaikaAdminEventsList" class="chaika-manage-list"></div>';
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
  adminSection?.classList.toggle('hidden',!chaikaManagement.canModerate);
  const roleBadge=$('chaikaModerationRoleBadge');
  if(roleBadge)roleBadge.textContent=chaikaManagement.isAdmin?'ADMIN':'MODERATOR';
  if(admin&&chaikaManagement.canModerate){
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
    chaikaManagement.isModerator=Boolean(data.is_moderator);
    chaikaManagement.canModerate=Boolean(data.can_moderate||data.is_admin||data.is_moderator);
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
  }catch(error){console.error('CHAIKA moderate event',error);toast(error.message==='forbidden'?'Нужны права модератора':'Не удалось изменить статус')}
}

const chaikaBaseUpdateProfile=updateProfile;
updateProfile=function(){
  chaikaBaseUpdateProfile();
  const username=$('profileUsername'),created=$('createdStat');
  if(chaikaAuth.status==='ready'&&chaikaAuth.user){
    if(chaikaManagement.isAdmin&&!username.textContent.includes('админ'))username.textContent+=' · админ';
    else if(chaikaManagement.isModerator&&!username.textContent.includes('модератор'))username.textContent+=' · модератор';
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

const chaikaLatinToCyr={a:'а',b:'в',c:'с',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'й',k:'к',l:'л',m:'м',n:'н',o:'о',p:'р',q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'ш',x:'х',y:'у',z:'з'};
const chaikaCyrToLatin={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
const chaikaGreekToCyr={α:'а',β:'в',ε:'е',ι:'и',κ:'к',ν:'н',ο:'о',ρ:'р',σ:'с',ς:'с',τ:'т',υ:'у',χ:'х'};
const chaikaGreekToLatin={α:'a',β:'b',ε:'e',ι:'i',κ:'k',ν:'n',ο:'o',ρ:'r',σ:'s',ς:'s',τ:'t',υ:'u',χ:'h'};
const chaikaSymbolToCyr={'@':'а','₽':'р','0':'о','1':'и','3':'з','4':'ч','6':'б','8':'в','$':'с','€':'е'};
const chaikaSymbolToLatin={'@':'a','₽':'r','0':'o','1':'i','3':'e','4':'a','6':'b','8':'b','$':'s','€':'e'};
function chaikaModerationForms(value){
  const src=String(value||'').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\u200B-\u200D\uFEFF]/g,'');
  const split=v=>{const spaced=v.replace(/[^a-zа-я0-9]+/giu,' ').replace(/\s+/g,' ').trim();return {spaced,compact:spaced.replace(/\s+/g,'')}};
  const cyr=split([...src].map(ch=>chaikaSymbolToCyr[ch]??chaikaLatinToCyr[ch]??chaikaGreekToCyr[ch]??ch).join(''));
  const latin=split([...src].map(ch=>chaikaSymbolToLatin[ch]??chaikaCyrToLatin[ch]??chaikaGreekToLatin[ch]??ch).join(''));
  return {cyrSpaced:cyr.spaced,cyrCompact:cyr.compact,latinSpaced:latin.spaced,latinCompact:latin.compact};
}
const chaikaSexualServiceTermsRu=['проститут','проституц','интимуслуг','сексуслуг','сексзаденьги','эскортуслуг','досугдевуш','девушканачас'];
const chaikaSexualServiceTermsLat=['prostitut','intimuslug','sexuslug','sexservice','escortservice','dosugdevush'];
const chaikaDangerBlockPatterns=[/наркот|закладк|героин|кокаин|амфетамин|мефедрон|метамфетамин/i,/оружи|боеприпас|взрывчат|бомб[ау]|террор|экстрем/i,/массов\S*\s+(убий|расстрел|резн)|массовое\s+убийство/i,/убийств|убить\s+(люд|человек|кого|всех)|расстрел|резн[яи]|пытк|казн[ьи]|линч/i,/жертвопринош|человеческ\S*\s+жертв|ритуальн\S*\s+убий/i,/изнасил|сексуальн\S*\s+насили/i,/самоубий|суицид|прыгн\S*\s+с\s+(крыши|моста)|вскрыть\s+вен/i,/убить\s+(кот|кош|собак|живот)|мучить\s+(кот|кош|собак|живот)|издев\S*\s+над\s+(кот|кош|собак|живот)|живодер/i,/купить\s+паспорт|продам\s+паспорт/i];
const chaikaReviewPatterns=[/\b(хуй|хуя|хуе|пизд|ебан|ебат|бляд)\S*/i,/без\s+правил|секретн\S*\s+адрес|только\s+налич|100%\s+заработ|легк\S*\s+деньг/i,/по\s+приколу|рофл|прикол\S*\s+событ|поюзат\S*\s+(кот|кош|живот)/i,/драка|подраться|мордобой|охот\S*\s+на\s+люд/i,/кровав\S*\s+(вечерин|ритуал)|сатанин\S*\s+ритуал/i];
moderate=function(text){
  const f=chaikaModerationForms(text),values=[f.cyrSpaced,f.latinSpaced];
  const sexualServices=chaikaSexualServiceTermsRu.some(term=>f.cyrCompact.includes(term))||chaikaSexualServiceTermsLat.some(term=>f.latinCompact.includes(term));
  if(sexualServices||chaikaDangerBlockPatterns.some(r=>values.some(value=>r.test(value))))return {status:'block',title:'Публикация отклонена',text:'Обнаружено опасное, насильственное или незаконное содержание. Такое событие нельзя публиковать.'};
  if(chaikaReviewPatterns.some(r=>values.some(value=>r.test(value))))return {status:'review',title:'Нужна ручная проверка',text:'Формулировка выглядит сомнительно или провокационно. Событие будет проверено модератором.'};
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
