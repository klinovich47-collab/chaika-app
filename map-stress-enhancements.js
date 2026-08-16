/* CHAIKA map UX + clustering + hidden stress-test mode (rev8). */
(() => {
  const MAP_CLUSTER_MAX_METERS = 130;

  function chaikaInjectMapRev8Styles() {
    if (document.getElementById('chaikaMapRev8Styles')) return;
    const style = document.createElement('style');
    style.id = 'chaikaMapRev8Styles';
    style.textContent = `
      .leaflet-tile-pane{filter:saturate(.78) contrast(1.05) brightness(.92)}
      .chaika-group-marker{transition:transform .16s ease,box-shadow .16s ease}
      .chaika-group-marker:hover{transform:scale(1.05)}
      .chaika-group-marker.premium,.premium-marker{animation:chaikaPremiumGlow 1.75s ease-in-out infinite!important}
      @keyframes chaikaPremiumGlow{0%,100%{transform:scale(1);box-shadow:0 0 0 2px rgba(216,255,67,.18),0 0 18px rgba(216,255,67,.34),0 8px 24px rgba(0,0,0,.48)}50%{transform:scale(1.07);box-shadow:0 0 0 5px rgba(216,255,67,.10),0 0 30px rgba(216,255,67,.62),0 10px 30px rgba(0,0,0,.58)}}
      .chaika-location-confirm{position:absolute;z-index:1600;left:12px;right:12px;bottom:20px;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:11px 12px;border:1px solid #3a3a42;border-radius:17px;background:rgba(17,17,21,.96);box-shadow:0 18px 45px #0009;backdrop-filter:blur(18px)}
      .chaika-location-confirm strong{min-width:0;font-size:13px;line-height:1.2}.chaika-location-confirm button{border:0;border-radius:11px;min-width:54px;padding:9px 12px;font-size:12px;font-weight:800}.chaika-location-confirm .yes{background:#d8ff43;color:#111207}.chaika-location-confirm .no{background:#2a2a31;color:#fff}
      .chaika-location-confirm-open .chaika-support-fab{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:scale(.86)!important}
      .chaika-stress-badge{position:absolute;z-index:1100;top:10px;left:10px;max-width:calc(100% - 70px);padding:8px 10px;border-radius:12px;background:rgba(11,11,13,.9);border:1px solid #45452e;color:#d8ff43;font:800 10px/1.25 system-ui;letter-spacing:.03em;pointer-events:none;box-shadow:0 8px 24px #0007}
    `;
    document.head.appendChild(style);
  }

  function chaikaUseDarkMapTiles() {
    if (!window.L || typeof map === 'undefined') return;
    let removed = false;
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
        removed = true;
      }
    });
    if (!removed && map.__chaikaDarkTiles) return;
    map.__chaikaDarkTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 20,
        detectRetina: true,
        attribution: '© OpenStreetMap contributors © CARTO'
      }
    ).addTo(map);
  }

  function chaikaClusterConfig() {
    const zoom = map.getZoom();
    if (zoom >= 18) return { px: 32, meters: 38 };
    if (zoom >= 16) return { px: 38, meters: 70 };
    if (zoom >= 14) return { px: 43, meters: 105 };
    return { px: 46, meters: MAP_CLUSTER_MAX_METERS };
  }

  function chaikaClusterSort(a, b) {
    return Number(b.promoted) - Number(a.promoted) || parseEventDate(a) - parseEventDate(b);
  }

  chaikaGroupEvents = function(list) {
    const sorted = [...list].sort(chaikaClusterSort);
    const zoom = map.getZoom();
    const cfg = chaikaClusterConfig();
    const cell = cfg.px;
    const buckets = new Map();
    const groups = [];

    const bucketKey = (x, y) => `${x}:${y}`;
    const put = (index, x, y) => {
      const key = bucketKey(x, y);
      const arr = buckets.get(key) || [];
      arr.push(index);
      buckets.set(key, arr);
    };

    for (const event of sorted) {
      const point = map.project([event.lat, event.lng], zoom);
      const cx = Math.floor(point.x / cell);
      const cy = Math.floor(point.y / cell);
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const candidates = buckets.get(bucketKey(cx + dx, cy + dy)) || [];
          for (const index of candidates) {
            const group = groups[index];
            const pxDistance = Math.hypot(point.x - group.anchorPoint.x, point.y - group.anchorPoint.y);
            if (pxDistance > cfg.px || pxDistance >= bestDistance) continue;
            const meterDistance = kmBetween([event.lat, event.lng], [group.anchor.lat, group.anchor.lng]) * 1000;
            if (meterDistance > cfg.meters) continue;
            bestIndex = index;
            bestDistance = pxDistance;
          }
        }
      }

      if (bestIndex >= 0) {
        groups[bestIndex].events.push(event);
      } else {
        const index = groups.length;
        groups.push({ events: [event], anchor: event, anchorPoint: point });
        put(index, cx, cy);
      }
    }

    return groups.map(group => group.events.sort(chaikaClusterSort));
  };

  chaikaGroupMarkerIcon = function(group) {
    if (group.length === 1) return markerIcon(group[0]);
    const top = group[0];
    const cat = categoryMap[top.category] || categoryMap.other;
    const color = categoryColors[top.category] || categoryColors.other;
    const premium = group.some(event => event.promoted);
    const growth = Math.min(27, Math.round(Math.log2(Math.max(2, group.length)) * 7));
    const size = 42 + growth + (premium ? 4 : 0);
    const iconSize = Math.max(19, Math.min(25, Math.round(size * .43)));
    const countSize = group.length >= 100 ? 25 : 22;
    return L.divIcon({
      className: '',
      html: `<div class="chaika-group-marker ${premium ? 'premium' : ''}" style="--cat-color:${color};width:${size}px;height:${size}px"><span style="display:grid;place-items:center;width:${iconSize}px;height:${iconSize}px">${svgIcon(cat.icon)}</span><span class="chaika-group-count" style="min-width:${countSize}px;height:${countSize}px;line-height:${countSize - 4}px">${group.length}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  renderMap = function() {
    state.markers.forEach(marker => map.removeLayer(marker));
    state.markers = [];
    const list = filteredEvents();
    els.empty.classList.toggle('hidden', list.length > 0);
    const groups = chaikaGroupEvents(list);
    groups.forEach(group => {
      const top = group[0];
      const marker = L.marker([top.lat, top.lng], {
        icon: chaikaGroupMarkerIcon(group),
        bubblingMouseEvents: false,
        zIndexOffset: group.some(event => event.promoted) ? 600 : Math.min(400, group.length * 8)
      }).addTo(map);
      marker.on('click', () => chaikaShowEventGroup(group));
      state.markers.push(marker);
    });
    renderFeed();
    if (window.CHAIKA_STRESS?.enabled) window.CHAIKA_STRESS.updateBadge(groups.length);
  };

  if (!map.__chaikaClusterZoomListener) {
    map.__chaikaClusterZoomListener = true;
    map.on('zoomend', () => renderMap());
  }

  function chaikaInstallLongPressPlacement() {
    const container = map.getContainer();
    if (container.dataset.chaikaLongPress === '1') return;
    container.dataset.chaikaLongPress = '1';

    let timer = null;
    let start = null;
    let suppressClick = false;
    let previewMarker = null;
    let pendingLatLng = null;

    const clearTimer = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      start = null;
    };

    const clearPreview = () => {
      if (previewMarker) map.removeLayer(previewMarker);
      previewMarker = null;
      pendingLatLng = null;
      document.getElementById('chaikaLocationConfirm')?.remove();
      document.documentElement.classList.remove('chaika-location-confirm-open');
    };

    const ask = latlng => {
      clearPreview();
      pendingLatLng = latlng;
      previewMarker = L.circleMarker(latlng, {
        radius: 10,
        color: '#d8ff43',
        fillColor: '#d8ff43',
        fillOpacity: .25,
        weight: 3,
        interactive: false
      }).addTo(map);
      const box = document.createElement('div');
      box.id = 'chaikaLocationConfirm';
      box.className = 'chaika-location-confirm';
      box.innerHTML = `<strong>${chaikaPickingLocation?'Поставить точку здесь?':'Создать событие?'}</strong><button class="no" type="button">Нет</button><button class="yes" type="button">Да</button>`;
      document.getElementById('mapView').appendChild(box);
      document.documentElement.classList.add('chaika-location-confirm-open');
      box.querySelector('.no').onclick = clearPreview;
      box.querySelector('.yes').onclick = () => {
        const point = pendingLatLng;
        clearPreview();
        if (!point) return;
        window.chaikaSetMapCreatorType?.('people');
        chaikaSetChosenPoint(point.lat, point.lng, true);
        tg?.HapticFeedback?.notificationOccurred?.('success');
      };
    };

    container.addEventListener('pointerdown', event => {
      if (event.button > 0) return;
      if (event.target.closest('.leaflet-marker-icon,.leaflet-control,button,input,select,textarea')) return;
      start = { x: event.clientX, y: event.clientY };
      timer = setTimeout(() => {
        if (!start) return;
        const rect = container.getBoundingClientRect();
        const point = L.point(start.x - rect.left, start.y - rect.top);
        const latlng = map.containerPointToLatLng(point);
        suppressClick = true;
        ask(latlng);
        tg?.HapticFeedback?.impactOccurred?.('medium');
      }, 580);
    }, { passive: true });

    container.addEventListener('pointermove', event => {
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 11) clearTimer();
    }, { passive: true });
    container.addEventListener('pointerup', clearTimer, { passive: true });
    container.addEventListener('pointercancel', clearTimer, { passive: true });
    container.addEventListener('pointerleave', clearTimer, { passive: true });
    container.addEventListener('click', event => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    const note = document.getElementById('chaikaLocationNote');
    if (note) note.textContent = 'Можно ткнуть точку на карте или удерживать место ~0,6 сек и подтвердить установку.';
  }

  function stressRng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function makeStressEvents(count) {
    const rand = stressRng(470047);
    const centers = Array.from({ length: 36 }, (_, i) => ({
      lat: 59.9343 + (rand() - .5) * .16,
      lng: 30.3351 + (rand() - .5) * .25,
      category: iconCategories[i % iconCategories.length][0]
    }));
    const now = dateISO(0);
    return Array.from({ length: count }, (_, i) => {
      const center = centers[i % centers.length];
      const dense = i % 5 !== 0;
      const spread = dense ? .00034 : .0016;
      return {
        id: `stress_${i}`,
        title: `STRESS событие ${i + 1}`,
        category: center.category,
        date: now,
        time: `${String(10 + (i % 13)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
        price: i % 4 === 0 ? 500 : 0,
        venue: `Тестовая точка ${i % centers.length + 1}`,
        lat: center.lat + (rand() - .5) * spread,
        lng: center.lng + (rand() - .5) * spread,
        ageLimit: i % 3 === 0 ? 18 : 0,
        promoted: i % 17 === 0,
        description: 'Синтетическое событие для скрытого стресс-теста карты.',
        going: i % 91,
        owner: false,
        type: 'planned'
      };
    });
  }

  const stress = {
    enabled: false,
    count: 0,
    originalEvents: null,
    originalTime: null,
    lastMs: 0,
    enable(count = 1200) {
      const safeCount = Math.max(100, Math.min(5000, Number(count) || 1200));
      if (!this.originalEvents) { this.originalEvents = state.events; this.originalTime = state.time; }
      const events = makeStressEvents(safeCount);
      const started = performance.now();
      state.events = events;
      state.time = 'today';
      this.enabled = true;
      this.count = safeCount;
      renderMap();
      this.lastMs = performance.now() - started;
      this.updateBadge(state.markers.length);
      console.info(`[CHAIKA STRESS] ${safeCount} events -> ${state.markers.length} markers in ${this.lastMs.toFixed(1)} ms`);
      return { events: safeCount, markers: state.markers.length, renderMs: Number(this.lastMs.toFixed(1)) };
    },
    disable() {
      if (this.originalEvents) state.events = this.originalEvents;
      this.originalEvents = null;
      if (this.originalTime) state.time = this.originalTime;
      this.originalTime = null;
      this.enabled = false;
      document.getElementById('chaikaStressBadge')?.remove();
      renderMap();
    },
    benchmark(count = 2000, rounds = 5) {
      const events = makeStressEvents(Math.max(100, Math.min(5000, Number(count) || 2000)));
      const timings = [];
      for (let i = 0; i < Math.max(1, Math.min(20, rounds)); i++) {
        const started = performance.now();
        chaikaGroupEvents(events);
        timings.push(performance.now() - started);
      }
      const avg = timings.reduce((sum, value) => sum + value, 0) / timings.length;
      const result = { events: events.length, rounds: timings.length, avgClusterMs: Number(avg.toFixed(2)), maxClusterMs: Number(Math.max(...timings).toFixed(2)) };
      console.table(result);
      return result;
    },
    updateBadge(markers) {
      if (!this.enabled) return;
      let badge = document.getElementById('chaikaStressBadge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'chaikaStressBadge';
        badge.className = 'chaika-stress-badge';
        document.getElementById('mapView').appendChild(badge);
      }
      badge.textContent = `STRESS · ${this.count} событий · ${markers} маркеров · ${this.lastMs.toFixed(1)} ms`;
    }
  };
  window.CHAIKA_STRESS = stress;

  chaikaInjectMapRev8Styles();
  chaikaUseDarkMapTiles();
  chaikaInstallLongPressPlacement();
  renderMap();

  const params = new URLSearchParams(location.search);
  if (params.get('stress') === '1') {
    const count = params.get('stressCount') || 1500;
    setTimeout(() => stress.enable(count), 350);
    setTimeout(() => { if (stress.enabled) stress.enable(count); }, 1600);
  }
})();
