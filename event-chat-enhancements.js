/* CHAIKA Telegram forum chat integration (rev9). */
(() => {
  const UUID_RE=/^[0-9a-f-]{36}$/i;
  const busy=new Set();
  const forumState={loaded:false,loading:false,error:null,forum:null};

  function injectStyles(){
    if(document.getElementById('chaikaEventChatStyles'))return;
    const style=document.createElement('style');
    style.id='chaikaEventChatStyles';
    style.textContent=`
      .chaika-chat-action{background:#2a2a31!important;color:#fff!important;border:1px solid #41414a!important}
      .event-sheet .chaika-chat-action{grid-column:1/-1}
      .detail-actions .chaika-chat-action{grid-column:1/-1}
      .chaika-forum-setup{display:grid;gap:10px}
      .chaika-forum-status{padding:10px 11px;border-radius:12px;background:#101014;border:1px solid #2d2d35;font-size:12px;line-height:1.45;color:#aaaab4}
      .chaika-forum-status.ok{border-color:#465229;color:#d8ff43}
      .chaika-forum-steps{margin:0;padding-left:18px;color:#9b9ba6;font-size:11px;line-height:1.5}
      .chaika-forum-row{display:grid;grid-template-columns:1fr auto;gap:8px}
      .chaika-forum-row input{min-width:0}
      .chaika-forum-row button{white-space:nowrap;padding:10px 12px}
    `;
    document.head.appendChild(style);
  }

  function openTelegram(url){
    if(!url)return;
    if(tg?.openTelegramLink)tg.openTelegramLink(url);
    else window.open(url,'_blank','noopener,noreferrer');
  }

  function chatErrorMessage(code){
    const value=String(code||'');
    if(value==='forum_not_configured')return 'Ты идёшь. Общий чат ещё не подключён администратором.';
    if(value==='topic_creation_pending')return 'Чат создаётся. Нажми «Чат» ещё раз через секунду.';
    if(value.includes('bot_needs_manage_topics'))return 'Боту нужны права администратора «Управление темами».';
    if(value.includes('topics_not_enabled'))return 'В Telegram-группе нужно включить режим «Темы».';
    return 'Не удалось открыть чат события.';
  }

  async function getEventChat(id,open=true){
    const event=state.events.find(x=>x.id===id);
    if(!event||!UUID_RE.test(String(id)))return false;
    if(event.chatUrl){if(open)openTelegram(event.chatUrl);return true;}
    const initData=window.Telegram?.WebApp?.initData||'';
    if(!initData)return toast('Открой ЧАЙКУ в Telegram, чтобы войти в чат');
    try{
      const row=await chaikaEdge('telegram-toggle-attendance',{initData,eventId:id,action:'chat'});
      if(row?.chat_url){event.chatUrl=row.chat_url;if(open)openTelegram(row.chat_url);return true;}
      toast(chatErrorMessage(row?.chat_error));
      return false;
    }catch(error){
      console.error('CHAIKA event chat open',error);
      if(error?.message==='not_attending'){
        state.going.delete(id);persist();renderFeed();
        if(state.selectedId===id)showEvent(id);
        toast('Сначала отметь «Пойду»');
        return false;
      }
      toast('Не удалось открыть чат события');
      return false;
    }
  }
  window.chaikaOpenEventChat=getEventChat;

  const baseToggleGoing=toggleGoing;
  toggleGoing=async function(id){
    if(!UUID_RE.test(String(id)))return baseToggleGoing(id);
    const event=state.events.find(x=>x.id===id);if(!event||busy.has(id))return;
    const initData=window.Telegram?.WebApp?.initData||'';
    if(!initData)return toast('Открой ЧАЙКУ в Telegram, чтобы отметить «Пойду»');
    if(chaikaAuth.status!=='ready'&&!(await chaikaAuthenticate()))return toast('Не удалось подтвердить Telegram-профиль');
    busy.add(id);
    try{
      const row=await chaikaEdge('telegram-toggle-attendance',{initData,eventId:id,action:'toggle'});
      const going=Boolean(row?.going);
      if(going)state.going.add(id);else state.going.delete(id);
      event.going=Math.max(0,Number(row?.going_count||0)-(going?1:0));
      if(row?.chat_url)event.chatUrl=row.chat_url;
      if(!going)delete event.chatUrl;
      persist();renderFeed();
      if(state.selectedId===id)showEvent(id);
      if(els.detail?.dataset.eventId===id&&!els.detail.classList.contains('hidden'))openEventDetail(id);
      updateProfile();tg?.HapticFeedback?.impactOccurred?.('light');
      if(going&&row?.chat_url){
        tg?.HapticFeedback?.notificationOccurred?.('success');
        openTelegram(row.chat_url);
      }else if(going&&row?.chat_error){
        toast(chatErrorMessage(row.chat_error));
      }
    }catch(error){
      console.error('CHAIKA attendance + chat',error);
      toast('Не удалось обновить «Пойду»');
    }finally{busy.delete(id);}
  };

  function makeChatButton(id,label='Чат'){
    const btn=document.createElement('button');
    btn.type='button';btn.className='secondary-btn chaika-chat-action';btn.dataset.chatEvent=id;btn.textContent=`💬 ${label}`;
    btn.onclick=()=>getEventChat(id,true);
    return btn;
  }

  function injectSheetChat(id){
    const event=state.events.find(x=>x.id===id);if(!event||!state.going.has(id))return;
    const actions=els.sheet?.querySelector('.actions');if(!actions||actions.querySelector('[data-chat-event]'))return;
    actions.appendChild(makeChatButton(id,'Чат участников'));
  }

  function injectDetailChat(id){
    const event=state.events.find(x=>x.id===id);if(!event||!state.going.has(id))return;
    const actions=els.detailBody?.querySelector('.detail-actions');if(!actions||actions.querySelector('[data-chat-event]'))return;
    actions.appendChild(makeChatButton(id,'Чат участников'));
  }

  function injectFeedChats(){
    if(!els.feed)return;
    els.feed.querySelectorAll('button[data-going]').forEach(goingBtn=>{
      const id=goingBtn.dataset.going;if(!id||!state.going.has(id))return;
      const actions=goingBtn.closest('.mini-actions');if(!actions||actions.querySelector('[data-chat-event]'))return;
      const btn=document.createElement('button');btn.type='button';btn.dataset.chatEvent=id;btn.textContent='💬 Чат';btn.onclick=()=>getEventChat(id,true);actions.appendChild(btn);
    });
  }

  const baseShowEvent=showEvent;
  showEvent=function(id){baseShowEvent(id);injectSheetChat(id);};
  const baseOpenEventDetail=openEventDetail;
  openEventDetail=function(id){baseOpenEventDetail(id);injectDetailChat(id);};
  const baseRenderFeed=renderFeed;
  renderFeed=function(){baseRenderFeed();injectFeedChats();};

  function forumErrorMessage(error){
    const code=String(error?.message||error||'');
    if(code==='invalid_forum_username')return 'Укажи @username публичной Telegram-группы.';
    if(code==='forum_must_be_supergroup')return 'Нужна Telegram-супергруппа, а не канал.';
    if(code==='topics_not_enabled')return 'В группе не включены «Темы». Включи их в настройках группы.';
    if(code==='forum_must_be_public')return 'Для MVP группа должна быть публичной и иметь @username.';
    if(code==='bot_needs_manage_topics')return 'Добавь @chaika47bot администратором и включи право «Управление темами».';
    if(code.includes('telegram_getChat'))return 'Группа не найдена. Проверь @username и доступ бота.';
    return 'Не удалось подключить Telegram-форум.';
  }

  async function loadForumStatus(){
    if(forumState.loading||!chaikaManagement?.isAdmin||chaikaAuth.status!=='ready')return;
    const initData=window.Telegram?.WebApp?.initData||'';if(!initData)return;
    forumState.loading=true;forumState.error=null;
    try{
      const data=await chaikaEdge('telegram-event-management',{initData,action:'forum_status'});
      forumState.forum=data.forum||{configured:false};forumState.loaded=true;
    }catch(error){forumState.error=error.message;forumState.loaded=true;console.error('CHAIKA forum status',error);}
    finally{forumState.loading=false;renderForumAdminUI();}
  }

  async function configureForum(){
    const input=document.getElementById('chaikaForumUsername');
    const button=document.getElementById('chaikaForumConnectBtn');
    const value=input?.value?.trim()||'';if(!value)return toast('Укажи @username Telegram-группы');
    const initData=window.Telegram?.WebApp?.initData||'';if(!initData)return;
    if(button){button.disabled=true;button.textContent='Проверяю…';}
    try{
      const data=await chaikaEdge('telegram-event-management',{initData,action:'forum_configure',forumUsername:value});
      forumState.forum=data.forum;forumState.loaded=true;forumState.error=null;
      toast('Общий чат ЧАЙКИ подключён');tg?.HapticFeedback?.notificationOccurred?.('success');
    }catch(error){forumState.error=error.message;toast(forumErrorMessage(error));}
    finally{if(button){button.disabled=false;button.textContent='Подключить';}renderForumAdminUI();}
  }

  function ensureForumSection(){
    let section=document.getElementById('chaikaForumSection');if(section)return section;
    const profile=document.getElementById('profileView');if(!profile)return null;
    section=document.createElement('section');section.id='chaikaForumSection';section.className='chaika-profile-section chaika-admin-section hidden';
    const adminSection=document.getElementById('chaikaAdminSection');
    profile.insertBefore(section,adminSection||profile.querySelector('.moderation-card')||document.getElementById('resetBtn'));
    return section;
  }

  function renderForumAdminUI(){
    const section=ensureForumSection();if(!section)return;
    const isAdmin=Boolean(chaikaManagement?.isAdmin);section.classList.toggle('hidden',!isAdmin);if(!isAdmin)return;
    const forum=forumState.forum;
    const configured=Boolean(forum?.configured);
    const status=forumState.loading?'Проверяю подключение…':configured?`Подключено: @${escapeHtml(forum.username||'')} · ${escapeHtml(forum.title||'Telegram')}`:'Общий Telegram-форум пока не подключён.';
    const error=forumState.error?`<div class="chaika-forum-status">${escapeHtml(forumErrorMessage(forumState.error))}</div>`:'';
    section.innerHTML=`<div class="chaika-forum-setup"><h3>Чаты событий <span class="chaika-admin-badge">ADMIN</span></h3><div class="chaika-forum-status ${configured?'ok':''}">${status}</div>${error}<ol class="chaika-forum-steps"><li>Создай публичную Telegram-супергруппу.</li><li>Включи в ней режим «Темы».</li><li>Добавь @chaika47bot администратором с правом «Управление темами».</li><li>Вставь @username группы ниже.</li></ol><div class="chaika-forum-row"><input id="chaikaForumUsername" type="text" placeholder="@chaika_events_spb" value="${configured?'@'+escapeHtml(forum.username||''):''}"><button id="chaikaForumConnectBtn" class="secondary-btn small" type="button">Подключить</button></div><p class="muted" style="margin:0;font-size:11px">После подключения первый «Пойду» создаёт тему события, а участник сразу переходит в неё.</p></div>`;
    document.getElementById('chaikaForumConnectBtn')?.addEventListener('click',configureForum);
    if(!forumState.loaded&&!forumState.loading)queueMicrotask(loadForumStatus);
  }

  if(typeof chaikaRenderManagementPanels==='function'){
    const baseRenderManagement=chaikaRenderManagementPanels;
    chaikaRenderManagementPanels=function(){baseRenderManagement();renderForumAdminUI();};
  }

  injectStyles();
  injectFeedChats();
  renderForumAdminUI();
})();
