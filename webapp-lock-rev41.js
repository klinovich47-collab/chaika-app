/* CHAIKA rev41 — lock Telegram Mini App open and prevent pull-down collapse. */
(() => {
  const tg = window.Telegram?.WebApp;

  function lockTelegramWindow() {
    try { tg?.expand?.(); } catch (_) {}
    try { tg?.disableVerticalSwipes?.(); } catch (_) {}
  }

  lockTelegramWindow();
  requestAnimationFrame(lockTelegramWindow);
  setTimeout(lockTelegramWindow, 120);
  setTimeout(lockTelegramWindow, 700);

  const style = document.createElement('style');
  style.id = 'chaikaWebappLockRev41';
  style.textContent = `
    html,body{
      width:100%;height:100%;
      overflow:hidden!important;
      overscroll-behavior:none!important;
      -webkit-overflow-scrolling:auto!important;
    }
    body.chaika-user-map-pivot,
    body.chaika-user-map-pivot #app,
    body.chaika-user-map-pivot main,
    body.chaika-user-map-pivot #mapView{
      overflow:hidden!important;
      overscroll-behavior:none!important;
      touch-action:none;
    }
    body.chaika-user-map-pivot #map,
    body.chaika-user-map-pivot .leaflet-container{
      touch-action:none!important;
      overscroll-behavior:none!important;
    }
    body.chaika-user-map-pivot .event-sheet,
    body.chaika-user-map-pivot .chaika-group-list,
    body.chaika-user-map-pivot #createView,
    body.chaika-user-map-pivot .event-detail-view,
    body.chaika-user-map-pivot .event-detail-body{
      touch-action:pan-y!important;
      overscroll-behavior:contain!important;
      -webkit-overflow-scrolling:touch!important;
    }
  `;
  document.head.appendChild(style);

  // iOS Safari/WebView fallback: block downward page rubber-banding at the root,
  // but keep intentional scrolling inside sheets/forms/details.
  let startY = 0;
  const isScrollable = el => Boolean(el?.closest?.('.event-sheet,.chaika-group-list,#createView,.event-detail-view,.event-detail-body'));

  document.addEventListener('touchstart', e => {
    if (e.touches?.length === 1) startY = e.touches[0].clientY;
  }, { passive:true });

  document.addEventListener('touchmove', e => {
    if (!e.touches?.length || isScrollable(e.target)) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) e.preventDefault();
  }, { passive:false });

  try {
    tg?.onEvent?.('viewportChanged', lockTelegramWindow);
    tg?.onEvent?.('safeAreaChanged', lockTelegramWindow);
    tg?.onEvent?.('contentSafeAreaChanged', lockTelegramWindow);
  } catch (_) {}

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lockTelegramWindow();
  });
})();
