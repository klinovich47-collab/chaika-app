/* CHAIKA rev37 — near-zero-friction event creation. */
(() => {
  const form = document.getElementById('eventForm');
  if (!form || document.getElementById('chaikaQuickCreate')) return;

  const presets = [
    { key:'chat', icon:'i-chat', title:'Ищу компанию', description:'Ищу компанию рядом. Присоединяйтесь, если вы недалеко.' },
    { key:'walk', icon:'i-walk', title:'Хочу погулять', description:'Хочу прогуляться и познакомиться. Присоединяйтесь, если вы рядом.' },
    { key:'coffee', icon:'i-coffee', title:'Пью кофе, присоединяйтесь', description:'Сижу с кофе и буду рад компании. Можно просто подойти и познакомиться.' },
    { key:'guitar', icon:'i-guitar', title:'Играю на гитаре', description:'Играю на гитаре рядом. Можно присоединиться, послушать или прийти со своим инструментом.' },
    { key:'drink', icon:'i-drink', title:'Сижу в баре, кто рядом?', description:'Сижу в баре и буду рад компании. Если вы рядом — присоединяйтесь.' },
    { key:'sport', icon:'i-sport', title:'Иду заниматься спортом', description:'Иду заниматься спортом и ищу компанию. Присоединяйтесь, если вы рядом.' },
    { key:'party', icon:'i-party', title:'Собираемся потусить', description:'Собираемся потусить небольшой компанией. Можно присоединиться, если вы рядом.' },
    { key:'other', icon:'i-other', title:'Своё событие', description:'Создаю событие рядом. Присоединяйтесь, если вам интересно.' }
  ];

  let selected = presets[0];
  let locating = false;

  function injectStyles(){
    const style = document.createElement('style');
    style.id = 'chaikaQuickCreateStyles';
    style.textContent = `
      body.chaika-user-map-pivot #createView .section-head { margin-bottom:8px; }
      body.chaika-user-map-pivot #createView .section-head .muted { display:none !important; }
      #eventForm > label,
      #eventForm > .two-col,
      #eventForm > .helper,
      #eventForm > div:not(#chaikaQuickCreate),
      #eventForm > .form-note,
      #eventForm > #addTelegramLinkBtn { display:none !important; }
      #eventForm { padding:0 16px 24px !important; background:transparent !important; border:0 !important; box-shadow:none !important; }
      #chaikaQuickCreate { display:block !important; }
      .chaika-qc-intro { margin:4px 0 18px; }
      .chaika-qc-intro h3 { margin:0 0 5px; font-size:24px; line-height:1.05; }
      .chaika-qc-intro p { margin:0; opacity:.62; font-size:14px; line-height:1.35; }
      .chaika-qc-label { display:block; margin:0 0 9px; font-size:12px; font-weight:800; letter-spacing:.04em; opacity:.58; text-transform:uppercase; }
      .chaika-qc-presets { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin-bottom:18px; }
      .chaika-qc-preset { min-height:70px; border:1px solid rgba(255,255,255,.10); border-radius:18px; background:rgba(255,255,255,.045); color:inherit; padding:12px; display:flex; align-items:center; gap:10px; text-align:left; font:700 14px/1.15 system-ui,-apple-system,sans-serif; }
      .chaika-qc-preset.active { background:#fff; color:#0b0b0d; border-color:#fff; }
      .chaika-qc-preset svg { flex:0 0 auto; width:24px; height:24px; fill:none; stroke:currentColor; stroke-width:1.8; }
      .chaika-qc-custom { display:none; margin:-7px 0 17px; }
      .chaika-qc-custom.visible { display:block; }
      .chaika-qc-custom input { width:100%; min-height:50px; border-radius:15px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:inherit; padding:0 14px; font-size:16px; }
      .chaika-qc-row { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:18px; }
      .chaika-qc-duration, .chaika-qc-location { min-height:62px; border-radius:17px; border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.045); color:inherit; padding:10px 12px; text-align:left; }
      .chaika-qc-duration small, .chaika-qc-location small { display:block; font-size:10px; font-weight:800; opacity:.48; margin-bottom:4px; text-transform:uppercase; letter-spacing:.05em; }
      .chaika-qc-duration strong, .chaika-qc-location strong { display:block; font-size:14px; line-height:1.15; }
      .chaika-qc-location.ready { border-color:rgba(95,220,135,.45); }
      .chaika-qc-location.error { border-color:rgba(255,190,90,.45); }
      .chaika-qc-note { margin:-8px 0 16px; opacity:.55; font-size:12px; line-height:1.35; }
      #eventForm > button[type="submit"] { display:block !important; position:sticky; bottom:calc(10px + env(safe-area-inset-bottom)); z-index:5; width:100%; min-height:56px; border-radius:18px; font-size:16px; font-weight:800; box-shadow:0 12px 32px rgba(0,0,0,.26); }
      #eventForm > button[type="submit"]:disabled { opacity:.45; }
      @media (max-width:380px){ .chaika-qc-presets{grid-template-columns:1fr;} }
    `;
    document.head.appendChild(style);
  }

  function input(name){ return form.elements.namedItem(name); }
  function setValue(name, value){ const el=input(name); if(el) el.value=String(value ?? ''); }
  function svg(id){ return `<svg viewBox="0 0 24 24"><use href="#${id}"/></svg>`; }

  function refreshAutoCopy(){
    const custom = document.getElementById('chaikaQcCustomInput');
    let title = selected.title;
    if (selected.key === 'other') title = String(custom?.value || '').trim() || 'Ищу компанию';
    setValue('title', title.slice(0,70));
    setValue('category', selected.key === 'other' ? 'other' : selected.key);
    const generated = selected.key === 'other'
      ? `${title}. Присоединяйтесь, если вы рядом.`
      : selected.description;
    setValue('description', generated.slice(0,500));
    setValue('ticketUrl','');
  }

  function refreshStartTime(){
    setValue('time', typeof chaikaDefaultPeopleTime === 'function' ? chaikaDefaultPeopleTime() : new Date(Date.now()+5*60000).toTimeString().slice(0,5));
  }

  function setDuration(minutes){
    setValue('duration', minutes);
    const label = document.getElementById('chaikaQcDurationValue');
    if(label) label.textContent = minutes===30?'30 минут':minutes===60?'1 час':minutes===120?'2 часа':'4 часа';
  }

  function hasLocation(){
    const lat=Number(String(input('lat')?.value||'').trim()), lng=Number(String(input('lng')?.value||'').trim());
    return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180&&String(input('lat')?.value||'').trim()!==''&&String(input('lng')?.value||'').trim()!=='';
  }

  function updateLocationUi(mode){
    const btn=document.getElementById('chaikaQcLocation');
    const value=document.getElementById('chaikaQcLocationValue');
    const submit=form.querySelector('button[type="submit"]');
    if(!btn||!value||!submit) return;
    btn.classList.remove('ready','error');
    if(hasLocation()){
      btn.classList.add('ready'); value.textContent='Точка выбрана'; submit.disabled=false; return;
    }
    if(mode==='loading') { value.textContent='Определяем…'; submit.disabled=true; return; }
    btn.classList.add('error'); value.textContent='Нажми, чтобы выбрать'; submit.disabled=true;
  }

  function setCoords(lat,lng){
    setValue('lat', Number(lat).toFixed(6));
    setValue('lng', Number(lng).toFixed(6));
    state.userLocation=[Number(lat),Number(lng)];
    updateLocationUi('ready');
  }

  function ensureLocation(){
    if(hasLocation()){ updateLocationUi('ready'); return; }
    if(Array.isArray(state.userLocation) && state.userLocation.length===2){ setCoords(state.userLocation[0],state.userLocation[1]); return; }
    if(locating) return;
    locating=true; updateLocationUi('loading');
    if(!navigator.geolocation){ locating=false; updateLocationUi('error'); return; }
    navigator.geolocation.getCurrentPosition(
      pos=>{ locating=false; setCoords(pos.coords.latitude,pos.coords.longitude); try{ map?.setView?.([pos.coords.latitude,pos.coords.longitude],15); }catch{} },
      ()=>{ locating=false; updateLocationUi('error'); },
      {enableHighAccuracy:false,timeout:6500,maximumAge:120000}
    );
  }

  function selectPreset(key){
    selected = presets.find(p=>p.key===key) || presets[0];
    document.querySelectorAll('.chaika-qc-preset').forEach(btn=>btn.classList.toggle('active',btn.dataset.key===selected.key));
    document.getElementById('chaikaQcCustom')?.classList.toggle('visible',selected.key==='other');
    refreshAutoCopy();
    if(selected.key==='other') setTimeout(()=>document.getElementById('chaikaQcCustomInput')?.focus(),50);
    tg?.HapticFeedback?.selectionChanged?.();
  }

  function install(){
    injectStyles();
    const quick=document.createElement('section');
    quick.id='chaikaQuickCreate';
    quick.innerHTML=`
      <div class="chaika-qc-intro"><h3>Что ты делаешь?</h3><p>Выбери один вариант. Остальное ЧАЙКА заполнит сама.</p></div>
      <span class="chaika-qc-label">Событие</span>
      <div class="chaika-qc-presets">${presets.map((p,i)=>`<button type="button" class="chaika-qc-preset ${i===0?'active':''}" data-key="${p.key}">${svg(p.icon)}<span>${p.title}</span></button>`).join('')}</div>
      <div id="chaikaQcCustom" class="chaika-qc-custom"><input id="chaikaQcCustomInput" maxlength="70" placeholder="Например: кормлю уток в парке"></div>
      <div class="chaika-qc-row">
        <button id="chaikaQcDuration" class="chaika-qc-duration" type="button"><small>Будет видно</small><strong id="chaikaQcDurationValue">1 час</strong></button>
        <button id="chaikaQcLocation" class="chaika-qc-location" type="button"><small>Где</small><strong id="chaikaQcLocationValue">Определяем…</strong></button>
      </div>
      <p class="chaika-qc-note">Время начала, описание и точное служебное описание создаются автоматически. При желании точку можно поменять.</p>`;
    form.insertBefore(quick, form.firstChild);

    document.querySelectorAll('.chaika-qc-preset').forEach(btn=>btn.addEventListener('click',()=>selectPreset(btn.dataset.key)));
    document.getElementById('chaikaQcCustomInput')?.addEventListener('input',refreshAutoCopy);

    const durations=[30,60,120,240]; let durationIndex=1;
    document.getElementById('chaikaQcDuration')?.addEventListener('click',()=>{ durationIndex=(durationIndex+1)%durations.length; setDuration(durations[durationIndex]); tg?.HapticFeedback?.selectionChanged?.(); });
    document.getElementById('chaikaQcLocation')?.addEventListener('click',()=>{
      if(!hasLocation()){ const legacy=document.getElementById('chaikaPickLocationBtn'); if(legacy){ legacy.click(); return; } ensureLocation(); return; }
      const legacy=document.getElementById('chaikaPickLocationBtn'); if(legacy) legacy.click();
    });

    refreshAutoCopy(); refreshStartTime(); setDuration(60); updateLocationUi('loading');
    const submit=form.querySelector('button[type="submit"]');
    if(submit){ submit.textContent='Опубликовать рядом'; submit.disabled=true; submit.addEventListener('click',()=>{ refreshStartTime(); refreshAutoCopy(); if(!hasLocation()) ensureLocation(); },true); }

    const oldHead=document.querySelector('#createView .section-head h2');
    if(oldHead) oldHead.textContent='Создать за пару секунд';
  }

  install();

  document.addEventListener('click',event=>{
    if(event.target.closest('#chaikaPivotCta, .chaika-pivot-primary, [data-view="createView"]')) setTimeout(()=>{ refreshStartTime(); refreshAutoCopy(); ensureLocation(); },60);
  },true);

  // Keep location state in sync with the existing manual map picker.
  setInterval(()=>{
    if(document.getElementById('createView')?.classList.contains('active-view')) updateLocationUi(hasLocation()?'ready':(locating?'loading':'error'));
  },450);
})();
