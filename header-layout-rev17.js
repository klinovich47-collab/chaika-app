/* CHAIKA Telegram header layout: keep content below native controls (rev22). */
(() => {
  const tgApp = window.Telegram?.WebApp;
  const root = document.documentElement;

  function pxNumber(value) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function cssInset(name) {
    return pxNumber(getComputedStyle(root).getPropertyValue(name));
  }

  function isTelegramMobile() {
    if (!tgApp) return false;
    const platform = String(tgApp.platform || '').toLowerCase();
    const mobilePlatform = platform === 'ios' || platform === 'android';
    const mobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    const launchedInTelegram = Boolean(tgApp.initData) || (platform && platform !== 'unknown');
    return launchedInTelegram && (mobilePlatform || mobileDevice);
  }

  function syncTelegramInsets() {
    const contentTop = Math.max(
      pxNumber(tgApp?.contentSafeAreaInset?.top),
      cssInset('--tg-content-safe-area-inset-top')
    );
    const safeTop = Math.max(
      pxNumber(tgApp?.safeAreaInset?.top),
      cssInset('--tg-safe-area-inset-top')
    );
    const contentBottom = Math.max(
      pxNumber(tgApp?.contentSafeAreaInset?.bottom),
      cssInset('--tg-content-safe-area-inset-bottom')
    );
    const safeBottom = Math.max(
      pxNumber(tgApp?.safeAreaInset?.bottom),
      cssInset('--tg-safe-area-inset-bottom')
    );

    // Telegram iOS can report contentTop equal to safeTop while its native
    // Close/menu controls still overlay the page. Reserve their control band
    // only when the content-safe-area signal is clearly missing.
    const needsNativeControlsFallback = isTelegramMobile() && contentTop <= safeTop + 8;

    root.style.setProperty('--chaika-content-safe-top', `${Math.max(contentTop, safeTop)}px`);
    root.style.setProperty('--chaika-content-safe-bottom', `${Math.max(contentBottom, safeBottom)}px`);
    root.style.setProperty('--chaika-native-controls-gap', needsNativeControlsFallback ? '44px' : '0px');
    root.style.setProperty('--chaika-native-controls-min-top', needsNativeControlsFallback ? '84px' : '0px');
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
      --chaika-native-controls-gap:0px;
      --chaika-native-controls-min-top:0px;
    }

    /* Telegram owns the fullscreen header controls. Do not draw a second close button. */
    #chaikaCloseApp,.chaika-close-app{display:none!important}

    /* Keep CHAIKA brand fully below Telegram's native Close / menu controls. */
    .topbar{
      position:relative!important;
      z-index:1100!important;
      padding-top:calc(max(
        var(--chaika-content-safe-top),
        var(--tg-content-safe-area-inset-top, 0px),
        calc(var(--tg-safe-area-inset-top, 0px) + var(--chaika-native-controls-gap)),
        calc(env(safe-area-inset-top, 0px) + var(--chaika-native-controls-gap)),
        var(--chaika-native-controls-min-top)
      ) + 10px)!important;
      padding-right:16px!important;
      padding-bottom:10px!important;
      padding-left:16px!important;
      min-height:unset!important;
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
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
    tgApp?.onEvent?.('viewportChanged', syncTelegramInsets);
    tgApp?.onEvent?.('fullscreenChanged', () => {
      syncTelegramInsets();
      removeDuplicateClose();
    });
  } catch (_) {}

  // Rev13 may append its close button slightly later in startup.
  requestAnimationFrame(removeDuplicateClose);
  setTimeout(removeDuplicateClose, 150);
  setTimeout(removeDuplicateClose, 600);
  requestAnimationFrame(syncTelegramInsets);
  setTimeout(syncTelegramInsets, 150);
  setTimeout(syncTelegramInsets, 600);
  window.addEventListener('resize', syncTelegramInsets, { passive: true });
  document.addEventListener('visibilitychange', syncTelegramInsets);
})();
