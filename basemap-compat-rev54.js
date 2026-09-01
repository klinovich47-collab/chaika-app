/* CHAIKA rev55 — colorful street basemap only. App behavior remains untouched. */
(() => {
  if (!window.L || typeof map === 'undefined') return;

  const STREET = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });

  map.__chaikaLightTiles = L.tileLayer(STREET, {
    maxZoom: 20,
    maxNativeZoom: 19,
    detectRetina: false,
    attribution: 'Tiles © Esri'
  }).addTo(map);
})();
