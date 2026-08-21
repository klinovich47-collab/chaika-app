/* CHAIKA rev42 — restore profile access without bringing back old navigation. */
(() => {
  const style = document.createElement('style');
  style.id = 'chaikaProfileReturnRev42';
  style.textContent = `
    body.chaika-user-map-pivot #profileView.chaika-profile-active{
      display:block!important;
      position:fixed!important;
      inset:0!important;
      z-index:2600!important;
      overflow-y:auto!important;
      -webkit-overflow-scrolling:touch!important;
      overscroll-behavior:contain!important;
      background:#0b0b0d!important;
      padding-top:max(18px,env(safe-area-inset-top,0px))!important;
      padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))!important;
      box-sizing:border-box!important;
    }
    .chaika-profile-button{
      width:44px;height:44px;min-width:44px;border-radius:50%;
      border:1px solid rgba(255,255,255,.13);background:#15151a;color:#fff;
      display:flex;align-items:center;justify-content:center;padding:0;
      box-shadow:0 5px 16px rgba(0,0,0,.22);
    }
    .chaika-profile-button svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8}
    .chaika-profile-back{
      position:sticky;top:0;z-index:20;margin:8px 14px 10px;
      min-height:44px;padding:0 14px;border:1px solid rgba(255,255,255,.12);
      border-radius:14px;background:rgba(20,20,24,.92);color:#fff;
      backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      display:inline-flex;align-items:center;gap:8px;font:650 14px/1 system-ui,-apple-system,sans-serif;
    }
    .chaika-profile-back svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2}
    body.chaika-profile-open .chaika-pivot-cta{display:none!important}
  `;
  document.head.appendChild(style);

  function ensureProfileButton(){
    if(document.getElementById('chaikaProfileButton')) return;
    const actions = document.querySelector('.top-actions') || document.querySelector('.topbar');
    if(!actions) return;
    const btn=document.createElement('button');
    btn.id='chaikaProfileButton';
    btn.className='chaika-profile-button';
    btn.type='button';
    btn.setAttribute('aria-label','Профиль');
    btn.innerHTML='<svg viewBox="0 0 24 24"><use href="#i-user"/></svg>';
    btn.addEventListener('click',openProfile);
    actions.appendChild(btn);
  }

  function ensureBack(profile){
    if(profile.querySelector('#chaikaProfileBack')) return;
    const back=document.createElement('button');
    back.id='chaikaProfileBack';
    back.className='chaika-profile-back';
    back.type='button';
    back.innerHTML='<svg viewBox="0 0 24 24"><use href="#i-back"/></svg><span>Назад на карту</span>';
    back.addEventListener('click',closeProfile);
    profile.insertBefore(back,profile.firstChild);
  }

  function openProfile(){
    const profile=document.getElementById('profileView');
    const mapView=document.getElementById('mapView');
    if(!profile) return;
    try{ if(typeof updateProfile==='function') updateProfile(); }catch(_){}
    ensureBack(profile);
    document.body.classList.add('chaika-profile-open');
    mapView?.classList.remove('active-view');
    profile.classList.add('active-view','chaika-profile-active');
    document.getElementById('chaikaPivotCta')?.classList.add('hidden');
    profile.scrollTop=0;
  }

  function closeProfile(){
    const profile=document.getElementById('profileView');
    const mapView=document.getElementById('mapView');
    profile?.classList.remove('active-view','chaika-profile-active');
    mapView?.classList.add('active-view');
    document.body.classList.remove('chaika-profile-open');
    document.getElementById('chaikaPivotCta')?.classList.remove('hidden');
    setTimeout(()=>{try{map?.invalidateSize?.()}catch(_){}},80);
  }

  ensureProfileButton();
  setTimeout(ensureProfileButton,200);
  setTimeout(ensureProfileButton,900);
  window.chaikaProfile={open:openProfile,close:closeProfile};
})();
