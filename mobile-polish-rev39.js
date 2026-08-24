/* CHAIKA rev39 — responsive mobile polish for Telegram iOS/Android. */
(() => {
  const tgApp = window.Telegram?.WebApp;
  const ua = navigator.userAgent || '';
  const platform = String(tgApp?.platform || '').toLowerCase();
  const isAndroid = platform === 'android' || /Android/i.test(ua);
  const isIOS = platform === 'ios' || /iPhone|iPad|iPod/i.test(ua);
  document.body.classList.toggle('chaika-android', isAndroid);
  document.body.classList.toggle('chaika-ios', isIOS);
  document.body.classList.toggle('chaika-telegram-fullscreen', tgApp?.isFullscreen === true);

  const style = document.createElement('style');
  style.id = 'chaikaMobilePolishRev39';
  style.textContent = `
    :root{
      --chaika-mobile-bottom:max(env(safe-area-inset-bottom,0px),var(--chaika-content-safe-bottom,0px),var(--chaika-tg-safe-bottom,0px));
    }
    html,body,#app{width:100%;max-width:100%;overflow-x:hidden!important}
    body.chaika-user-map-pivot{overscroll-behavior:none}

    /* HEADER: stay clear of Telegram native controls without wasting map space. */
    body.chaika-user-map-pivot .topbar{
      box-sizing:border-box!important;
      min-height:unset!important;
      padding-left:14px!important;
      padding-right:14px!important;
      padding-bottom:7px!important;
      gap:10px!important;
      align-items:flex-end!important;
    }
    body.chaika-android.chaika-user-map-pivot .topbar{
      padding-top:38px!important;
    }
    body.chaika-ios.chaika-user-map-pivot .topbar{
      padding-top:max(36px,env(safe-area-inset-top,0px))!important;
    }
    body.chaika-telegram-fullscreen.chaika-android.chaika-user-map-pivot .topbar{
      padding-top:76px!important;
    }
    body.chaika-telegram-fullscreen.chaika-ios.chaika-user-map-pivot .topbar{
      padding-top:max(76px,calc(env(safe-area-inset-top,0px) + 28px))!important;
    }
    body.chaika-user-map-pivot .brand-mark{width:48px!important;height:48px!important;flex:0 0 48px!important;border-radius:15px!important}
    body.chaika-user-map-pivot .brand-wrap{gap:10px!important;min-width:0!important}
    body.chaika-user-map-pivot .brand-copy{min-width:0!important}
    body.chaika-user-map-pivot .brand-copy h1,
    body.chaika-user-map-pivot .brand-wrap h1{font-size:28px!important;line-height:1!important;letter-spacing:-.04em!important;white-space:nowrap!important}
    body.chaika-user-map-pivot .eyebrow{font-size:10px!important;letter-spacing:.22em!important;margin-top:5px!important}
    body.chaika-user-map-pivot .top-actions{gap:7px!important}
    body.chaika-user-map-pivot .icon-btn{width:44px!important;height:44px!important;min-width:44px!important}

    /* SEARCH: compact and readable. */
    body.chaika-user-map-pivot .search-wrap{
      min-height:46px!important;height:46px!important;
      margin:7px 14px 9px!important;
      border-radius:15px!important;
      padding:0 4px 0 12px!important;
      box-sizing:border-box!important;
    }
    body.chaika-user-map-pivot .search-wrap input{font-size:16px!important;min-width:0!important;height:44px!important}
    body.chaika-user-map-pivot .search-icon{width:20px!important;height:20px!important;flex:0 0 20px!important}
    body.chaika-user-map-pivot .filter-btn{width:44px!important;min-width:44px!important;height:40px!important;padding:0!important}

    /* MAP CONTROLS. */
    body.chaika-user-map-pivot .leaflet-top.leaflet-right{top:8px!important;right:8px!important}
    body.chaika-user-map-pivot .leaflet-control-zoom a{width:42px!important;height:42px!important;line-height:42px!important;font-size:23px!important}
    body.chaika-user-map-pivot #mapEmpty{max-width:min(310px,calc(100vw - 44px))!important;padding:16px 18px!important;border-radius:18px!important;font-size:14px!important;line-height:1.35!important}

    /* MARKERS: keep the map legible on small screens. */
    body.chaika-user-map-pivot .regular-marker{width:38px!important;height:38px!important;border-width:2px!important}
    body.chaika-user-map-pivot .premium-marker{width:44px!important;height:44px!important;border-width:2px!important}
    body.chaika-user-map-pivot .regular-marker .marker-svg,
    body.chaika-user-map-pivot .premium-marker .marker-svg{width:19px!important;height:19px!important}
    body.chaika-user-map-pivot .chaika-group-marker{width:48px!important;height:48px!important;border-width:2px!important}
    body.chaika-user-map-pivot .chaika-group-marker svg{width:20px!important;height:20px!important}
    body.chaika-user-map-pivot .chaika-group-count{min-width:22px!important;height:22px!important;line-height:18px!important;padding:0 4px!important;font-size:11px!important;right:-5px!important;top:-5px!important}

    /* ONE persistent create CTA, hidden whenever another bottom layer is active. */
    body.chaika-user-map-pivot .chaika-pivot-cta{
      width:min(430px,calc(100vw - 28px))!important;
      min-height:54px!important;
      bottom:calc(12px + var(--chaika-mobile-bottom))!important;
      border-radius:18px!important;
      font-size:16px!important;
      box-shadow:0 10px 30px rgba(0,0,0,.24)!important;
    }
    body.chaika-sheet-open .chaika-pivot-cta,
    body.chaika-confirm-open .chaika-pivot-cta,
    body.chaika-detail-open .chaika-pivot-cta{display:none!important}

    /* LONG-PRESS confirmation only appears as a compact action bar. */
    body.chaika-user-map-pivot .chaika-location-confirm{
      left:12px!important;right:12px!important;width:auto!important;
      bottom:calc(12px + var(--chaika-mobile-bottom))!important;
      padding:10px 11px 10px 15px!important;
      min-height:64px!important;border-radius:18px!important;
      z-index:2400!important;box-sizing:border-box!important;
    }
    body.chaika-user-map-pivot .chaika-location-confirm .no,
    body.chaika-user-map-pivot .chaika-location-confirm .yes{min-width:70px!important;height:44px!important;border-radius:13px!important;font-size:14px!important}

    /* EVENT SHEET: true mobile bottom-sheet, never clipping title/time. */
    body.chaika-user-map-pivot .event-sheet{
      position:fixed!important;
      left:10px!important;right:10px!important;
      top:auto!important;
      bottom:calc(10px + var(--chaika-mobile-bottom))!important;
      width:auto!important;height:auto!important;
      max-height:min(60dvh,520px)!important;
      border-radius:24px!important;
      overflow-y:auto!important;
      overscroll-behavior:contain!important;
      -webkit-overflow-scrolling:touch!important;
      padding:0 0 14px!important;
      z-index:2300!important;
    }
    body.chaika-user-map-pivot .event-sheet-cover{height:112px!important;min-height:112px!important;border-radius:24px 24px 0 0!important}
    body.chaika-user-map-pivot .event-sheet-cover-hint{font-size:11px!important;right:12px!important;bottom:10px!important}
    body.chaika-user-map-pivot .event-sheet .sheet-row{padding:14px 16px 6px!important;gap:11px!important;align-items:flex-start!important}
    body.chaika-user-map-pivot .event-sheet .event-type-icon{width:44px!important;height:44px!important;min-width:44px!important}
    body.chaika-user-map-pivot .event-sheet .event-main{min-width:0!important;overflow:visible!important}
    body.chaika-user-map-pivot .event-sheet .event-title{
      margin:3px 0 5px!important;
      font-size:20px!important;line-height:1.16!important;
      white-space:normal!important;overflow:visible!important;text-overflow:clip!important;
      display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;
      max-height:none!important;
    }
    body.chaika-user-map-pivot .event-sheet .event-meta{
      font-size:13px!important;line-height:1.38!important;
      white-space:normal!important;overflow:visible!important;text-overflow:clip!important;
      word-break:break-word!important;
    }
    body.chaika-user-map-pivot .event-sheet>p.event-meta{
      margin:6px 16px 12px!important;
      display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;
      overflow:hidden!important;
    }
    body.chaika-user-map-pivot .event-sheet .actions{
      display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;
      padding:0 16px!important;margin:0!important;
    }
    body.chaika-user-map-pivot .event-sheet .actions button{min-height:46px!important;margin:0!important;border-radius:14px!important;font-size:14px!important}
    body.chaika-user-map-pivot .event-sheet .actions button:nth-child(n+3){grid-column:1 / -1!important}
    body.chaika-user-map-pivot .chaika-sheet-close-fixed{width:36px!important;height:36px!important;right:10px!important;top:9px!important;font-size:23px!important}

    /* Group sheet scrolls internally and stays below native Telegram chrome. */
    body.chaika-user-map-pivot .event-sheet.chaika-group-open{padding:0!important;max-height:min(62dvh,540px)!important}
    body.chaika-user-map-pivot .chaika-group-sheet{height:auto!important;max-height:min(62dvh,540px)!important}
    body.chaika-user-map-pivot .chaika-group-head{padding:14px 54px 11px 14px!important}
    body.chaika-user-map-pivot .chaika-group-head h3{font-size:17px!important;line-height:1.2!important}
    body.chaika-user-map-pivot .chaika-group-list{padding:9px 9px calc(12px + var(--chaika-mobile-bottom))!important}
    body.chaika-user-map-pivot .chaika-group-event{grid-template-columns:38px minmax(0,1fr) 18px!important;padding:10px!important;gap:9px!important}
    body.chaika-user-map-pivot .chaika-group-event h4{white-space:normal!important;line-height:1.25!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important}
    body.chaika-user-map-pivot .chaika-group-event p{white-space:normal!important;line-height:1.3!important}

    /* Full detail must fit short Android and small iPhones. */
    body.chaika-user-map-pivot .event-detail-view{padding-bottom:var(--chaika-mobile-bottom)!important}
    body.chaika-user-map-pivot .event-detail-body h2{font-size:28px!important;line-height:1.08!important;overflow-wrap:anywhere!important}
    body.chaika-user-map-pivot .detail-actions{position:sticky!important;bottom:0!important;padding-bottom:calc(10px + var(--chaika-mobile-bottom))!important}

    @media (max-width:390px){
      body.chaika-user-map-pivot .brand-mark{width:44px!important;height:44px!important;flex-basis:44px!important}
      body.chaika-user-map-pivot .brand-copy h1,body.chaika-user-map-pivot .brand-wrap h1{font-size:25px!important}
      body.chaika-user-map-pivot .eyebrow{display:none!important}
      body.chaika-user-map-pivot .search-wrap{margin-left:10px!important;margin-right:10px!important}
      body.chaika-user-map-pivot .event-sheet{left:8px!important;right:8px!important}
    }
    @media (max-height:740px){
      body.chaika-user-map-pivot .eyebrow{display:none!important}
      body.chaika-user-map-pivot .search-wrap{height:44px!important;min-height:44px!important;margin-top:5px!important;margin-bottom:6px!important}
      body.chaika-user-map-pivot .event-sheet{max-height:min(58dvh,430px)!important}
      body.chaika-user-map-pivot .event-sheet-cover{height:78px!important;min-height:78px!important}
      body.chaika-user-map-pivot .event-sheet>p.event-meta{-webkit-line-clamp:2!important}
    }
    @media (max-height:650px){
      body.chaika-user-map-pivot .event-sheet-cover{display:none!important}
      body.chaika-user-map-pivot .event-sheet{max-height:56dvh!important}
      body.chaika-user-map-pivot .event-sheet .event-title{font-size:18px!important}
      body.chaika-user-map-pivot .event-sheet .sheet-row{padding-top:16px!important}
    }
  `;
  document.head.appendChild(style);

  const search = document.getElementById('searchInput');
  if (search) search.placeholder = 'Поиск событий';

  const sheet = document.getElementById('eventSheet');
  const detail = document.getElementById('eventDetailView');

  function isVisible(el) {
    if (!el || el.classList.contains('hidden')) return false;
    const css = getComputedStyle(el);
    return css.display !== 'none' && css.visibility !== 'hidden';
  }

  function syncLayers() {
    const confirm = document.querySelector('.chaika-location-confirm');
    document.body.classList.toggle('chaika-sheet-open', isVisible(sheet));
    document.body.classList.toggle('chaika-confirm-open', isVisible(confirm));
    document.body.classList.toggle('chaika-detail-open', isVisible(detail));
    const cta = document.getElementById('chaikaPivotCta');
    if (cta) cta.classList.toggle('hidden', isVisible(sheet) || isVisible(confirm) || isVisible(detail) || document.getElementById('createView')?.classList.contains('active-view'));
  }

  const observer = new MutationObserver(syncLayers);
  observer.observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});

  function refreshViewport() {
    syncLayers();
    try { map?.invalidateSize?.(); } catch (_) {}
  }

  window.addEventListener('resize', refreshViewport, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(refreshViewport, 120), {passive:true});
  try {
    tgApp?.onEvent?.('viewportChanged', refreshViewport);
    tgApp?.onEvent?.('safeAreaChanged', refreshViewport);
    tgApp?.onEvent?.('contentSafeAreaChanged', refreshViewport);
    tgApp?.onEvent?.('fullscreenChanged', () => {
      document.body.classList.toggle('chaika-telegram-fullscreen', tgApp?.isFullscreen === true);
      refreshViewport();
    });
  } catch (_) {}

  requestAnimationFrame(refreshViewport);
  setTimeout(refreshViewport, 120);
  setTimeout(refreshViewport, 700);
})();
