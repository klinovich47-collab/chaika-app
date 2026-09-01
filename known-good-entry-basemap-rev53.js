/* CHAIKA rev53 — keep the 2026-08-26 known-good app behavior, replacing only the retired CARTO tile endpoint and resetting the entry prompt per app load. */
(() => {
  try { sessionStorage.removeItem('chaika_user_map_pivot_prompt_v1'); } catch (_) {}

  if (!window.L || typeof L.tileLayer !== 'function') return;
  const originalTileLayer = L.tileLayer.bind(L);

  L.tileLayer = function(url, options = {}) {
    const value = String(url || '');
    if (/cartocdn\.com/i.test(value)) {
      return originalTileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        ...options,
        subdomains: undefined,
        maxZoom: 19,
        detectRetina: false,
        attribution: 'Tiles © Esri'
      });
    }
    return originalTileLayer(url, options);
  };
})();
