/* CHAIKA readable category picker + event photo thumbnails (rev25). */
(() => {
  const labelsRev25 = {
    guitar: 'Джем',
    music: 'Концерт',
    mic: 'Микрофон',
    drink: 'Бар',
    chess: 'Шахматы',
    chat: 'Общение',
    coffee: 'Кофе',
    game: 'Игры',
    art: 'Творчество',
    walk: 'Прогулка',
    sport: 'Спорт',
    dog: 'С собакой',
    study: 'Учёба',
    dating: 'Знакомства',
    party: 'Вечеринка',
    other: 'Другое'
  };

  iconCategories.forEach(category => {
    const label = labelsRev25[category[0]];
    if (!label) return;
    category[1] = label;
    if (categoryMap[category[0]]) categoryMap[category[0]].label = label;
  });

  const styleRev25 = document.createElement('style');
  styleRev25.id = 'chaikaEventVisualsRev25';
  styleRev25.textContent = `
    .icon-picker{
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:8px!important;
    }
    .icon-choice{
      aspect-ratio:auto!important;
      min-width:0!important;
      min-height:72px!important;
      padding:8px 4px 7px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
    }
    .icon-choice svg{width:25px!important;height:25px!important;flex:none}
    .icon-choice span{
      position:static!important;
      display:block!important;
      transform:none!important;
      max-width:100%!important;
      color:currentColor!important;
      font-size:9.5px!important;
      font-weight:750!important;
      line-height:1.08!important;
      text-align:center!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
    }
    .icon-choice.active{box-shadow:0 0 0 2px var(--cat-color) inset!important}
    .chaika-event-visual{overflow:hidden!important;position:relative!important;padding:0!important}
    .chaika-event-visual.has-photo{background:#202126!important;border-color:#34363d!important;color:transparent!important}
    .chaika-event-visual>img{
      display:block!important;
      width:100%!important;
      height:100%!important;
      object-fit:cover!important;
      object-position:center!important;
      pointer-events:none!important;
    }
    .chaika-group-event{
      grid-template-columns:52px minmax(0,1fr) auto!important;
      gap:11px!important;
    }
    .chaika-group-event .event-type-icon{
      width:52px!important;
      height:52px!important;
      border-radius:13px!important;
    }
    .feed-card .activity-icon{border-radius:14px!important}
    @media (max-width:340px){
      .icon-picker{gap:6px!important}
      .icon-choice{min-height:68px!important;padding-left:2px!important;padding-right:2px!important}
      .icon-choice span{font-size:8.8px!important}
    }
  `;
  document.head.appendChild(styleRev25);

  function hasEventPhotoRev25(event) {
    const src = String(event?.imageData || '').trim();
    return /^(https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i.test(src);
  }

  function showEventIconRev25(box, event) {
    if (!box) return;
    const category = categoryMap[event?.category] || categoryMap.other;
    box.classList.remove('has-photo');
    box.innerHTML = svgIcon(category.icon);
  }

  function decorateEventVisualRev25(box, event) {
    if (!box || !event) return;
    box.classList.add('chaika-event-visual');
    if (!hasEventPhotoRev25(event)) {
      showEventIconRev25(box, event);
      return;
    }

    const src = String(event.imageData).trim();
    box.classList.add('has-photo');
    box.innerHTML = `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
    box.querySelector('img')?.addEventListener('error', () => showEventIconRev25(box, event), { once:true });
  }

  function decorateFeedRev25() {
    els.feed?.querySelectorAll('.feed-card').forEach(card => {
      const id = card.querySelector('[data-map]')?.dataset.map;
      const event = state.events.find(item => String(item.id) === String(id));
      decorateEventVisualRev25(card.querySelector('.activity-icon'), event);
    });
  }

  const baseShowEventRev25 = showEvent;
  showEvent = function(id) {
    baseShowEventRev25(id);
    const event = state.events.find(item => String(item.id) === String(id));
    decorateEventVisualRev25(els.sheet?.querySelector('.sheet-row > .event-type-icon'), event);
  };

  const baseRenderFeedRev25 = renderFeed;
  renderFeed = function() {
    baseRenderFeedRev25();
    decorateFeedRev25();
  };

  if (typeof chaikaShowEventGroup === 'function') {
    const baseShowEventGroupRev25 = chaikaShowEventGroup;
    chaikaShowEventGroup = function(group) {
      baseShowEventGroupRev25(group);
      if (!group || group.length < 2) return;
      els.sheet?.querySelectorAll('[data-group-event]').forEach(button => {
        const event = group.find(item => String(item.id) === String(button.dataset.groupEvent));
        decorateEventVisualRev25(button.querySelector('.event-type-icon'), event);
      });
    };
  }

  window.chaikaHasEventPhoto = hasEventPhotoRev25;
  window.chaikaDecorateEventVisual = decorateEventVisualRev25;

  renderCategoryUI();
  renderFeed();
})();
