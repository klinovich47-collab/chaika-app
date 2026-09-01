/* CHAIKA rev50 — restore reliable basemap and the create-event entry prompt. */
(() => {
  const PROMPT_ID = 'chaikaPivotModal';

  function ensureMapVisible() {
    if (!window.L || typeof map === 'undefined') return;

    document.body.classList.add('chaika-user-map-pivot');
    document.getElementById('mapView')?.classList.add('active-view');
    document.getElementById('createView')?.classList.remove('active-view');

    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.style.display = 'block';
      mapEl.style.visibility = 'visible';
      mapEl.style.opacity = '1';
      mapEl.style.minHeight = '100dvh';
      mapEl.style.background = '#eef0e8';
    }

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: 'abc',
      maxZoom: 19,
      updateWhenIdle: false,
      keepBuffer: 4,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    tiles.bringToBack?.();
    map.__chaikaLightTiles = tiles;
    setTimeout(() => map.invalidateSize(false), 0);
    setTimeout(() => map.invalidateSize(false), 250);
    setTimeout(() => map.invalidateSize(false), 900);
  }

  function createPrompt() {
    document.getElementById(PROMPT_ID)?.remove();

    const modal = document.createElement('section');
    modal.id = PROMPT_ID;
    modal.className = 'chaika-pivot-modal';
    modal.innerHTML = `
      <div class="chaika-pivot-backdrop"></div>
      <div class="chaika-pivot-card">
        <div class="chaika-pivot-kicker">ЧАЙКА · ЛЮДИ РЯДОМ</div>
        <h2>Хочешь создать своё событие?</h2>
        <p>Поставь точку на карте и напиши, что ты делаешь. Люди рядом увидят это сразу.</p>
        <div class="chaika-pivot-examples"><span>Иду гулять</span><span>Сижу с кофе</span><span>Играю на гитаре</span><span>Ищу компанию</span></div>
        <button class="chaika-pivot-primary" type="button">Создать событие</button>
        <button class="chaika-pivot-secondary" type="button">Сначала посмотреть карту</button>
      </div>`;

    const hide = () => modal.classList.add('hidden');
    modal.querySelector('.chaika-pivot-primary')?.addEventListener('click', () => {
      hide();
      if (window.chaikaUserMapPivot?.openCreator) window.chaikaUserMapPivot.openCreator();
      else if (typeof switchView === 'function') switchView('createView');
    });
    modal.querySelector('.chaika-pivot-secondary')?.addEventListener('click', hide);
    modal.querySelector('.chaika-pivot-backdrop')?.addEventListener('click', hide);
    document.body.appendChild(modal);
  }

  function showPromptWhenReady() {
    const onboarding = document.getElementById('onboarding');
    if (onboarding && !onboarding.classList.contains('hidden')) {
      const observer = new MutationObserver(() => {
        if (onboarding.classList.contains('hidden')) {
          observer.disconnect();
          setTimeout(createPrompt, 120);
        }
      });
      observer.observe(onboarding, { attributes: true, attributeFilter: ['class'] });
      return;
    }
    createPrompt();
  }

  ensureMapVisible();
  setTimeout(ensureMapVisible, 120);
  setTimeout(showPromptWhenReady, 260);
})();
