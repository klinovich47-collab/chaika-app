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

  function dayWindow(dateString) {
    const start = new Date(`${dateString}T00:00:00+03:00`).getTime();
    return { start, end: start + 24 * 60 * 60 * 1000 };
  }

  function externalLongRange(event) {
    const start = typeof eventStartsAt === 'function' ? eventStartsAt(event) : new Date(event?.startsAt || event?.date).getTime();
    const end = typeof eventExpiresAt === 'function' ? eventExpiresAt(event) : Number(event?.expiresAt || 0);
    return event?.source && Number.isFinite(start) && Number.isFinite(end) && end - start > 24 * 60 * 60 * 1000
      ? { start, end }
      : null;
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
      const now = Date.now();
      const startsAt = typeof eventStartsAt === 'function' ? eventStartsAt(event) : new Date(`${eventDate}T${event?.time||'00:00'}:00`).getTime();
      if (typeof isEventCurrent === 'function' && !isEventCurrent(event, now)) return false;
      if (state.time === 'now') {
        return event?.type === 'instant' && startsAt <= now;
      }
      const longRange = externalLongRange(event);
      if (longRange) {
        const lastOffset = state.time === 'tomorrow' ? 1 : state.time === 'week' ? 7 : state.time === 'month' ? 30 : 0;
        const firstDate = state.time === 'tomorrow' ? addCalendarDays(today, 1) : today;
        const first = dayWindow(firstDate);
        const rangeEnd = dayWindow(addCalendarDays(today, lastOffset)).end;
        return longRange.start < rangeEnd && longRange.end > first.start;
      }
      if (state.time === 'today') return eventDate === today;
      if (state.time === 'tomorrow') return eventDate === addCalendarDays(today, 1);
      if (state.time === 'week') return eventDate >= today && eventDate <= addCalendarDays(today, 7);
      if (state.time === 'month') return eventDate >= today && eventDate <= addCalendarDays(today, 30);
      return true;
    };
  } catch (_) {}

  try {
    const previousFormatDate = formatDate;
    formatDate = function(event) {
      const range = externalLongRange(event);
      if (!range) return previousFormatDate(event);
      const until = new Intl.DateTimeFormat('ru-RU', { timeZone: APP_TZ, day:'numeric', month:'long' }).format(new Date(range.end));
      return `До ${until}`;
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
