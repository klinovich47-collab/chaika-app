/* CHAIKA premium dark shell over the light map (rev11). */
(() => {
  const style = document.createElement('style');
  style.id = 'chaikaDarkShellRev11';
  style.textContent = `
    :root{--bg:#0b0b0d;--card:#17171b;--card2:#202026;--card3:#27272f;--text:#f7f7f8;--muted:#97979f;--accent:#d8ff43;--accentText:#111207;--danger:#ff5c67;--warning:#ffca55}
    html,body{background:#0b0b0d!important;color:#f7f7f8!important;color-scheme:dark}
    #app{background:#0b0b0d!important}
    .topbar{background:rgba(11,11,13,.97)!important;border-bottom:1px solid #25252c!important;backdrop-filter:blur(20px)!important}
    .brand-mark{background:#050506!important;box-shadow:none!important}
    .eyebrow,.muted,.event-meta,.feed-card p,.concert-meta,.helper,.form-note,.profile-card p,.chaika-location-note{color:#97979f!important}
    .icon-btn,.search-wrap,.chip,.feed-card,.concert-card,.form-card,.profile-card,.stats-grid div,.moderation-card,.chaika-profile-section,.chaika-manage-item{background:#17171b!important;border-color:#2b2b33!important;color:#f7f7f8!important;box-shadow:none!important}
    .search-wrap input,.chip,.filter-btn,.icon-btn{color:#f7f7f8!important}
    .search-wrap input::placeholder{color:#777781!important}.filter-btn{border-left-color:#303038!important}
    .chip.active,.primary-btn,.concert-bottom button,.badge,.create-circle{background:#d8ff43!important;color:#111207!important;border-color:#d8ff43!important}
    .secondary-btn,.mini-actions button,.chaika-manage-actions button,.segmented,.seg-btn.active{background:#202026!important;color:#f7f7f8!important;border-color:#34343d!important}
    .seg-btn{color:#97979f!important}.seg-btn.active{background:#27272f!important;color:#fff!important}
    input,select,textarea,.date-shell{background:#101013!important;color:#fff!important;border-color:#33333c!important}
    input:focus,select:focus,textarea:focus,.date-shell:focus-within{border-color:#d8ff43!important;box-shadow:none!important}
    .field-label,label{color:#c7c7cd!important}
    .icon-choice,.category-filter{background:#111114!important;color:#ddd!important;border-color:#303038!important}
    .icon-choice.active,.category-filter.active{background:#222617!important;border-color:#d8ff43!important;color:#d8ff43!important}
    .bottom-nav{background:rgba(14,14,17,.98)!important;border-top:1px solid #25252c!important;box-shadow:0 -10px 30px rgba(0,0,0,.28)!important;backdrop-filter:blur(20px)!important}
    .nav-item{color:#85858e!important}.nav-item.active{color:#d8ff43!important}

    /* Keep the map itself light. */
    #map{background:#edf0e8!important}
    .leaflet-tile-pane{filter:saturate(.86) contrast(.98) brightness(1.025)!important}
    .leaflet-control-attribution{background:rgba(255,255,255,.82)!important;color:#777!important}.leaflet-control-attribution a{color:#555!important}
    .leaflet-control-zoom a{background:#fff!important;color:#151715!important;border-color:#e1e4dc!important}
    .regular-marker{background:#fff!important;color:var(--cat-color)!important;border:2px solid var(--cat-color)!important;box-shadow:0 6px 18px rgba(19,24,17,.18)!important}
    .premium-marker{background:#d8ff43!important;color:#111315!important;border:3px solid #fff!important}
    .chaika-group-marker{background:#fff!important;color:var(--cat-color,#111)!important;border:3px solid var(--cat-color,#111)!important;box-shadow:0 7px 24px rgba(17,23,15,.18)!important}
    .chaika-group-marker.premium{background:#f7ffd9!important;border-color:#9fbe24!important;color:#53660d!important}
    .chaika-group-count{background:#111315!important;color:#fff!important;border-color:#fff!important}
    .chaika-group-marker.premium .chaika-group-count{background:#d8ff43!important;color:#111315!important}

    .event-sheet{background:rgba(19,19,23,.97)!important;border-color:#303038!important;color:#fff!important;box-shadow:0 18px 50px rgba(0,0,0,.56)!important}
    .event-type-icon,.activity-icon{background:#25252d!important}
    .chaika-group-head{background:rgba(19,19,23,.99)!important;border-bottom-color:#2b2b33!important}
    .chaika-group-head h3{color:#fff!important}.chaika-group-close{background:#292930!important;color:#fff!important}
    .chaika-group-list{scrollbar-color:#4a4a52 transparent!important}
    .chaika-group-event{background:#17171c!important;color:#fff!important;border-color:#2c2c34!important}
    .chaika-group-event:active{background:#202026!important}.chaika-group-event p{color:#9f9faa!important}.chaika-group-chevron{color:#8b8b95!important}
    .modal-backdrop{background:#000a!important}.modal-card{background:#151519!important;border-color:#303038!important;color:#fff!important}.modal-close{background:#292930!important;color:#fff!important}
    .event-detail-view{background:#0b0b0d!important;color:#fff!important}.event-detail-body{background:#0b0b0d!important;color:#fff!important}
    .chaika-location-confirm{background:rgba(17,17,21,.96)!important;border-color:#3a3a42!important;color:#fff!important;box-shadow:0 18px 45px #0009!important}
    .chaika-location-confirm .no{background:#2a2a31!important;color:#fff!important}.chaika-location-confirm .yes{background:#d8ff43!important;color:#111207!important}
    .chaika-stress-badge{background:rgba(11,11,13,.9)!important;border-color:#45452e!important;color:#d8ff43!important;box-shadow:0 8px 24px #0007!important}
    .chaika-chat-action{background:#2a2a31!important;color:#fff!important;border-color:#41414a!important}
    .chaika-forum-status{background:#101014!important;border-color:#2d2d35!important;color:#aaaab4!important}.chaika-forum-status.ok{border-color:#465229!important;color:#d8ff43!important}
    .chaika-forum-steps{color:#9b9ba6!important}.empty-state{background:#17171b!important;color:#97979f!important;border-color:#2b2b33!important;box-shadow:0 10px 28px rgba(0,0,0,.3)!important}
    .toast{background:#f7f7f8!important;color:#111!important}
  `;
  document.head.appendChild(style);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b0b0d');
  try {
    tg?.setHeaderColor?.('#0b0b0d');
    tg?.setBackgroundColor?.('#0b0b0d');
  } catch (_) {}
})();
