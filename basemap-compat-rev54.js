/* CHAIKA rev54 — replace retired CARTO raster tiles after the legacy light-map module without touching map behavior. */
(() => {
  if (!window.L || typeof map === 'undefined') return;

  const BASE = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  const LABELS = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });

  map.__chaikaLightTiles = L.tileLayer(BASE, {
    maxZoom: 20,
    maxNativeZoom: 16,
    detectRetina: false,
    attribution: 'Tiles © Esri'
  }).addTo(map);

  map.__chaikaLightLabels = L.tileLayer(LABELS, {
    maxZoom: 20,
    maxNativeZoom: 16,
    detectRetina: false,
    attribution: 'Labels © Esri'
  }).addTo(map);
})();
