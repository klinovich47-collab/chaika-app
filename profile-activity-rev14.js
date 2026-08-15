/* CHAIKA profile activity, avatar upload and referrals (rev14). */
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
    input.id = 'chaikaAvatarInput'; input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.hidden = true;
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

  async function resizeImage(file){return await new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const max=1024,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.86));};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image_read_failed'))};img.src=url;});}

  async function uploadAvatar(file){
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){toast('Выбери JPG, PNG или WebP');return;}
    try{toast('Загружаю фото…');const dataUrl=await resizeImage(file);const data=await profileEdge('avatar',{dataUrl});if(profileState.data?.profile)profileState.data.profile.avatar_url=data.avatar_url;renderAvatar({avatar_url:data.avatar_url});toast('Фото профиля обновлено');}catch(e){console.error(e);toast('Не удалось загрузить фото');}
  }

  function shareReferral(){const uid=tgApp?.initDataUnsafe?.user?.id;if(!uid)return;const link=`https://t.me/chaika47bot?startapp=ref_${uid}`;const text='Залетай в ЧАЙКУ — события рядом на карте';const share=`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;tgApp?.openTelegramLink?.(share);}

  async function registerReferralFromStart(){const p=tgApp?.initDataUnsafe?.start_param||new URLSearchParams(location.search).get('tgWebAppStartParam')||'';const m=String(p).match(/^ref_(\d+)$/);if(!m||sessionStorage.getItem('chaika_ref_registered'))return;try{await profileEdge('register_referral',{inviterTelegramUserId:Number(m[1])});sessionStorage.setItem('chaika_ref_registered','1');}catch(e){console.warn('CHAIKA referral',e)}}

  const originalSwitchView = typeof switchView==='function'?switchView:null;
  if(originalSwitchView){switchView=function(id){const r=originalSwitchView(id);if(id==='profileView')setTimeout(()=>loadProfile(true),0);return r;};}
  registerReferralFromStart();
  if(!profileView.classList.contains('hidden'))loadProfile();
})();