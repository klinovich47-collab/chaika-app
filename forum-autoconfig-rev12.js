/* CHAIKA auto-connect default Telegram forum for admin (rev12). */
(() => {
  const DEFAULT_FORUM='@ckaikamain';
  const KEY='chaika_forum_autoconfig_rev12';
  let busy=false,done=false,attempts=0;

  function friendly(error){
    const code=String(error?.message||error||'');
    if(code.includes('forum_must_be_supergroup'))return 'Группа @ckaikamain должна быть супергруппой.';
    if(code.includes('topics_not_enabled'))return 'В @ckaikamain нужно включить «Темы».';
    if(code.includes('bot_needs_manage_topics'))return 'Добавь @chaika47bot администратором @ckaikamain с правом «Управление темами».';
    if(code.includes('telegram_getChat'))return 'Бот пока не видит группу @ckaikamain.';
    return 'Не удалось автоматически подключить чат @ckaikamain.';
  }

  async function connect(){
    if(done||busy)return;
    if(!window.Telegram?.WebApp?.initData||typeof chaikaEdge!=='function'||typeof chaikaManagement==='undefined'||typeof chaikaAuth==='undefined')return;
    if(chaikaAuth.status!=='ready'||!chaikaManagement.isAdmin)return;
    busy=true;
    try{
      const initData=window.Telegram.WebApp.initData;
      const status=await chaikaEdge('telegram-event-management',{initData,action:'forum_status'});
      if(status?.forum?.configured){done=true;sessionStorage.setItem(KEY,'ok');return;}
      const result=await chaikaEdge('telegram-event-management',{initData,action:'forum_configure',forumUsername:DEFAULT_FORUM});
      if(result?.forum?.configured){
        done=true;sessionStorage.setItem(KEY,'ok');
        if(typeof toast==='function')toast('Общий чат ЧАЙКИ подключён');
        if(typeof chaikaRenderManagementPanels==='function')chaikaRenderManagementPanels();
      }
    }catch(error){
      attempts++;
      console.error('CHAIKA forum auto-config',error);
      if(attempts===1&&typeof toast==='function')toast(friendly(error));
    }finally{busy=false;}
  }

  const timer=setInterval(()=>{
    if(done||sessionStorage.getItem(KEY)==='ok'){done=true;clearInterval(timer);return;}
    connect();
    if(attempts>=4)clearInterval(timer);
  },1200);
  setTimeout(connect,350);
})();
