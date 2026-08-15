/* CHAIKA draggable event/cluster sheet + geolocated startup (rev19). */
(() => {
  const SPB = [59.9343, 30.3351];
  const CITY_ZOOM = 13;
  const USER_ZOOM = 14;
  let drag = null;
  let userLocated = false;

  function closeSheet() {
    try { els.sheet.classList.add('hidden'); } catch (_) {}
    try { els.sheet.classList.remove('chaika-group-open'); } catch (_) {}
    try { state.selectedId = null; } catch (_) {}
  }

  function ensureSheetChrome() {
    const sheet = els?.sheet;
    if (!sheet || sheet.querySelector('.chaika-sheet-handle')) return;
    const handle = document.createElement('div');
    handle.className = 'chaika-sheet-handle';
    handle.setAttribute('aria-hidden','true');
    sheet.prepend(handle);
  }

  function bindSheetGestures() {
    const sheet = els?.sheet;
    if (!sheet || sheet.__chaikaGestureBound) return;
    sheet.__chaikaGestureBound = true;

    sheet.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button,input,textarea,select,a')) return;
      drag = { id:e.pointerId, y:e.clientY, last:e.clientY, moved:false };
      sheet.setPointerCapture?.(e.pointerId);
      sheet.classList.add('chaika-sheet-dragging');
    });
    sheet.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dy = Math.max(0, e.clientY - drag.y);
      drag.last = e.clientY;
      drag.moved = drag.moved || dy > 4;
      sheet.style.transform = `translateY(${dy}px)`;
      sheet.style.transition = 'none';
    });
    const finish = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dy = Math.max(0, drag.last - drag.y);
      const shouldClose = dy > Math.min(160, window.innerHeight * .18);
      drag = null;
      sheet.classList.remove('chaika-sheet-dragging');
      sheet.style.transition = '';
      if (shouldClose) {
        sheet.style.transform = 'translateY(110%)';
        setTimeout(() => { sheet.style.transform=''; closeSheet(); }, 180);
      } else {
        sheet.style.transform = '';
      }
    };
    sheet.addEventListener('pointerup', finish);
    sheet.addEventListener('pointercancel', finish);
  }

  // Close any open sheet when the map itself is tapped.
  try {
    map.on('click', () => {
      if (!els.sheet.classList.contains('hidden')) closeSheet();
    });
  } catch (_) {}

  // Re-inject drag handle after sheet content is replaced by event/group rendering.
  const mo = new MutationObserver(() => { ensureSheetChrome(); bindSheetGestures(); });
  try { mo.observe(els.sheet, { childList:true, subtree:false }); } catch (_) {}
  ensureSheetChrome(); bindSheetGestures();

  function showUserLocation(lat, lng, accuracy) {
    userLocated = true;
    state.userLocation = [lat, lng];
    map.setView([lat, lng], USER_ZOOM, { animate:false });
    if (window.L) {
      if (window.__chaikaUserDot) map.removeLayer(window.__chaikaUserDot);
      window.__chaikaUserDot = L.circleMarker([lat,lng], {
        radius:7, weight:3, color:'#fff', fillColor:'#4f8cff', fillOpacity:1
      }).addTo(map);
      if (Number.isFinite(accuracy)) {
        if (window.__chaikaUserAccuracy) map.removeLayer(window.__chaikaUserAccuracy);
        window.__chaikaUserAccuracy = L.circle([lat,lng], {
          radius:Math.min(Math.max(accuracy, 20), 1200), weight:1, opacity:.25, fillOpacity:.04
        }).addTo(map);
      }
    }
  }

  function fallbackToCity() {
    if (userLocated) return;
    map.setView(SPB, CITY_ZOOM, { animate:false });
  }

  function locateAtStartup() {
    fallbackToCity();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => showUserLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      () => fallbackToCity(),
      { enableHighAccuracy:true, timeout:7000, maximumAge:120000 }
    );
  }

  // Make the location icon in the topbar useful as a re-center action.
  document.addEventListener('click', e => {
    const btn = e.target.closest('.icon-btn');
    if (!btn) return;
    const svg = btn.querySelector('use')?.getAttribute('href') || '';
    if (!svg.includes('i-pin')) return;
    if (state.userLocation) map.setView(state.userLocation, USER_ZOOM, { animate:true });
    else locateAtStartup();
  }, true);

  const style = document.createElement('style');
  style.id = 'chaikaSheetGeoRev19';
  style.textContent = `
    .event-sheet{max-height:min(72dvh,620px)!important;overflow:hidden!important;touch-action:pan-y;transition:transform .18s ease,opacity .18s ease}
    .event-sheet.chaika-sheet-dragging{will-change:transform}
    .chaika-sheet-handle{width:42px;height:5px;border-radius:999px;background:#5b5c64;margin:8px auto 10px;opacity:.9;flex:none}
    .chaika-group-sheet{max-height:min(68dvh,590px)!important}
    .chaika-group-list{overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
  `;
  document.head.appendChild(style);

  // Run after existing startup rendering so the initial viewport is corrected last.
  setTimeout(locateAtStartup, 120);
})();
