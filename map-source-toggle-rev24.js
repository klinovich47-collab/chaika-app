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
