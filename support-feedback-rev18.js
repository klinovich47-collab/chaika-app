/* CHAIKA in-app support feedback -> Telegram forum topic (rev18). */
(() => {
  const tgApp = window.Telegram?.WebApp;
  if (!document.body || document.getElementById('chaikaSupportButton')) return;

  const style = document.createElement('style');
  style.id = 'chaikaSupportRev18Style';
  style.textContent = `
    .chaika-support-fab{position:fixed;right:14px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:1450;width:38px;height:38px;border-radius:50%;border:1px solid #3a3a42;background:rgba(22,22,27,.94);color:#d8ff43;display:grid;place-items:center;font:900 18px/1 system-ui;box-shadow:0 8px 24px #0007;backdrop-filter:blur(14px)}
    .chaika-support-fab:active{transform:scale(.94)}
    .chaika-support-modal{position:fixed;inset:0;z-index:4200;display:flex;align-items:flex-end;justify-content:center}
    .chaika-support-backdrop{position:absolute;inset:0;background:#000a;backdrop-filter:blur(3px)}
    .chaika-support-card{position:relative;width:min(100%,430px);background:#151519;border:1px solid #303038;border-radius:24px 24px 0 0;padding:17px 16px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -20px 60px #000b}
    .chaika-support-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px}.chaika-support-head h3{font-size:20px;margin:0}.chaika-support-close{width:34px;height:34px;border-radius:50%;border:0;background:#292930;color:#fff;font-size:22px;line-height:1}
    .chaika-support-sub{margin:0 0 14px;color:#97979f;font-size:12px;line-height:1.45}
    .chaika-support-types{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:11px}.chaika-support-type{border:1px solid #33333c;background:#101013;color:#c8c8ce;border-radius:12px;padding:10px 5px;font-size:11px;font-weight:700}.chaika-support-type.active{background:#252b16;border-color:#d8ff43;color:#d8ff43}
    .chaika-support-card textarea{min-height:120px;resize:none;margin:0 0 10px;background:#101013;border:1px solid #33333c;color:#fff;border-radius:14px;padding:12px;width:100%;outline:none}.chaika-support-card textarea:focus{border-color:#d8ff43}
    .chaika-support-send{width:100%;border:0;border-radius:14px;padding:13px 14px;background:#d8ff43;color:#111207;font-weight:900}.chaika-support-send:disabled{opacity:.5;pointer-events:none}
    .chaika-support-note{text-align:center;color:#74747d;font-size:10px;margin:9px 4px 0}
  `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'chaikaSupportButton';
  fab.className = 'chaika-support-fab';
  fab.type = 'button';
  fab.textContent = '?';
  fab.setAttribute('aria-label', 'Техподдержка');
  fab.title = 'Техподдержка';
  document.body.appendChild(fab);

  let modal = null;
  let kind = 'problem';

  function closeSupport(){ modal?.remove(); modal = null; }
  function openSupport(){
    if (modal) return;
    kind = 'problem';
    modal = document.createElement('div');
    modal.className = 'chaika-support-modal';
    modal.innerHTML = `
      <div class="chaika-support-backdrop"></div>
      <section class="chaika-support-card" role="dialog" aria-modal="true" aria-label="Техподдержка ЧАЙКИ">
        <div class="chaika-support-head"><h3>Техподдержка</h3><button class="chaika-support-close" type="button" aria-label="Закрыть">×</button></div>
        <p class="chaika-support-sub">Расскажи, что сломалось или что стоит улучшить. Сообщение уйдёт команде ЧАЙКИ.</p>
        <div class="chaika-support-types">
          <button class="chaika-support-type active" data-kind="problem" type="button">Проблема</button>
          <button class="chaika-support-type" data-kind="idea" type="button">Идея</button>
          <button class="chaika-support-type" data-kind="other" type="button">Другое</button>
        </div>
        <textarea id="chaikaSupportMessage" maxlength="2000" placeholder="Опиши проблему или идею…"></textarea>
        <button id="chaikaSupportSend" class="chaika-support-send" type="button">Отправить</button>
        <p class="chaika-support-note">К сообщению прикрепятся Telegram-профиль и технический контекст приложения.</p>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector('.chaika-support-backdrop').onclick = closeSupport;
    modal.querySelector('.chaika-support-close').onclick = closeSupport;
    modal.querySelectorAll('[data-kind]').forEach(btn => btn.onclick = () => {
      kind = btn.dataset.kind;
      modal.querySelectorAll('[data-kind]').forEach(x => x.classList.toggle('active', x === btn));
    });
    modal.querySelector('#chaikaSupportSend').onclick = sendSupport;
    setTimeout(() => modal?.querySelector('#chaikaSupportMessage')?.focus(), 120);
  }

  async function sendSupport(){
    const textarea = modal?.querySelector('#chaikaSupportMessage');
    const send = modal?.querySelector('#chaikaSupportSend');
    const message = String(textarea?.value || '').trim();
    if (message.length < 3) { toast?.('Напиши хотя бы пару слов'); return; }
    const initData = tgApp?.initData || '';
    if (!initData) { toast?.('Открой ЧАЙКУ через Telegram'); return; }
    send.disabled = true; send.textContent = 'Отправляю…';
    try {
      const activeView = document.querySelector('.active-view')?.id || '';
      await chaikaEdge('telegram-support', {
        initData,
        kind,
        message,
        context: {
          view: activeView,
          version: 'rev18',
          platform: tgApp?.platform || navigator.platform || ''
        }
      });
      closeSupport();
      toast?.('Спасибо — сообщение отправлено в поддержку');
      tgApp?.HapticFeedback?.notificationOccurred?.('success');
    } catch (e) {
      console.error('CHAIKA support', e);
      send.disabled = false; send.textContent = 'Отправить';
      toast?.('Не удалось отправить. Попробуй ещё раз');
      tgApp?.HapticFeedback?.notificationOccurred?.('error');
    }
  }

  fab.onclick = openSupport;
  window.chaikaOpenSupport = openSupport;
})();