/* CHAIKA event sheet layout fix: keep below filters, reliable close/drag (rev20). */
(() => {
  const sheet = els?.sheet;
  if (!sheet) return;

  function controlsBottom() {
    const filters = document.querySelector('.filters');
    const search = document.querySelector('.search-wrap');
    const topbar = document.querySelector('.topbar');
    const candidates = [filters, search, topbar].filter(Boolean);
    return Math.max(0, ...candidates.map(el => el.getBoundingClientRect().bottom));
  }

  function applySheetBounds() {
    const top = Math.ceil(controlsBottom() + 8);
    const nav = document.querySelector('.bottom-nav');
    const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight;
    const available = Math.max(180, navTop - top - 8);
    document.documentElement.style.setProperty('--chaika-sheet-top', `${top}px`);
    document.documentElement.style.setProperty('--chaika-sheet-max', `${available}px`);
  }

  function closeSheetNow() {
    try { sheet.classList.add('hidden'); } catch (_) {}
    try { sheet.classList.remove('chaika-group-open'); } catch (_) {}
    try { sheet.style.transform = ''; } catch (_) {}
    try { state.selectedId = null; } catch (_) {}
  }

  function ensureCloseButton() {
    if (sheet.querySelector('.chaika-sheet-close-fixed')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chaika-sheet-close-fixed';
    btn.setAttribute('aria-label','Закрыть список событий');
    btn.textContent = '×';
    btn.addEventListener('click', e => { e.stopPropagation(); closeSheetNow(); });
    sheet.appendChild(btn);
  }

  const style = document.createElement('style');
  style.id = 'chaikaSheetLayoutRev20';
  style.textContent = `
    .event-sheet{
      position:fixed!important;
      left:12px!important;
      right:12px!important;
      top:var(--chaika-sheet-top)!important;
      bottom:auto!important;
      max-height:var(--chaika-sheet-max)!important;
      height:auto!important;
      border-radius:22px!important;
      overflow:hidden!important;
      z-index:1900!important;
    }
    .event-sheet.chaika-group-open{padding:0!important}
    .chaika-group-sheet{max-height:var(--chaika-sheet-max)!important;height:100%!important;min-height:0!important}
    .chaika-group-list{min-height:0!important;overflow-y:auto!important;padding-bottom:18px!important}
    .chaika-sheet-handle{position:sticky;top:0;z-index:5;margin:7px auto 4px!important}
    .chaika-sheet-close-fixed{
      position:absolute;right:10px;top:8px;z-index:20;width:34px;height:34px;border-radius:50%;
      border:1px solid #34343d;background:#202026;color:#fff;font-size:24px;line-height:1;
      display:grid;place-items:center;
    }
    .chaika-group-head{padding-right:54px!important}
    @media (max-height:720px){.event-sheet{border-radius:18px!important}}
  `;
  document.head.appendChild(style);

  const mo = new MutationObserver(() => {
    applySheetBounds();
    ensureCloseButton();
  });
  mo.observe(sheet, { childList:true, subtree:false, attributes:true, attributeFilter:['class'] });

  // Drag only from the handle/header area; this avoids fighting with list scrolling.
  let drag = null;
  sheet.addEventListener('pointerdown', e => {
    const dragZone = e.target.closest('.chaika-sheet-handle,.chaika-group-head');
    if (!dragZone || e.target.closest('button,a,input,textarea,select')) return;
    drag = { id:e.pointerId, y:e.clientY, last:e.clientY };
    sheet.setPointerCapture?.(e.pointerId);
    sheet.style.transition='none';
  }, true);
  sheet.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - drag.y);
    drag.last = e.clientY;
    sheet.style.transform=`translateY(${dy}px)`;
  }, true);
  const finish = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dy = Math.max(0, drag.last - drag.y);
    drag = null;
    sheet.style.transition='transform .18s ease';
    if (dy > 110) {
      sheet.style.transform='translateY(110%)';
      setTimeout(closeSheetNow, 170);
    } else {
      sheet.style.transform='';
    }
  };
  sheet.addEventListener('pointerup', finish, true);
  sheet.addEventListener('pointercancel', finish, true);

  window.addEventListener('resize', applySheetBounds);
  window.Telegram?.WebApp?.onEvent?.('viewportChanged', applySheetBounds);
  window.Telegram?.WebApp?.onEvent?.('contentSafeAreaChanged', applySheetBounds);

  applySheetBounds();
  ensureCloseButton();
})();
