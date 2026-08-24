/* CHAIKA rev36 — user-only live map pivot. No public-event catalogue, no organizations, no concerts. */
(() => {
  const PIVOT_PROMPT_KEY = 'chaika_user_map_pivot_prompt_v1';

  function injectPivotStyles() {
    if (document.getElementById('chaikaPivotStyles')) return;
    const style = document.createElement('style');
    style.id = 'chaikaPivotStyles';
    style.textContent = `
      body.chaika-user-map-pivot .filters,
      body.chaika-user-map-pivot .bottom-nav,
      body.chaika-user-map-pivot #feedView,
      body.chaika-user-map-pivot #concertsView,
      body.chaika-user-map-pivot #profileView,
      body.chaika-user-map-pivot [data-source-toggle],
      body.chaika-user-map-pivot .map-source-toggle,
      body.chaika-user-map-pivot .museum-entry,
      body.chaika-user-map-pivot .concert-entry { display:none !important; }

      body.chaika-user-map-pivot main { padding-bottom:0 !important; }
      body.chaika-user-map-pivot #mapView { display:block !important; height:100% !important; }
      body.chaika-user-map-pivot #map { height:100% !important; min-height:100dvh; }
      body.chaika-user-map-pivot #createView { padding-bottom:32px !important; }
      body.chaika-user-map-pivot #createView:not(.active-view) { display:none !important; }
      body.chaika-user-map-pivot #mapView:not(.active-view) { display:none !important; }

      .chaika-pivot-cta {
        position:fixed; left:50%; bottom:calc(18px + env(safe-area-inset-bottom)); transform:translateX(-50%);
        z-index:1200; width:min(420px, calc(100vw - 32px)); min-height:56px; border:0; border-radius:18px;
        background:#fff; color:#0b0b0d; font:700 16px/1.1 system-ui,-apple-system,sans-serif;
        box-shadow:0 10px 35px rgba(0,0,0,.28); display:flex; align-items:center; justify-content:center; gap:9px;
      }
      .chaika-pivot-cta svg { width:21px; height:21px; fill:none; stroke:currentColor; stroke-width:2; }
      .chaika-pivot-cta.hidden { display:none !important; }

      .chaika-pivot-hint {
        position:fixed; left:16px; right:16px; top:calc(12px + env(safe-area-inset-top)); z-index:1100;
        margin:auto; max-width:460px; padding:12px 14px; border-radius:16px;
        background:rgba(11,11,13,.88); color:#fff; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
        border:1px solid rgba(255,255,255,.12); box-shadow:0 8px 24px rgba(0,0,0,.2);
      }
      .chaika-pivot-hint strong { display:block; font-size:14px; margin-bottom:2px; }
      .chaika-pivot-hint span { display:block; font-size:12px; opacity:.74; }

      .chaika-pivot-modal { position:fixed; inset:0; z-index:3000; display:flex; align-items:flex-end; justify-content:center; }
      .chaika-pivot-modal.hidden { display:none !important; }
      .chaika-pivot-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.52); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
      .chaika-pivot-card {
        position:relative; width:min(520px,100%); margin:0 10px calc(10px + env(safe-area-inset-bottom));
        padding:24px 20px 18px; border-radius:26px; background:#101014; color:#fff;
        border:1px solid rgba(255,255,255,.12); box-shadow:0 20px 60px rgba(0,0,0,.45);
      }
      .chaika-pivot-kicker { font-size:11px; font-weight:800; letter-spacing:.12em; opacity:.55; margin-bottom:9px; }
      .chaika-pivot-card h2 { margin:0 0 9px; font-size:26px; line-height:1.05; }
      .chaika-pivot-card p { margin:0 0 20px; color:rgba(255,255,255,.72); font-size:15px; line-height:1.4; }
      .chaika-pivot-examples { display:flex; flex-wrap:wrap; gap:7px; margin:0 0 20px; }
      .chaika-pivot-examples span { padding:8px 10px; border-radius:999px; background:rgba(255,255,255,.08); font-size:12px; }
      .chaika-pivot-primary, .chaika-pivot-secondary { width:100%; min-height:52px; border-radius:16px; font-weight:750; font-size:15px; }
      .chaika-pivot-primary { border:0; background:#fff; color:#0b0b0d; margin-bottom:8px; }
      .chaika-pivot-secondary { border:1px solid rgba(255,255,255,.13); background:transparent; color:#fff; }

      .chaika-create-back { display:flex; align-items:center; gap:8px; margin:0 0 12px; border:0; background:transparent; color:inherit; font:650 14px system-ui,-apple-system,sans-serif; padding:8px 0; }
      .chaika-create-back svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2; }

      body.chaika-user-map-pivot #mapEmpty { max-width:320px; left:50%; transform:translateX(-50%); text-align:center; }
    `;
    document.head.appendChild(style);
  }

  function onlyPeopleEvents(list) {
    return (Array.isArray(list) ? list : []).filter(e => !String(e?.source || '').trim());
  }

  function peopleDemoEvents() {
    const now = Date.now();
    const minute = 60 * 1000;
    const rows = [
      ['demo-people-01', 'Пьём кофе и знакомимся', 'coffee', -10, 110, 'Новая Голландия', 59.9292, 30.2891, 'Сидим у главного газона. Подходи, если хочется познакомиться и спокойно поболтать.', 5],
      ['demo-people-02', 'Играем на гитаре у воды', 'guitar', 25, 180, 'Набережная Фонтанки', 59.9348, 30.3385, 'Берём акустику и собираемся небольшой компанией. Можно прийти со своим инструментом.', 8],
      ['demo-people-03', 'Прогулка без маршрута', 'walk', 45, 150, 'Летний сад', 59.9457, 30.3354, 'Идём неспешно по центру, маршрут выберем вместе. Встречаемся у главного входа.', 4],
      ['demo-people-04', 'Шахматы в Таврическом', 'chess', 70, 210, 'Таврический сад', 59.9476, 30.3726, 'Есть две доски. Уровень любой, главное — желание сыграть и пообщаться.', 7],
      ['demo-people-05', 'Рисуем город вместе', 'art', 95, 240, 'Севкабель Порт', 59.9240, 30.2419, 'Берите скетчбук или планшет. Рисуем набережную и показываем работы друг другу.', 6],
      ['demo-people-06', 'Ищем компанию на настолки', 'game', 125, 260, 'Петроградская сторона', 59.9611, 30.3128, 'Собираемся сыграть в несколько быстрых настольных игр. Новичкам всё объясним.', 9],
      ['demo-people-07', 'Фрисби после работы', 'sport', 155, 270, 'Приморский парк Победы', 59.9717, 30.2604, 'Лёгкая дружеская игра без подготовки. Возьмите воду и удобную обувь.', 11],
      ['demo-people-08', 'Гуляем с собаками', 'dog', 190, 300, 'Юсуповский сад', 59.9270, 30.3151, 'Спокойная прогулка для собак и хозяев. Встречаемся со стороны Садовой улицы.', 5],
      ['demo-people-09', 'Практикуем английский', 'study', 230, 330, 'Бертгольд Центр', 59.9247, 30.3168, 'Разговорная встреча без учебников. Подойдёт средний уровень и выше.', 12],
      ['demo-people-10', 'Смотрим закат с термосом', 'chat', 280, 390, 'Стрелка Васильевского острова', 59.9442, 30.3064, 'Берём чай, садимся у воды и провожаем день. Можно приходить одному.', 10]
    ];
    return rows.map(([id, title, category, startOffset, duration, venue, lat, lng, description, going]) => ({
      id, title, category, event_type:'instant',
      starts_at:new Date(now + startOffset * minute).toISOString(),
      expires_at:new Date(now + (startOffset + duration) * minute).toISOString(),
      price_rub:0, venue, lat, lng, age_limit:0, description,
      ticket_url:'', image_url:'', promoted:false, going_count:going,
      source:null, moderation_status:'published'
    }));
  }

  async function chaikaPivotLoadEvents(showError = false) {
    try {
      const now = new Date();
      const staleCutoff = new Date(now.getTime() - HOUR);
      const to = new Date(now.getTime() + DAY);
      const q = new URLSearchParams();
      q.set('select', 'id,title,category,event_type,starts_at,expires_at,price_rub,venue,lat,lng,age_limit,description,ticket_url,image_url,promoted,going_count,source,moderation_status');
      q.append('moderation_status', 'eq.published');
      q.append('source', 'is.null');
      q.append('starts_at', `lte.${to.toISOString()}`);
      q.set('or', `(expires_at.gt.${now.toISOString()},and(expires_at.is.null,starts_at.gt.${staleCutoff.toISOString()}))`);
      q.set('order', 'starts_at.asc');
      const rows = await chaikaRequest(`events?${q}`);
      const liveRows = Array.isArray(rows) ? rows : [];
      state.events = onlyPeopleEvents([...peopleDemoEvents(), ...liveRows].map(chaikaEvent))
        .filter(e => e.moderationStatus === 'published' && isEventCurrent(e));
      state.time = 'today';
      state.categories.clear();
      state.price = null;
      state.distance = 0;
      state.query = '';
      renderMap();
      updateProfile();
      updateEmptyState();
      return true;
    } catch (error) {
      console.error('CHAIKA user-only events', error);
      state.events = peopleDemoEvents().map(chaikaEvent)
        .filter(e => e.moderationStatus === 'published' && isEventCurrent(e));
      renderMap();
      updateProfile();
      updateEmptyState();
      if (showError) toast('Не удалось обновить карту');
      return false;
    }
  }

  function updateEmptyState() {
    const empty = document.getElementById('mapEmpty');
    if (!empty) return;
    if (!state.events.length) {
      empty.innerHTML = '<strong>Пока рядом тихо</strong><br><span>Создай первое событие — кто-нибудь может быть совсем рядом.</span>';
      empty.classList.remove('hidden');
    }
  }

  function openCreator() {
    sessionStorage.setItem(PIVOT_PROMPT_KEY, '1');
    document.getElementById('chaikaPivotModal')?.classList.add('hidden');
    document.getElementById('chaikaPivotCta')?.classList.add('hidden');
    if (typeof switchView === 'function') switchView('createView');
    else {
      document.getElementById('mapView')?.classList.remove('active-view');
      document.getElementById('createView')?.classList.add('active-view');
    }
    setTimeout(() => document.querySelector('#eventForm input[name="title"]')?.focus(), 120);
  }

  function openMap() {
    if (typeof switchView === 'function') switchView('mapView');
    else {
      document.getElementById('createView')?.classList.remove('active-view');
      document.getElementById('mapView')?.classList.add('active-view');
    }
    document.getElementById('chaikaPivotCta')?.classList.remove('hidden');
    setTimeout(() => map?.invalidateSize?.(), 80);
  }

  function installCreateBack() {
    const head = document.querySelector('#createView .section-head');
    if (!head || document.getElementById('chaikaCreateBack')) return;
    const back = document.createElement('button');
    back.id = 'chaikaCreateBack';
    back.className = 'chaika-create-back';
    back.type = 'button';
    back.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-back"/></svg><span>Назад на карту</span>';
    back.addEventListener('click', openMap);
    head.parentNode.insertBefore(back, head);
    const sub = head.querySelector('.muted');
    if (sub) sub.textContent = 'Расскажи, что происходит прямо сейчас';
    const title = head.querySelector('h2');
    if (title) title.textContent = 'Создать событие';
  }

  function installPersistentCta() {
    if (document.getElementById('chaikaPivotCta')) return;
    const button = document.createElement('button');
    button.id = 'chaikaPivotCta';
    button.className = 'chaika-pivot-cta';
    button.type = 'button';
    button.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-plus"/></svg><span>Создать событие</span>';
    button.addEventListener('click', openCreator);
    document.body.appendChild(button);
  }

  function installHint() {
    if (document.getElementById('chaikaPivotHint')) return;
    const hint = document.createElement('div');
    hint.id = 'chaikaPivotHint';
    hint.className = 'chaika-pivot-hint';
    hint.innerHTML = '<strong>Что происходит рядом?</strong><span>На карте только события, которые создают люди.</span>';
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 6500);
  }

  function installPrompt() {
    if (sessionStorage.getItem(PIVOT_PROMPT_KEY) || document.getElementById('chaikaPivotModal')) return;
    const modal = document.createElement('section');
    modal.id = 'chaikaPivotModal';
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
    modal.querySelector('.chaika-pivot-primary')?.addEventListener('click', openCreator);
    modal.querySelector('.chaika-pivot-secondary')?.addEventListener('click', () => {
      sessionStorage.setItem(PIVOT_PROMPT_KEY, '1');
      modal.classList.add('hidden');
    });
    modal.querySelector('.chaika-pivot-backdrop')?.addEventListener('click', () => {
      sessionStorage.setItem(PIVOT_PROMPT_KEY, '1');
      modal.classList.add('hidden');
    });
    document.body.appendChild(modal);
  }

  function enforceMapOnly() {
    document.body.classList.add('chaika-user-map-pivot');
    state.events = onlyPeopleEvents(state.events);
    state.time = 'today';
    state.categories.clear();
    state.query = '';
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById('mapView')?.classList.add('active-view');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    renderMap();
    updateEmptyState();
  }

  injectPivotStyles();
  enforceMapOnly();
  installCreateBack();
  installPersistentCta();
  installHint();
  installPrompt();

  // Replace catalogue sync with user-only map sync for all subsequent refreshes.
  try {
    chaikaLoadEvents = chaikaPivotLoadEvents;
    chaikaSync = async function () { return chaikaPivotLoadEvents(false); };
  } catch (error) {
    console.warn('CHAIKA pivot sync override', error);
  }

  // The old startup sync may still be in flight. Re-assert the new dataset after it settles.
  setTimeout(() => chaikaPivotLoadEvents(false), 0);
  setTimeout(() => chaikaPivotLoadEvents(false), 900);

  document.addEventListener('click', event => {
    if (event.target.closest('#chaikaCreateBack')) return;
    const createView = document.getElementById('createView');
    const cta = document.getElementById('chaikaPivotCta');
    if (!createView || !cta) return;
    setTimeout(() => cta.classList.toggle('hidden', createView.classList.contains('active-view')), 0);
  }, true);

  window.chaikaUserMapPivot = { openCreator, openMap, reload: chaikaPivotLoadEvents };
})();
