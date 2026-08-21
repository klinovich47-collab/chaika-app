/* CHAIKA rev40 — keep transient top overlays below Telegram native controls. */
(() => {
  const tgApp = window.Telegram?.WebApp;
  const root = document.documentElement;

  const style = document.createElement('style');
  style.id = 'chaikaOverlaySafeAreaRev40';
  style.textContent = `
    :root{--chaika-overlay-top:128px}
    body.chaika-user-map-pivot .chaika-pivot-hint{
      top:var(--chaika-overlay-top)!important;
      left:14px!important;
      right:14px!important;
      max-width:460px!important;
      padding:10px 12px!important;
      border-radius:14px!important;
      z-index:2200!important;
      pointer-events:none!important;
      box-sizing:border-box!important;
    }
    body.chaika-user-map-pivot .chaika-pivot-hint strong{
      font-size:13px!important;
      line-height:1.25!important;
      margin-bottom:2px!important;
    }
    body.chaika-user-map-pivot .chaika-pivot-hint span{
      font-size:11.5px!important;
      line-height:1.3!important;
    }
    @media (max-width:390px){
      body.chaika-user-map-pivot .chaika-pivot-hint{left:10px!important;right:10px!important}
    }
  `;
  document.head.appendChild(style);

  function syncOverlayTop() {
    const search = document.querySelector('.search-wrap');
    const topbar = document.querySelector('.topbar');
    const anchor = search || topbar;
    let top = anchor ? Math.ceil(anchor.getBoundingClientRect().bottom + 8) : 128;
    const platform = String(tgApp?.platform || '').toLowerCase();
    const mobile = platform === 'ios' || platform === 'android' || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    if (mobile) top = Math.max(top, 118);
    root.style.setProperty('--chaika-overlay-top', `${top}px`);
  }

  syncOverlayTop();
  requestAnimationFrame(syncOverlayTop);
  setTimeout(syncOverlayTop, 120);
  setTimeout(syncOverlayTop, 600);
  window.addEventListener('resize', syncOverlayTop, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(syncOverlayTop, 120), {passive:true});
  try {
    tgApp?.onEvent?.('viewportChanged', syncOverlayTop);
    tgApp?.onEvent?.('safeAreaChanged', syncOverlayTop);
    tgApp?.onEvent?.('contentSafeAreaChanged', syncOverlayTop);
  } catch (_) {}
})();
