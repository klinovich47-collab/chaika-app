/* CHAIKA rev48 — prevent every legacy CARTO tile request before it reaches the network. */
(() => {
  if (!window.L || typeof L.tileLayer !== 'function') return;
  const originalTileLayer = L.tileLayer.bind(L);
  L.tileLayer = function(url, options = {}) {
    const value = String(url || '');
    if (/cartocdn\.com/i.test(value)) {
      return originalTileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        ...options,
        subdomains: undefined,
        maxZoom: 20,
        maxNativeZoom: 19,
        detectRetina: true,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      });
    }
    return originalTileLayer(url, options);
  };
})();
