/* CHAIKA light UI + hierarchical clustering + scrollable cluster sheet (rev10). */
(() => {
  if (!window.L || typeof map === 'undefined') return;

  const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  function injectLightUiStyles() {
    if (document.getElementById('chaikaLightUiRev10Styles')) return;
    const style = document.createElement('style');
    style.id = 'chaikaLightUiRev10Styles';
    style.textContent = `
      :root{--bg:#f5f6f1;--card:#ffffff;--card2:#f0f2ec;--card3:#e7eae2;--text:#111315;--muted:#777b73;--accent:#d8ff43;--accentText:#101207;--danger:#e74d5c;--warning:#d99b25}
      html,body{background:var(--bg)!important;color:var(--text)!important}
      body{color-scheme:light}
      #app{background:var(--bg)}
      .topbar{background:rgba(255,255,255,.94);border-bottom:1px solid #e7e9e2;backdrop-filter:blur(18px)}
      .brand-mark{background:#111315!important;box-shadow:0 5px 18px rgba(17,19,21,.12)}
      .eyebrow,.muted,.event-meta,.feed-card p,.concert-meta,.helper,.form-note,.profile-card p,.chaika-location-note{color:var(--muted)!important}
      .icon-btn,.search-wrap,.chip,.feed-card,.concert-card,.form-card,.profile-card,.stats-grid div,.moderation-card,.chaika-profile-section,.chaika-manage-item{background:#fff!important;border-color:#e1e4dc!important;color:var(--text)!important;box-shadow:0 7px 24px rgba(26,31,24,.055)}
      .search-wrap input,.chip,.filter-btn,.icon-btn{color:var(--text)!important}
      .search-wrap input::placeholder{color:#9a9e96!important}
      .filter-btn{border-left-color:#e4e6df!important}
      .chip.active,.primary-btn,.concert-bottom button,.badge,.create-circle{background:var(--accent)!important;color:var(--accentText)!important;border-color:var(--accent)!important}
      .secondary-btn,.mini-actions button,.chaika-manage-actions button,.segmented,.seg-btn.active{background:#eef0ea!important;color:var(--text)!important;border-color:#dfe2da!important}
      .seg-btn{color:#7b7f77!important}.seg-btn.active{color:#111315!important}
      input,select,textarea,.date-shell{background:#fff!important;color:var(--text)!important;border-color:#d9ddd4!important}
      input:focus,select:focus,textarea:focus,.date-shell:focus-within{border-color:#9ebd24!important;box-shadow:0 0 0 3px rgba(216,255,67,.22)}
      .field-label,label{color:#353934!important}
      .icon-choice,.category-filter{background:#fff!important;color:#30342f!important;border-color:#dde0d8!important}
      .icon-choice.active,.category-filter.active{background:#f6ffd8!important;border-color:#a9c92f!important;color:#6f8615!important}
      .bottom-nav{background:rgba(255,255,255,.96)!important;border-top-color:#e1e4dc!important;box-shadow:0 -8px 28px rgba(25,30,23,.06)}
      .nav-item{color:#858a82!important}.nav-item.active{color:#111315!important}
      .leaflet-tile-pane{filter:saturate(.86) contrast(.98) brightness(1.025)!important}
      #map{background:#edf0e8!important}
      .leaflet-control-attribution{background:rgba(255,255,255,.82)!important;color:#777!important}
      .leaflet-control-attribution a{color:#555!important}
      .leaflet-control-zoom{border:0!important;box-shadow:0 6px 22px rgba(31,35,29,.12)!important}
      .leaflet-control-zoom a{background:#fff!important;color:#151715!important;border-color:#e1e4dc!important}
      .regular-marker{background:#fff!important;color:var(--cat-color)!important;border:2px solid var(--cat-color)!important;box-shadow:0 6px 18px rgba(19,24,17,.18)!important}
      .premium-marker{background:var(--accent)!important;color:#111315!important;border:3px solid #fff!important}
      .chaika-group-marker{background:#fff!important;color:var(--cat-color,#111)!important;border:3px solid var(--cat-color,#111)!important;box-shadow:0 7px 24px rgba(17,23,15,.18)!important}
      .chaika-group-marker.premium{background:#f7ffd9!important;border-color:#9fbe24!important;color:#53660d!important}
      .chaika-group-count{background:#111315!important;color:#fff!important;border-color:#fff!important;box-shadow:0 3px 10px rgba(0,0,0,.14)}
      .chaika-group-marker.premium .chaika-group-count{background:var(--accent)!important;color:#111315!important}
      .event-sheet{background:rgba(255,255,255,.97)!important;border-color:#dfe3da!important;color:var(--text)!important;box-shadow:0 18px 48px rgba(30,35,28,.18)!important}
      .event-type-icon,.activity-icon{background:#f0f2ec!important}
      .chaika-group-open{padding:0!important;overflow:hidden!important;max-height:min(68dvh,590px)!important}
      .chaika-group-sheet{display:flex!important;flex-direction:column;gap:0;max-height:min(68dvh,590px);min-height:0}
      .chaika-group-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 14px 11px;background:rgba(255,255,255,.98);border-bottom:1px solid #eceee8}
      .chaika-group-head-main{min-width:0}.chaika-group-head h3{margin:0;color:#111315;font-size:17px}.chaika-group-head .muted{display:block;margin-top:3px;font-size:11px}
      .chaika-group-list{min-height:0;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch;padding:10px 10px calc(12px + env(safe-area-inset-bottom,0px));display:grid;gap:8px;scrollbar-width:thin;scrollbar-color:#cdd1c7 transparent}
      .chaika-group-list::-webkit-scrollbar{width:5px}.chaika-group-list::-webkit-scrollbar-thumb{background:#cdd1c7;border-radius:999px}
      .chaika-group-event{background:#f8f9f6!important;color:#111315!important;border:1px solid #e2e5dd!important;border-radius:16px!important;box-shadow:none!important;touch-action:manipulation}
      .chaika-group-event:active{transform:scale(.99);background:#f0f2ec!important}
      .chaika-group-event p{color:#777b73!important}.chaika-group-chevron{color:#8b9087!important}
      .modal-backdrop{background:rgba(35,39,33,.28)!important}.modal-card{background:#fff!important;border-color:#e1e4dc!important;color:#111315!important}
      .modal-close{background:#eef0ea!important;color:#111315!important}
      .event-detail-view{background:#f5f6f1!important;color:#111315!important}.event-detail-body{background:#fff!important;color:#111315!important}
      .chaika-location-confirm{background:rgba(255,255,255,.97)!important;border-color:#dfe3da!important;color:#111315!important;box-shadow:0 18px 45px rgba(25,30,23,.18)!important}
      .chaika-location-confirm .no{background:#eef0ea!important;color:#111315!important}.chaika-location-confirm .yes{background:var(--accent)!important;color:#111315!important}
      .chaika-stress-badge{background:rgba(255,255,255,.94)!important;border-color:#dfe3da!important;color:#53660d!important;box-shadow:0 8px 24px rgba(30,35,28,.12)!important}
      .chaika-chat-action{background:#eef0ea!important;color:#111315!important;border-color:#dfe2da!important}
      .chaika-forum-status{background:#f5f6f1!important;border-color:#dde1d7!important;color:#72776e!important}.chaika-forum-status.ok{border-color:#b7ce58!important;color:#607515!important}
      .chaika-forum-steps{color:#777b73!important}
      .toast{background:#111315!important;color:#fff!important}
      .empty-state{background:#fff!important;color:#777b73!important;border:1px solid #e1e4dc;box-shadow:0 10px 28px rgba(25,30,23,.10)}
      @keyframes chaikaLightPremiumGlow{0%,100%{transform:scale(1);box-shadow:0 0 0 2px rgba(176,210,46,.18),0 0 16px rgba(177,215,37,.34),0 7px 22px rgba(17,23,15,.16)}50%{transform:scale(1.07);box-shadow:0 0 0 6px rgba(188,224,46,.15),0 0 28px rgba(177,215,37,.52),0 9px 26px rgba(17,23,15,.18)}}
      .chaika-group-marker.premium,.premium-marker{animation:chaikaLightPremiumGlow 1.8s ease-in-out infinite!important}
    `;
    document.head.appendChild(style);
  }

  function useLightMapTiles() {
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    map.__chaikaLightTiles = L.tileLayer(LIGHT_TILE_URL, {
      subdomains: 'abcd',
      maxZoom: 20,
      detectRetina: true,
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);
  }

  function clusterRadiusPx(zoom) {
    if (zoom >= 18) return 34;
    if (zoom === 17) return 40;
    if (zoom === 16) return 48;
    if (zoom === 15) return 58;
    if (zoom === 14) return 70;
    if (zoom === 13) return 82;
    if (zoom === 12) return 96;
    return 116;
  }

  function clusterSort(a, b) {
    return Number(b.promoted) - Number(a.promoted) || parseEventDate(a) - parseEventDate(b);
  }

  function attachCenter(events, lat, lng) {
    Object.defineProperty(events, '__chaikaCenter', {
      value: { lat, lng }, configurable: true, enumerable: false, writable: true
    });
    return events;
  }

  chaikaGroupEvents = function(list) {
    const sorted = [...list].sort(clusterSort);
    if (!sorted.length) return [];
    const zoom = map.getZoom();

    // At a very distant city/world view the whole visible event set becomes one clear cluster.
    if (zoom <= 10) {
      const sum = sorted.reduce((acc, event) => {
        acc.lat += Number(event.lat);
        acc.lng += Number(event.lng);
        return acc;
      }, { lat: 0, lng: 0 });
      return [attachCenter(sorted, sum.lat / sorted.length, sum.lng / sorted.length)];
    }

    const radius = clusterRadiusPx(zoom);
    const cell = radius;
    const buckets = new Map();
    const groups = [];
    const bucketKey = (x, y) => `${x}:${y}`;
    const addBucket = (groupIndex, x, y) => {
      const key = bucketKey(x, y);
      const group = groups[groupIndex];
      if (group.bucketKeys.has(key)) return;
      group.bucketKeys.add(key);
      const listForCell = buckets.get(key) || [];
      listForCell.push(groupIndex);
      buckets.set(key, listForCell);
    };

    for (const event of sorted) {
      const lat = Number(event.lat);
      const lng = Number(event.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const point = map.project([lat, lng], zoom);
      const cx = Math.floor(point.x / cell);
      const cy = Math.floor(point.y / cell);
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const candidates = buckets.get(bucketKey(cx + dx, cy + dy)) || [];
          for (const index of candidates) {
            const group = groups[index];
            const distance = Math.hypot(point.x - group.centerX, point.y - group.centerY);
            if (distance <= radius && distance < bestDistance) {
              bestIndex = index;
              bestDistance = distance;
            }
          }
        }
      }

      if (bestIndex < 0) {
        const index = groups.length;
        groups.push({
          events: [event], count: 1,
          sumLat: lat, sumLng: lng,
          sumX: point.x, sumY: point.y,
          centerX: point.x, centerY: point.y,
          bucketKeys: new Set()
        });
        addBucket(index, cx, cy);
        continue;
      }

      const group = groups[bestIndex];
      group.events.push(event);
      group.count += 1;
      group.sumLat += lat;
      group.sumLng += lng;
      group.sumX += point.x;
      group.sumY += point.y;
      group.centerX = group.sumX / group.count;
      group.centerY = group.sumY / group.count;
      addBucket(bestIndex, Math.floor(group.centerX / cell), Math.floor(group.centerY / cell));
    }

    return groups.map(group => {
      const events = group.events.sort(clusterSort);
      return attachCenter(events, group.sumLat / group.count, group.sumLng / group.count);
    });
  };

  chaikaGroupMarkerIcon = function(group) {
    if (group.length === 1) return markerIcon(group[0]);
    const top = group[0];
    const cat = categoryMap[top.category] || categoryMap.other;
    const color = categoryColors[top.category] || categoryColors.other;
    const premium = group.some(event => event.promoted);
    const zoomBoost = map.getZoom() <= 10 ? 14 : map.getZoom() <= 12 ? 7 : 0;
    const growth = Math.min(30, Math.round(Math.log2(Math.max(2, group.length)) * 6.5));
    const size = Math.min(88, 44 + growth + zoomBoost + (premium ? 3 : 0));
    const iconSize = Math.max(19, Math.min(27, Math.round(size * .38)));
    const countSize = group.length >= 100 ? 28 : 23;
    return L.divIcon({
      className: '',
      html: `<div class="chaika-group-marker ${premium ? 'premium' : ''}" style="--cat-color:${color};width:${size}px;height:${size}px"><span style="display:grid;place-items:center;width:${iconSize}px;height:${iconSize}px">${svgIcon(cat.icon)}</span><span class="chaika-group-count" style="min-width:${countSize}px;height:${countSize}px;line-height:${countSize - 4}px">${group.length}</span></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  chaikaShowEventGroup = function(group) {
    if (!group?.length) return;
    if (group.length === 1) {
      els.sheet.classList.remove('chaika-group-open');
      return showEvent(group[0].id);
    }

    state.selectedId = null;
    const center = group.__chaikaCenter || { lat: group[0].lat, lng: group[0].lng };
    map.panTo([center.lat, center.lng], { animate: true });
    els.sheet.classList.add('chaika-group-open');
    els.sheet.innerHTML = `
      <div class="chaika-group-sheet">
        <div class="chaika-group-head">
          <div class="chaika-group-head-main"><h3>${group.length} событий</h3><span class="muted">Премиум выше · листай список</span></div>
        </div>
        <div class="chaika-group-list">
          ${group.map(event => {
            const cat = categoryMap[event.category] || categoryMap.other;
            return `<button class="chaika-group-event" data-group-event="${event.id}" type="button"><div class="event-type-icon" ${catStyle(event.category)}>${svgIcon(cat.icon)}</div><div>${event.promoted ? '<span class="badge">ПРЕМИУМ</span>' : ''}<h4>${escapeHtml(event.title)}</h4><p>${eventListMeta(event)}</p></div><span class="chaika-group-chevron">›</span></button>`;
          }).join('')}
        </div>
      </div>`;
    els.sheet.classList.remove('hidden');

    const listEl = els.sheet.querySelector('.chaika-group-list');
    if (listEl) {
      listEl.scrollTop = 0;
      L.DomEvent.disableClickPropagation(listEl);
      L.DomEvent.disableScrollPropagation(listEl);
    }
    L.DomEvent.disableClickPropagation(els.sheet);
    L.DomEvent.disableScrollPropagation(els.sheet);

    els.sheet.querySelectorAll('[data-group-event]').forEach(button => {
      button.addEventListener('click', () => {
        els.sheet.classList.remove('chaika-group-open');
        showEvent(button.dataset.groupEvent);
      });
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
      const center = group.__chaikaCenter || { lat: top.lat, lng: top.lng };
      const marker = L.marker([center.lat, center.lng], {
        icon: chaikaGroupMarkerIcon(group),
        bubblingMouseEvents: false,
        zIndexOffset: group.some(event => event.promoted) ? 700 : Math.min(500, group.length * 9)
      }).addTo(map);
      marker.on('click', () => chaikaShowEventGroup(group));
      state.markers.push(marker);
    });
    renderFeed();
    if (window.CHAIKA_STRESS?.enabled) window.CHAIKA_STRESS.updateBadge(groups.length);
  };

  injectLightUiStyles();
  useLightMapTiles();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f5f6f1');
  try {
    tg?.setHeaderColor?.('#f5f6f1');
    tg?.setBackgroundColor?.('#f5f6f1');
  } catch (_) {}
  renderMap();
})();
