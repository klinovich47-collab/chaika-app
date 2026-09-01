/* CHAIKA basemap hotfix — reliable light street map for Telegram WebView. */
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

  let fallbackInstalled = false;
  let tileErrors = 0;

  const installFallback = () => {
    if (fallbackInstalled) return;
    fallbackInstalled = true;
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    const fallback = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      maxNativeZoom: 19,
      detectRetina: false,
      updateWhenIdle: false,
      keepBuffer: 4,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    fallback.bringToBack?.();
    map.__chaikaLightTiles = fallback;
  };

  const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 20,
    maxNativeZoom: 19,
    detectRetina: false,
    updateWhenIdle: false,
    keepBuffer: 4,
    attribution: 'Tiles © Esri · © OpenStreetMap contributors'
  });

  tiles.on('tileerror', () => {
    tileErrors += 1;
    if (tileErrors >= 4) installFallback();
  });

  tiles.addTo(map);
  tiles.bringToBack?.();
  map.__chaikaLightTiles = tiles;
  [0, 150, 500].forEach(delay => setTimeout(() => map.invalidateSize(false), delay));
})();
