/* CHAIKA rev44 — use real Supabase people events only so attendance/chat always has a UUID-backed event. */
(() => {
  const UUID_RE = /^[0-9a-f-]{36}$/i;

  async function loadRealPeopleEvents(showError = false) {
    try {
      const now = new Date();
      const staleCutoff = new Date(now.getTime() - HOUR);
      const to = new Date(now.getTime() + DAY);
      const q = new URLSearchParams();
      q.set('select', 'id,title,category,event_type,starts_at,expires_at,price_rub,venue,lat,lng,age_limit,description,ticket_url,image_url,promoted,going_count,source,moderation_status');
      q.append('moderation_status', 'eq.published');
      q.append('source', 'is.null');
      q.append('starts_at', `lte.${to.toISOString()}`);
      q.set('or', `(expires_at.gt.${now.toISOString()},and(expires_at.is.null,starts_at.gt.${staleCutoff.toISOString()}))`);
      q.set('order', 'starts_at.asc');

      const rows = await chaikaRequest(`events?${q}`);
      state.events = (Array.isArray(rows) ? rows : [])
        .map(chaikaEvent)
        .filter(event => UUID_RE.test(String(event.id)) && event.moderationStatus === 'published' && isEventCurrent(event));

      state.time = 'today';
      state.categories.clear();
      state.price = null;
      state.distance = 0;
      state.query = '';

      if (state.selectedId && !state.events.some(event => event.id === state.selectedId)) closeEventSheet();
      const detailId = els.detail?.dataset?.eventId;
      if (detailId && !state.events.some(event => event.id === detailId)) closeEventDetail();

      renderMap();
      updateProfile();
      return true;
    } catch (error) {
      console.error('CHAIKA real people events', error);
      state.events = state.events.filter(event => UUID_RE.test(String(event.id)));
      if (state.selectedId && !state.events.some(event => event.id === state.selectedId)) closeEventSheet();
      renderMap();
      updateProfile();
      if (showError) toast('Не удалось обновить карту');
      return false;
    }
  }

  function install() {
    try {
      chaikaLoadEvents = loadRealPeopleEvents;
      chaikaSync = async function () { return loadRealPeopleEvents(false); };
      if (window.chaikaUserMapPivot) window.chaikaUserMapPivot.reload = loadRealPeopleEvents;
    } catch (error) {
      console.warn('CHAIKA real people sync override', error);
    }
    loadRealPeopleEvents(false);
  }

  // rev36 schedules one final demo reload at 900 ms; re-assert the real UUID-backed dataset after it.
  setTimeout(install, 60);
  setTimeout(() => loadRealPeopleEvents(false), 1100);
})();
