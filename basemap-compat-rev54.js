/* CHAIKA rev56 — Yandex-like clean vector basemap only. App behavior stays untouched. */
(() => {
  if (!window.L || typeof map === 'undefined') return;

  const FALLBACK = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
  const STYLE = 'https://tiles.openfreemap.org/styles/bright';

  function loadCss(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(id, src) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.addEventListener('load', () => {
        script.dataset.loaded = '1';
        resolve();
      }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  // Remove retired CARTO tiles immediately so API-key watermarks can never appear.
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });

  // Keep a reliable raster map visible while the vector style loads.
  const fallback = L.tileLayer(FALLBACK, {
    maxZoom: 20,
    maxNativeZoom: 19,
    detectRetina: false,
    attribution: 'Tiles © Esri'
  }).addTo(map);
  map.__chaikaLightTiles = fallback;

  loadCss('chaikaMapLibreCssRev56', 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css');

  (async () => {
    try {
      await loadScript('chaikaMapLibreJsRev56', 'https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js');
      await loadScript('chaikaMapLibreLeafletRev56', 'https://unpkg.com/@maplibre/maplibre-gl-leaflet/leaflet-maplibre-gl.js');
      if (typeof L.maplibreGL !== 'function') throw new Error('MapLibre Leaflet bridge unavailable');

      const vectorLayer = L.maplibreGL({
        style: STYLE,
        attribution: '© OpenStreetMap contributors © OpenMapTiles'
      }).addTo(map);
      map.__chaikaVectorBasemap = vectorLayer;

      const gl = vectorLayer.getMaplibreMap?.();
      const promoteVector = () => {
        if (map.hasLayer(fallback)) map.removeLayer(fallback);
        map.invalidateSize?.();
      };

      if (gl?.loaded?.()) promoteVector();
      else gl?.once?.('load', promoteVector);

      // If style resources fail, keep the raster fallback instead of showing a blank map.
      gl?.on?.('error', (event) => {
        if (!map.hasLayer(fallback) && !gl?.loaded?.()) fallback.addTo(map);
        console.warn('CHAIKA vector basemap resource error', event?.error || event);
      });
    } catch (error) {
      console.warn('CHAIKA vector basemap fallback', error);
    }
  })();
})();
