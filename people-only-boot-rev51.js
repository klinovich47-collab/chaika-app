/* CHAIKA rev51 — people-only from the first render, before any public catalogue sync. */
(() => {
  if (typeof state === 'undefined') return;

  state.events = [];
  state.time = 'today';
  state.categories?.clear?.();
  state.price = null;
  state.distance = 0;
  state.query = '';
  state.selectedId = null;

  if (typeof filteredEvents === 'function' && !window.__chaikaPeopleOnlyFilteredRev51) {
    const baseFilteredEvents = filteredEvents;
    filteredEvents = function () {
      const rows = baseFilteredEvents();
      return (Array.isArray(rows) ? rows : []).filter(event => !String(event?.source || '').trim());
    };
    window.__chaikaPeopleOnlyFilteredRev51 = true;
  }

  try { renderMap(); } catch (_) {}
})();
