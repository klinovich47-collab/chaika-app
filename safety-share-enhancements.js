/* CHAIKA safety + stable event deep links. Loaded after Supabase and map enhancements. */

const chaikaSafetyLatinToCyr={a:'а',c:'с',e:'е',o:'о',p:'р',x:'х',y:'у',k:'к',m:'м',t:'т',h:'н',b:'в'};
const chaikaSafetyCyrToLatin={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
function chaikaSafetySplit(s=''){
  const spaced=String(s).replace(/[^a-zа-я0-9]+/giu,' ').replace(/\s+/g,' ').trim();
  return {spaced,compact:spaced.replace(/\s+/g,'')};
}
function chaikaSafetyNormalize(raw=''){
  const src=String(raw).normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\u200B-\u200D\uFEFF]/g,'');
  const cyrLeet=src.replace(/[0346@$]/g,ch=>({'0':'о','3':'з','4':'ч','6':'б','@':'а','$':'с'}[ch]||ch));
  const cyr=chaikaSafetySplit(cyrLeet.replace(/[aceopxykmthb]/g,ch=>chaikaSafetyLatinToCyr[ch]||ch));
  const latLeet=src.replace(/[0134@$]/g,ch=>({'0':'o','1':'i','3':'e','4':'a','@':'a','$':'s'}[ch]||ch));
  const lat=chaikaSafetySplit([...latLeet].map(ch=>chaikaSafetyCyrToLatin[ch]??ch).join(''));
  return {spaced:cyr.spaced,compact:cyr.compact,latinSpaced:lat.spaced,latinCompact:lat.compact};
}
function chaikaSafetyHas(v,terms){return terms.some(term=>v.includes(term))}
function chaikaSafetyPattern(values,patterns){return patterns.some(r=>values.some(v=>r.test(v)))}

const chaikaSafetyHardRu=[
  'наркот','закладк','кладмен','героин','кокаин','амфетамин','метамфетамин','мефедрон','марихуан','каннабис','экстази','псилоциб',
  'оружи','боеприпас','взрывчат','террор','экстрем','проституц','интимуслуг','сексзаденьги',
  'массовоеубий','массовыйрасстрел','жертвопринош','человеческаяжертв','ритуальноеубий','изнасил','сексуальноенасили','самоубий','суицид','живодер'
];
const chaikaSafetyHardLat=['narkot','zaklad','heroin','cocaine','kokain','amphetamine','amfetamin','methamphetamine','metamfetamin','mefedron','marijuana','marihuana','cannabis','kanabis','ecstasy','mdma','lsd','psilocybin','weapon','explosive','terror','suicide','rape','prostitution'];
const chaikaSafetyHardPatterns=[
  /массов\S*\s+(убий|расстрел|резн)/u,
  /убить\s+(люд|человек|кого|всех)/u,
  /(расстрел|резн[яи]|пытк|казн[ьи]|линч)/u,
  /(убить|мучить|издев\S*)\s+(кот|кош|собак|живот)/u,
  /(прыгн\S*\s+с\s+(крыши|моста)|вскрыть\s+вен)/u,
  /(юз\S*|поюз\S*)\s+(кот|кош|котик)/u,
  /(упорот|вмаз|ширнут|снюх|под\s+веществ)/u,
  /(дорожк\S*\s+(кокс|кокаин)|колоть\s+(героин|наркот))/u,
  /(сексуал\S*|секс)\s+.*(дет|ребен|подрост|несовершеннолет)/u,
  /mass\w*\s+(kill|shoot|murder)/i,
  /kill\s+(people|everyone|person)/i,
  /self\s*harm|suicid/i
];
const chaikaSafetyReviewRu=[
  'хуй','хуя','хуе','хер','пизд','пиздец','ебан','ебат','ебля','ебуч','ебнут','уеб','заеб','наеб','поеб','выеб','бляд','шлюх','манда','елда','залуп',
  'фаллос','фалос','пенис','писюн','письк','вагин','вареник','сперм','конч','дроч','отсос','минет','куни','порно','оргия','сиськ','титьк','жоп','анус','секс','анал','член',
  'шмаль','гашиш','травка','косяк','спиды','скорость','кислота','таблы','колеса','кокс','эскорт','драка','подраться','мордобой','охотаналюд','кровавыйритуал','сатанинскийритуал','безправил','секретныйадрес','тольконалич','легкиеденьги','100заработ'
];
const chaikaSafetyReviewLat=['hui','huy','khui','pizda','pizdec','pizdets','ebat','eblya','blyad','blyat','chlen','zalupa','fallos','penis','vagina','dick','cock','pussy','blowjob','porn','porno','fuck','sex','anal','escort','hashish','gashish','weed'];
const chaikaSafetyReviewPatterns=[
  /(по\s+приколу|рофл|прикол\S*\s+событ)/u,
  /(кур\S*|забить|пыхн\S*)\s+.*(шмаль|трав|косяк|гаш)/u,
  /(поюз\S*|юз\S*)\s+.*(веществ|табл|колес|скорост)/u,
  /\b(fuck|blowjob|pussy|cock|dick|porn)\w*/i
];

moderate=function(text){
  const form=els?.form;
  const venue=form?.elements?.namedItem?.('venue')?.value||'';
  const title=form?.elements?.namedItem?.('title')?.value||'';
  const description=form?.elements?.namedItem?.('description')?.value||'';
  const f=chaikaSafetyNormalize(`${text||''} ${title} ${description} ${venue}`);
  if(chaikaSafetyHas(f.compact,chaikaSafetyHardRu)||chaikaSafetyHas(f.latinCompact,chaikaSafetyHardLat)||chaikaSafetyPattern([f.spaced,f.latinSpaced],chaikaSafetyHardPatterns)){
    return {status:'block',title:'Публикация отклонена',text:'В названии, описании или месте обнаружено опасное, незаконное или явно запрещённое содержание.'};
  }
  if(chaikaSafetyHas(f.compact,chaikaSafetyReviewRu)||chaikaSafetyHas(f.latinCompact,chaikaSafetyReviewLat)||chaikaSafetyPattern([f.spaced,f.latinSpaced],chaikaSafetyReviewPatterns)){
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
if(chaikaFormNote)chaikaFormNote.textContent='Название, описание и место проходят автоматическую проверку. Сленг, обфускация и двусмысленные формулировки уходят на ручную модерацию; фото также проверяется перед публикацией.';
const chaikaConcertNote=document.querySelector('#concertsView .legal-note');
if(chaikaConcertNote)chaikaConcertNote.textContent='Концерты автоматически обновляются из внешних источников. Кнопка покупки открывает страницу источника или регистрации.';
