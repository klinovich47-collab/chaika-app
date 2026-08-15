/* CHAIKA museums/exhibitions tab with live imported events (rev21). */
(() => {
  if (!document.body || typeof state === 'undefined') return;

  try { categoryMap.museum = { label:'Музеи', icon:'i-art' }; } catch (_) {}
  try { categoryColors.museum = '#d79bff'; } catch (_) {}

  const style = document.createElement('style');
  style.id = 'chaikaMuseumsRev21Style';
  style.textContent = `
    .bottom-nav.chaika-six-nav{grid-template-columns:repeat(6,1fr)!important;padding-left:4px!important;padding-right:4px!important}
    .bottom-nav.chaika-six-nav .nav-item{font-size:8px!important;min-width:0}
    .bottom-nav.chaika-six-nav .nav-item>svg{width:19px;height:19px}
    .chaika-museum-head{padding:10px 0 14px}.chaika-museum-head h2{margin:0;font-size:22px}.chaika-museum-head p{margin:5px 0 0;color:#97979f;font-size:12px;line-height:1.45}
    .chaika-museum-list{display:grid;gap:12px;padding-bottom:26px}
    .chaika-museum-card{overflow:hidden;border:1px solid #2b2b33;border-radius:20px;background:#17171b;color:#fff}
    .chaika-museum-image{height:184px;background:#222229;position:relative;overflow:hidden;display:flex;align-items:flex-end}
    .chaika-museum-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
    .chaika-museum-image:after{content:'';position:absolute;inset:35% 0 0;background:linear-gradient(transparent,rgba(10,10,12,.84))}
    .chaika-museum-image-fallback{position:absolute;inset:0;display:grid;place-items:center;font-size:54px;color:#d8ff43;background:linear-gradient(135deg,#25252d,#121216)}
    .chaika-museum-image .badge{position:relative;z-index:2;margin:0 14px 12px}
    .chaika-museum-body{padding:14px}.chaika-museum-body h3{margin:0 0 7px;font-size:18px;line-height:1.2}
    .chaika-museum-meta{color:#a0a0aa;font-size:12px;line-height:1.45}.chaika-museum-desc{color:#c3c3ca;font-size:12px;line-height:1.5;margin:10px 0 0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .chaika-museum-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.chaika-museum-actions button{border-radius:13px;padding:11px 10px;font-weight:800;border:1px solid #34343d;background:#202026;color:#fff}.chaika-museum-actions .primary{background:#d8ff43;color:#111207;border-color:#d8ff43}
    .chaika-museum-empty{padding:28px 16px;text-align:center;color:#97979f;background:#17171b;border:1px solid #2b2b33;border-radius:18px;line-height:1.5}
  `;
  document.head.appendChild(style);

  const main = document.querySelector('main');
  const nav = document.querySelector('.bottom-nav');
  if (!main || !nav || document.getElementById('museumsView')) return;

  const view = document.createElement('section');
  view.id = 'museumsView';
  view.className = 'view scroll-view';
  view.innerHTML = `<div class="chaika-museum-head"><h2>Музеи</h2><p>Актуальные выставки и экспозиции Санкт-Петербурга. Афиша обновляется автоматически.</p></div><div id="chaikaMuseumList" class="chaika-museum-list"></div>`;
  main.appendChild(view);

  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.type = 'button';
  btn.dataset.view = 'museumsView';
  btn.setAttribute('aria-label','Музеи');
  btn.innerHTML = `${typeof svgIcon==='function' ? svgIcon('i-art') : '<span>◫</span>'}<span>Музеи</span>`;
  const concertsBtn = nav.querySelector('[data-view="concertsView"]');
  if (concertsBtn?.nextSibling) nav.insertBefore(btn, concertsBtn.nextSibling); else nav.appendChild(btn);
  nav.classList.add('chaika-six-nav');

  function museumRows(){
    return (state.events || [])
      .filter(e => e.category === 'museum')
      .sort((a,b) => parseEventDate(a) - parseEventDate(b));
  }

  function museumDate(e){
    const start = parseEventDate(e);
    const now = new Date();
    const sameDay = start.toDateString() === now.toDateString();
    const label = sameDay ? 'Сегодня' : start.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
    const until = e.expiresAt ? new Date(e.expiresAt) : null;
    if (until && until > now && until.getTime() - start.getTime() > 12*60*60*1000) {
      return `До ${until.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}`;
    }
    return `${label}, ${e.time || ''}`.replace(/,\s*$/,'');
  }

  function renderMuseums(){
    const list = document.getElementById('chaikaMuseumList');
    if (!list) return;
    const rows = museumRows();
    if (!rows.length) {
      list.innerHTML = '<div class="chaika-museum-empty">Пока нет загруженных музейных выставок. Афиша обновляется автоматически каждый час.</div>';
      return;
    }
    list.innerHTML = rows.map(e => {
      const image = e.imageData ? `<img src="${escapeHtml(e.imageData)}" alt="Афиша: ${escapeHtml(e.title)}" loading="lazy">` : '<div class="chaika-museum-image-fallback">◫</div>';
      return `<article class="chaika-museum-card">
        <div class="chaika-museum-image">${image}<span class="badge">ВЫСТАВКА</span></div>
        <div class="chaika-museum-body">
          <h3>${escapeHtml(e.title)}</h3>
          <div class="chaika-museum-meta">${museumDate(e)} · ${e.price ? e.price+' ₽' : 'Цена на странице'}<br>${escapeHtml(e.venue || 'Санкт-Петербург')}</div>
          ${e.description ? `<p class="chaika-museum-desc">${escapeHtml(e.description)}</p>` : ''}
          <div class="chaika-museum-actions">
            <button type="button" data-museum-map="${e.id}">На карте</button>
            <button type="button" class="primary" data-museum-open="${e.id}">${e.ticketUrl ? 'Подробнее ↗' : 'Открыть'}</button>
          </div>
        </div>
      </article>`;
    }).join('');
    list.querySelectorAll('[data-museum-map]').forEach(b => b.onclick = () => {
      const e = state.events.find(x => x.id === b.dataset.museumMap); if (!e) return;
      switchView('mapView'); setTimeout(() => { map.setView([e.lat,e.lng],14); showEvent(e.id); }, 80);
    });
    list.querySelectorAll('[data-museum-open]').forEach(b => b.onclick = () => {
      const e = state.events.find(x => x.id === b.dataset.museumOpen); if (!e) return;
      if (e.ticketUrl) { if (tg?.openLink) tg.openLink(e.ticketUrl); else window.open(e.ticketUrl,'_blank'); }
      else { switchView('mapView'); setTimeout(() => showEvent(e.id),80); }
    });
  }

  btn.addEventListener('click', () => { switchView('museumsView'); renderMuseums(); });

  const originalLoadEvents = typeof chaikaLoadEvents === 'function' ? chaikaLoadEvents : null;
  if (originalLoadEvents) {
    chaikaLoadEvents = async function(...args){ const result = await originalLoadEvents(...args); if (document.getElementById('museumsView')?.classList.contains('active-view')) renderMuseums(); return result; };
  }

  window.chaikaRenderMuseums = renderMuseums;
})();