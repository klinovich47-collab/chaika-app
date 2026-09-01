/* CHAIKA rev51 — one stable production basemap + reliable create-event entry prompt. */
(() => {
  const root = document.documentElement;
  const PROMPT_ID = 'chaikaEntryPromptRev51';
  root.dataset.chaikaRev = '51';

  function injectStyles() {
    if (document.getElementById('chaikaProductionStableRev51Styles')) return;
    const style = document.createElement('style');
    style.id = 'chaikaProductionStableRev51Styles';
    style.textContent = `
      body.chaika-user-map-pivot main{min-height:0!important;overflow:hidden!important}
      body.chaika-user-map-pivot #mapView.active-view{
        display:block!important;position:relative!important;width:100%!important;height:100%!important;
        min-height:0!important;overflow:hidden!important;
      }
      body.chaika-user-map-pivot #map{
        display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
        min-height:0!important;visibility:visible!important;opacity:1!important;background:#edf0e8!important;
      }
      body.chaika-user-map-pivot .leaflet-container{background:#edf0e8!important}
      #${PROMPT_ID}{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center}
      #${PROMPT_ID}.hidden{display:none!important}
      #${PROMPT_ID} .chaika-entry-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
      #${PROMPT_ID} .chaika-entry-card{position:relative;width:min(520px,calc(100% - 20px));margin:0 10px calc(10px + env(safe-area-inset-bottom,0px));padding:24px 20px 18px;border-radius:26px;background:#101014;color:#fff;border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 60px rgba(0,0,0,.45)}
      #${PROMPT_ID} .chaika-entry-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;opacity:.55;margin-bottom:9px}
      #${PROMPT_ID} h2{margin:0 0 9px;font-size:26px;line-height:1.05}
      #${PROMPT_ID} p{margin:0 0 20px;color:rgba(255,255,255,.72);font-size:15px;line-height:1.4}
      #${PROMPT_ID} .chaika-entry-examples{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 20px}
      #${PROMPT_ID} .chaika-entry-examples span{padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.08);font-size:12px}
      #${PROMPT_ID} button{width:100%;min-height:52px;border-radius:16px;font-weight:750;font-size:15px}
      #${PROMPT_ID} .chaika-entry-primary{border:0;background:#fff;color:#0b0b0d;margin-bottom:8px}
      #${PROMPT_ID} .chaika-entry-secondary{border:1px solid rgba(255,255,255,.13);background:transparent;color:#fff}
    `;
    document.head.appendChild(style);
  }

  function forceMapView() {
    document.body.classList.add('chaika-user-map-pivot');
    document.body.classList.remove('chaika-profile-open');
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
    document.getElementById('mapView')?.classList.add('active-view');
    document.getElementById('profileView')?.classList.remove('chaika-profile-active');
    document.getElementById('chaikaPivotCta')?.classList.remove('hidden');
  }

  function installStableTiles() {
    if (!window.L || typeof map === 'undefined') return;

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        try { map.removeLayer(layer); } catch (_) {}
      }
    });

    let fallbackInstalled = false;
    const primary = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
      updateWhenIdle: false,
      keepBuffer: 4,
      attribution: '© OpenStreetMap'
    });

    let tileErrors = 0;
    primary.on('tileerror', () => {
      tileErrors += 1;
      if (tileErrors < 6 || fallbackInstalled) return;
      fallbackInstalled = true;
      try { map.removeLayer(primary); } catch (_) {}
      const fallback = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        updateWhenIdle: false,
        keepBuffer: 4,
        attribution: 'Tiles © Esri'
      }).addTo(map);
      fallback.bringToBack?.();
      map.__chaikaStableTilesRev51 = fallback;
    });

    primary.addTo(map);
    primary.bringToBack?.();
    map.__chaikaStableTilesRev51 = primary;
  }

  function refreshMap() {
    if (typeof map === 'undefined') return;
    try { map.invalidateSize(false); } catch (_) {}
  }

  function openCreator() {
    document.getElementById(PROMPT_ID)?.classList.add('hidden');
    if (window.chaikaUserMapPivot?.openCreator) {
      window.chaikaUserMapPivot.openCreator();
      return;
    }
    if (typeof switchView === 'function') switchView('createView');
    else {
      document.getElementById('mapView')?.classList.remove('active-view');
      document.getElementById('createView')?.classList.add('active-view');
    }
  }

  function createEntryPrompt() {
    document.getElementById('chaikaPivotModal')?.remove();
    document.getElementById(PROMPT_ID)?.remove();

    const modal = document.createElement('section');
    modal.id = PROMPT_ID;
    modal.innerHTML = `
      <div class="chaika-entry-backdrop"></div>
      <div class="chaika-entry-card">
        <div class="chaika-entry-kicker">ЧАЙКА · ЛЮДИ РЯДОМ</div>
        <h2>Хочешь создать своё событие?</h2>
        <p>Поставь точку на карте и напиши, что ты делаешь. Люди рядом увидят это сразу.</p>
        <div class="chaika-entry-examples"><span>Иду гулять</span><span>Сижу с кофе</span><span>Играю на гитаре</span><span>Ищу компанию</span></div>
        <button class="chaika-entry-primary" type="button">Создать событие</button>
        <button class="chaika-entry-secondary" type="button">Сначала посмотреть карту</button>
      </div>`;

    const hide = () => modal.classList.add('hidden');
    modal.querySelector('.chaika-entry-primary')?.addEventListener('click', openCreator);
    modal.querySelector('.chaika-entry-secondary')?.addEventListener('click', hide);
    modal.querySelector('.chaika-entry-backdrop')?.addEventListener('click', hide);
    document.body.appendChild(modal);
  }

  function showEntryPrompt() {
    const onboarding = document.getElementById('onboarding');
    if (onboarding && !onboarding.classList.contains('hidden')) {
      const observer = new MutationObserver(() => {
        if (!onboarding.classList.contains('hidden')) return;
        observer.disconnect();
        setTimeout(createEntryPrompt, 100);
      });
      observer.observe(onboarding, { attributes: true, attributeFilter: ['class'] });
      return;
    }
    createEntryPrompt();
  }

  injectStyles();
  forceMapView();
  installStableTiles();
  [0, 100, 300, 700, 1400].forEach(delay => setTimeout(refreshMap, delay));
  setTimeout(showEntryPrompt, 320);

  window.addEventListener('resize', refreshMap, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(refreshMap, 150), { passive: true });
  try {
    const tgApp = window.Telegram?.WebApp;
    tgApp?.onEvent?.('viewportChanged', refreshMap);
    tgApp?.onEvent?.('safeAreaChanged', refreshMap);
    tgApp?.onEvent?.('contentSafeAreaChanged', refreshMap);
  } catch (_) {}
})();
