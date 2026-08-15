/* CHAIKA iOS/Telegram safe-area alignment (rev16). */
(() => {
  const tgApp = window.Telegram?.WebApp;

  function applyInsets() {
    const safe = tgApp?.safeAreaInset || {};
    const contentSafe = tgApp?.contentSafeAreaInset || {};
    const top = Math.max(Number(safe.top || 0), Number(contentSafe.top || 0), 0);
    const bottom = Math.max(Number(safe.bottom || 0), Number(contentSafe.bottom || 0), 0);
    document.documentElement.style.setProperty('--chaika-tg-safe-top', `${top}px`);
    document.documentElement.style.setProperty('--chaika-tg-safe-bottom', `${bottom}px`);
  }

  const style = document.createElement('style');
  style.id = 'chaikaSafeAreaRev16';
  style.textContent = `
    :root{--chaika-tg-safe-top:0px;--chaika-tg-safe-bottom:0px}
    .topbar{
      padding-top:max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top))!important;
      min-height:calc(64px + max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top)))!important;
      box-sizing:border-box!important;
      align-items:flex-end!important;
      padding-bottom:10px!important;
    }
    .chaika-close-app{
      top:calc(max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top)) + 27px)!important;
      transform:none!important;
    }
    .chaika-close-app:active{transform:scale(.94)!important}
    .map-toolbar,.map-controls,.search-row,.map-search-row{
      scroll-margin-top:calc(max(env(safe-area-inset-top, 0px), var(--chaika-tg-safe-top)) + 8px);
    }
    .bottom-nav{
      padding-bottom:max(env(safe-area-inset-bottom, 0px), var(--chaika-tg-safe-bottom))!important;
      box-sizing:border-box!important;
    }
  `;
  document.head.appendChild(style);

  applyInsets();
  try {
    tgApp?.onEvent?.('safeAreaChanged', applyInsets);
    tgApp?.onEvent?.('contentSafeAreaChanged', applyInsets);
    tgApp?.onEvent?.('viewportChanged', applyInsets);
  } catch (_) {}
  window.addEventListener('resize', applyInsets, { passive: true });
})();
