/* CHAIKA rev47 — clean keyless basemap for investor demo. */
(() => {
  if (!window.L || typeof map === 'undefined') return;

  const styleId = 'chaikaBasemapRev47Styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .leaflet-tile-pane{filter:saturate(.58) contrast(.93) brightness(1.07)!important}
      #map{background:#eef0e8!important}
      .leaflet-control-attribution{font-size:9px!important;line-height:1.15!important;padding:2px 5px!important;background:rgba(255,255,255,.78)!important}
    `;
    document.head.appendChild(style);
  }

  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer);
  });

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    maxNativeZoom: 19,
    detectRetina: true,
    updateWhenIdle: true,
    keepBuffer: 4,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);

  tiles.bringToBack?.();
  map.__chaikaLightTiles = tiles;
  setTimeout(() => map.invalidateSize(false), 0);
})();
