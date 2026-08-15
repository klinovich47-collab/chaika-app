/* CHAIKA fullscreen header layout: respect Telegram content safe area, remove duplicate close control (rev17). */
(() => {
  const tgApp = window.Telegram?.WebApp;
  const root = document.documentElement;

  function pxNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function syncTelegramInsets() {
    const contentTop = pxNumber(tgApp?.contentSafeAreaInset?.top);
    const safeTop = pxNumber(tgApp?.safeAreaInset?.top);
    const contentBottom = pxNumber(tgApp?.contentSafeAreaInset?.bottom);
    const safeBottom = pxNumber(tgApp?.safeAreaInset?.bottom);
    root.style.setProperty('--chaika-content-safe-top', `${Math.max(contentTop, safeTop)}px`);
    root.style.setProperty('--chaika-content-safe-bottom', `${Math.max(contentBottom, safeBottom)}px`);
  }

  function removeDuplicateClose() {
    document.getElementById('chaikaCloseApp')?.remove();
  }

  const style = document.createElement('style');
  style.id = 'chaikaHeaderLayoutRev17';
  style.textContent = `
    :root{
      --chaika-content-safe-top:0px;
      --chaika-content-safe-bottom:0px;
    }

    /* Telegram owns the fullscreen header controls. Do not draw a second close button. */
    #chaikaCloseApp,.chaika-close-app{display:none!important}

    /* Keep CHAIKA brand fully below Telegram's native Close / menu controls. */
    .topbar{
      position:relative!important;
      z-index:1100!important;
      padding-top:calc(max(var(--chaika-content-safe-top), var(--tg-content-safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 12px)!important;
      padding-right:16px!important;
      padding-bottom:10px!important;
      padding-left:16px!important;
      min-height:unset!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
    }
    .topbar .brand-wrap{
      position:relative!important;
      z-index:1!important;
      min-width:0!important;
      max-width:100%!important;
      margin:0!important;
    }
    .topbar .brand-wrap h1{white-space:nowrap!important}

    /* Search and time filters always occupy their own rows below the brand. */
    .search-wrap{position:relative!important;z-index:1090!important;margin-top:0!important}
    .filters{position:relative!important;z-index:1090!important}

    /* Bottom bar also respects Telegram/device content safe area. */
    .bottom-nav{
      padding-bottom:calc(7px + max(var(--chaika-content-safe-bottom), var(--tg-content-safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))!important;
    }
  `;
  document.head.appendChild(style);

  removeDuplicateClose();
  syncTelegramInsets();

  try {
    tgApp?.BackButton?.hide?.();
    tgApp?.onEvent?.('safeAreaChanged', syncTelegramInsets);
    tgApp?.onEvent?.('contentSafeAreaChanged', syncTelegramInsets);
    tgApp?.onEvent?.('fullscreenChanged', () => {
      syncTelegramInsets();
      removeDuplicateClose();
    });
  } catch (_) {}

  // Rev13 may append its close button slightly later in startup.
  requestAnimationFrame(removeDuplicateClose);
  setTimeout(removeDuplicateClose, 150);
  setTimeout(removeDuplicateClose, 600);
})();
