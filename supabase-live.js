/* CHAIKA Supabase live integration — appended to app.js at build time. */
const CHAIKA_DB_URL='https://vxebzzwquvgzpbktjigp.supabase.co';
const CHAIKA_DB_KEY='sb_publishable_xkcPYIVEkGc2QZ0AsCU1qA_g3BywKNA';
const CHAIKA_CLIENT_KEY='chaika_client_key_v1';
const CHAIKA_CREATED_KEY='chaika_created_ids';

function chaikaClientKey(){
  let key=localStorage.getItem(CHAIKA_CLIENT_KEY);
  if(!key){
    key=window.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
    localStorage.setItem(CHAIKA_CLIENT_KEY,key);
  }
  return key;
}
const chaikaClientId=chaikaClientKey();
state.createdIds=new Set(JSON.parse(localStorage.getItem(CHAIKA_CREATED_KEY)||'[]'));

async function chaikaRequest(path,{method='GET',body=null}={}){
  const response=await fetch(`${CHAIKA_DB_URL}/rest/v1/${path}`,{
    method,
    headers:{'apikey':CHAIKA_DB_KEY,'Content-Type':'application/json','Accept':'application/json'},
    body:body===null?null:JSON.stringify(body)
  });
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const error=new Error(typeof data==='string'?data:(data?.message||`HTTP ${response.status}`));error.status=response.status;error.data=data;throw error}
  return data;
}
function chaikaDateParts(value){const d=new Date(value),pad=n=>String(n).padStart(2,'0');return {date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`}}
function chaikaEvent(row){const start=chaikaDateParts(row.starts_at),mine=state.going.has(row.id);return {id:row.id,title:row.title,category:row.category,date:start.date,time:start.time,price:Number(row.price_rub||0),venue:row.venue,lat:Number(row.lat),lng:Number(row.lng),ageLimit:Number(row.age_limit||0),promoted:Boolean(row.promoted),description:row.description||'',ticketUrl:row.ticket_url||'',imageData:row.image_url||'',going:Math.max(0,Number(row.going_count||0)-(mine?1:0)),owner:state.createdIds.has(row.id),type:row.event_type||'planned',expiresAt:row.expires_at?new Date(row.expires_at).getTime():null}}
function chaikaConcert(row){return {id:row.id,artist:row.title||row.artist,date:new Date(row.starts_at),venue:row.venue,price:row.price_label||'',genre:row.genre||'other',url:row.ticket_url}}

async function chaikaLoadEvents(showError=false){
  try{
    const from=new Date(Date.now()-6*60*60*1000).toISOString(),to=new Date(Date.now()+31*DAY).toISOString();
    const q=new URLSearchParams();q.set('select','id,title,category,event_type,starts_at,expires_at,price_rub,venue,lat,lng,age_limit,description,ticket_url,image_url,promoted,going_count');q.append('starts_at',`gte.${from}`);q.append('starts_at',`lte.${to}`);q.set('order','promoted.desc,starts_at.asc');
    const rows=await chaikaRequest(`events?${q}`);state.events=(rows||[]).map(chaikaEvent);renderMap();updateProfile();return true;
  }catch(error){console.error('CHAIKA Supabase events',error);if(showError)toast('Не удалось обновить события');return false}
}
async function chaikaLoadConcerts(){
  try{
    const q=new URLSearchParams();q.set('select','id,artist,title,starts_at,venue,genre,price_label,ticket_url');q.append('starts_at',`gte.${new Date().toISOString()}`);q.append('starts_at',`lte.${new Date(Date.now()+366*DAY).toISOString()}`);q.set('order','starts_at.asc');
    const rows=await chaikaRequest(`concerts?${q}`);if(rows?.length){concerts.splice(0,concerts.length,...rows.map(chaikaConcert));renderConcerts()}return true;
  }catch(error){console.error('CHAIKA Supabase concerts',error);return false}
}
async function chaikaSync(){await Promise.all([chaikaLoadEvents(false),chaikaLoadConcerts()])}

persist=function(){localStorage.setItem('tuda_going',JSON.stringify([...state.going]));localStorage.setItem(CHAIKA_CREATED_KEY,JSON.stringify([...state.createdIds]))};

toggleGoing=async function(id){
  const event=state.events.find(x=>x.id===id);if(!event)return;
  if(!/^[0-9a-f-]{36}$/i.test(id)){
    const was=state.going.has(id);was?state.going.delete(id):state.going.add(id);event.going=Math.max(0,Number(event.going||0)+(was?-1:1));persist();renderFeed();if(state.selectedId===id)showEvent(id);updateProfile();return;
  }
  try{
    const rows=await chaikaRequest('rpc/toggle_event_attendance',{method:'POST',body:{p_event_id:id,p_client_key:chaikaClientId}}),row=Array.isArray(rows)?rows[0]:rows;
    if(row?.going)state.going.add(id);else state.going.delete(id);
    event.going=Math.max(0,Number(row?.going_count||0)-(row?.going?1:0));persist();renderFeed();if(state.selectedId===id)showEvent(id);updateProfile();tg?.HapticFeedback?.impactOccurred('light');
  }catch(error){console.error('CHAIKA attendance',error);toast('Не удалось обновить «Пойду»')}
};

async function chaikaCreateEvent(e){
  e.preventDefault();e.stopImmediatePropagation();
  const data=Object.fromEntries(new FormData(els.form).entries());
  if(state.eventType==='planned'){
    const chosen=new Date(`${data.date}T12:00`),max=new Date(`${dateISO(30)}T23:59`);
    if(chosen<new Date(`${dateISO(0)}T00:00`)||chosen>max)return showModeration({status:'block',title:'Дата вне диапазона',text:'Пользовательские события можно создавать только на ближайшие 30 дней.'});
  }
  const mod=moderate(`${data.title} ${data.description||''}`);
  if(mod.status==='block'||mod.title==='Нужно исправить текст')return showModeration(mod);
  if(pendingPhotoData.length>1450000)return showModeration({status:'block',title:'Фото слишком тяжёлое',text:'Выбери фотографию поменьше. После сжатия она должна быть меньше примерно 1 МБ.'});
  const startsAt=state.eventType==='instant'?new Date():new Date(`${data.date}T${data.time||'20:00'}:00`),expiresAt=state.eventType==='instant'?new Date(Date.now()+Number(data.duration||60)*60*1000):null;
  const button=els.form.querySelector('button[type="submit"]'),oldText=button.textContent;button.disabled=true;button.textContent='Публикуем…';
  try{
    const rows=await chaikaRequest('rpc/create_event',{method:'POST',body:{p_title:data.title.trim(),p_category:data.category,p_event_type:state.eventType,p_starts_at:startsAt.toISOString(),p_expires_at:expiresAt?expiresAt.toISOString():null,p_price_rub:Number(data.price||0),p_venue:data.venue.trim(),p_lat:Number(data.lat),p_lng:Number(data.lng),p_age_limit:Number(data.ageLimit||0),p_description:(data.description||'').trim(),p_ticket_url:data.ticketUrl||'',p_image_url:pendingPhotoData||'',p_organizer_name:user.first_name||'Пользователь'}}),result=Array.isArray(rows)?rows[0]:rows;
    if(result?.id){state.createdIds.add(result.id);persist()}
    const finish=async()=>{els.form.reset();resetPhotoUI();els.form.date.min=dateISO(0);els.form.date.max=dateISO(30);els.form.date.value=dateISO(0);els.form.time.value='20:00';$('categoryInput').value='guitar';document.querySelectorAll('.icon-choice').forEach((x,i)=>x.classList.toggle('active',i===0));setEventType('planned');await chaikaLoadEvents(true);updateProfile()};
    if(result?.moderation_status==='review')return showModeration({status:'review',title:'Отправлено на модерацию',text:'Событие сохранено в общей базе и появится у всех после проверки.'},finish);
    showModeration({status:'ok',title:'Событие опубликовано',text:'Готово — событие сохранено в общей базе ЧАЙКИ и уже доступно другим пользователям.'},async()=>{await finish();switchView('mapView');const event=state.events.find(x=>x.id===result?.id);if(event)setTimeout(()=>{map.setView([event.lat,event.lng],14);showEvent(event.id)},100);tg?.HapticFeedback?.notificationOccurred('success')});
  }catch(error){console.error('CHAIKA create_event',error);const blocked=String(error.message||'').includes('event_blocked');showModeration({status:'block',title:blocked?'Публикация отклонена':'Не удалось создать событие',text:blocked?'Серверная модерация обнаружила запрещённое или опасное содержание.':'Проверь данные и попробуй ещё раз.'})
  }finally{button.disabled=false;button.textContent=oldText}
}
els.form.addEventListener('submit',chaikaCreateEvent,true);

$('resetBtn').onclick=()=>{localStorage.removeItem('tuda_events');localStorage.removeItem('tuda_going');localStorage.removeItem('tuda_refCount');localStorage.removeItem(CHAIKA_CREATED_KEY);localStorage.removeItem(CHAIKA_CLIENT_KEY);location.reload()};

chaikaSync();
