/* CHAIKA safety + stable event deep links. Loaded after Supabase and map enhancements. */

const chaikaSafetyHomoglyph={a:'а',c:'с',e:'е',o:'о',p:'р',x:'х',y:'у',k:'к',m:'м',t:'т',h:'н',b:'в'};
function chaikaSafetyNormalize(raw=''){
  let s=String(raw).normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\u200B-\u200D\uFEFF]/g,'');
  s=s.replace(/[0346@$]/g,ch=>({'0':'о','3':'з','4':'ч','6':'б','@':'а','$':'с'}[ch]||ch));
  s=s.replace(/[aceopxykmthb]/g,ch=>chaikaSafetyHomoglyph[ch]||ch);
  const spaced=s.replace(/[^a-zа-я0-9]+/giu,' ').replace(/\s+/g,' ').trim();
  return {spaced,compact:spaced.replace(/\s+/g,'')};
}
function chaikaSafetyHas(v,terms){return terms.some(term=>v.includes(term))}

const chaikaSafetyHardTerms=[
  'наркот','закладк','кладмен','героин','кокаин','амфетамин','метамфетамин','мефедрон','меф','марихуан','каннабис','экстази','mdma','lsd','псилоциб',
  'оружи','боеприпас','взрывчат','террор','экстрем','проституц','интимуслуг','сексзаденьги',
  'массовоеубий','массовыйрасстрел','жертвопринош','человеческаяжертв','ритуальноеубий','изнасил','сексуальноенасили','самоубий','суицид','живодер'
];
const chaikaSafetyHardPatterns=[
  /массов\S*\s+(убий|расстрел|резн)/u,
  /убить\s+(люд|человек|кого|всех)/u,
  /(расстрел|резн[яи]|пытк|казн[ьи]|линч)/u,
  /(убить|мучить|издев\S*)\s+(кот|кош|собак|живот)/u,
  /(прыгн\S*\s+с\s+(крыши|моста)|вскрыть\s+вен)/u,
  /(юз\S*|поюз\S*)\s+(кот|кош|котик)/u,
  /(упорот|вмаз|ширнут|снюх|под\s+веществ)/u,
  /(дорожк\S*\s+(кокс|кокаин)|колоть\s+(героин|наркот))/u,
  /(сексуал\S*|секс)\s+.*(дет|ребен|подрост|несовершеннолет)/u
];
const chaikaSafetyReviewTerms=[
  'хуй','хуя','хуе','пизд','ебан','ебат','ебля','бляд','шлюх','манда','елда','фаллос','фалос','пенис','вагин','вареник','дроч','минет','куни','порно','оргия','оргии','сиськ','титьк','жоп','секс','анал','член',
  'шмаль','гашиш','гаш','травка','косяк','спиды','скорость','кислота','таблы','колеса','кокс','эскорт',
  'драка','подраться','мордобой','охотаналюд','кровавыйритуал','сатанинскийритуал','безправил','секретныйадрес','тольконалич','легкиеденьги','100заработ'
];
const chaikaSafetyReviewPatterns=[
  /(по\s+приколу|рофл|прикол\S*\s+событ)/u,
  /(кур\S*|забить|пыхн\S*)\s+.*(шмаль|трав|косяк|гаш)/u,
  /(поюз\S*|юз\S*)\s+.*(веществ|табл|колес|скорост)/u
];

moderate=function(text){
  const form=els?.form;
  const venue=form?.elements?.namedItem?.('venue')?.value||'';
  const title=form?.elements?.namedItem?.('title')?.value||'';
  const description=form?.elements?.namedItem?.('description')?.value||'';
  const {spaced,compact}=chaikaSafetyNormalize(`${text||''} ${title} ${description} ${venue}`);
  if(chaikaSafetyHas(compact,chaikaSafetyHardTerms)||chaikaSafetyHardPatterns.some(r=>r.test(spaced))){
    return {status:'block',title:'Публикация отклонена',text:'В названии, описании или месте обнаружено опасное, незаконное или явно запрещённое содержание.'};
  }
  if(chaikaSafetyHas(compact,chaikaSafetyReviewTerms)||chaikaSafetyReviewPatterns.some(r=>r.test(spaced))){
    return {status:'review',title:'Нужна ручная проверка',text:'Сленг или двусмысленная формулировка найдены в названии, описании или месте. Событие попадёт администратору на проверку.'};
  }
  return {status:'ok',title:'Проверка пройдена',text:'Предварительная проверка текста пройдена.'};
};

const CHAIKA_PUBLIC_EVENT_URL='https://chaika-app.vercel.app/';
const CHAIKA_BOT_USERNAME='chaika47bot';
function chaikaEventDeepLink(id){return `https://t.me/${CHAIKA_BOT_USERNAME}?startapp=${encodeURIComponent(`event_${id}`)}`}
shareEvent=async function(id){
  const event=state.events.find(x=>x.id===id);
  if(!event)return toast('Событие не найдено');
  const webUrl=new URL(CHAIKA_PUBLIC_EVENT_URL);
  webUrl.searchParams.set('event',id);
  const direct=webUrl.toString();
  const miniApp=chaikaEventDeepLink(id);
  const text=`Смотри событие в ЧАЙКЕ: ${event.title}`;
  const telegramShare=`https://t.me/share/url?url=${encodeURIComponent(miniApp)}&text=${encodeURIComponent(text)}`;
  try{
    if(tg?.openTelegramLink){tg.openTelegramLink(telegramShare);return;}
    if(navigator.share){await navigator.share({title:event.title,text,url:miniApp});return;}
    await navigator.clipboard?.writeText?.(miniApp);
    toast('Ссылка на событие скопирована');
  }catch(error){
    console.error('CHAIKA share',error);
    try{await navigator.clipboard?.writeText?.(direct);toast('Ссылка скопирована')}catch{toast(direct)}
  }
};

(function chaikaOpenDeepLinkedEvent(){
  const queryId=new URLSearchParams(location.search).get('event');
  const rawStart=window.Telegram?.WebApp?.initDataUnsafe?.start_param||startParam||'';
  const startId=String(rawStart).match(/^event_([0-9a-f-]{36})(?:_|$)/i)?.[1]||'';
  const id=queryId||startId;
  if(!id)return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    const event=state.events.find(x=>x.id===id);
    if(event){clearInterval(timer);switchView('mapView');setTimeout(()=>{map.setView([event.lat,event.lng],14);showEvent(id)},100);return;}
    if(attempts>=40){clearInterval(timer);toast('Событие уже недоступно или ещё не опубликовано');}
  },250);
})();

const chaikaFormNote=document.querySelector('#eventForm .form-note');
if(chaikaFormNote)chaikaFormNote.textContent='Название, описание и место проходят автоматическую проверку. Сленг и двусмысленные формулировки уходят на ручную модерацию; фото также проверяется перед публикацией.';
const chaikaConcertNote=document.querySelector('#concertsView .legal-note');
if(chaikaConcertNote)chaikaConcertNote.textContent='Концерты автоматически обновляются из внешних источников. Кнопка покупки открывает страницу источника или регистрации.';
