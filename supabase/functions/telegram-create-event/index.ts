import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const enc=new TextEncoder();
const out=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});

async function mac(key:Uint8Array,msg:string){const k=await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(msg)));}
const hx=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
function eq(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function verify(raw:string){const token=Deno.env.get("TELEGRAM_BOT_TOKEN");if(!token)throw new Error("bot_not_configured");const p=new URLSearchParams(raw),hash=(p.get("hash")||"").toLowerCase();const auth=Number(p.get("auth_date")||0),now=Math.floor(Date.now()/1000);if(!hash)throw new Error("hash_missing");if(!auth||auth>now+300||now-auth>86400)throw new Error("init_data_expired");const chk=(drop=false)=>[...p.entries()].filter(([k])=>k!=="hash"&&(!drop||k!=="signature")).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");const secret=await mac(enc.encode("WebAppData"),token);let ok=eq(hx(await mac(secret,chk(false))),hash);if(!ok&&p.has("signature"))ok=eq(hx(await mac(secret,chk(true))),hash);if(!ok)throw new Error("signature_invalid");const u=JSON.parse(p.get("user")||"null");if(!u?.id)throw new Error("user_missing");return u;}

const cats=new Set(['guitar','music','mic','drink','chess','chat','coffee','game','art','walk','sport','dog','study','dating','party','other']);
const latinToCyr:Record<string,string>={a:'а',c:'с',e:'е',o:'о',p:'р',x:'х',y:'у',k:'к',m:'м',t:'т',h:'н',b:'в'};
const cyrToLatin:Record<string,string>={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
function cleaned(raw:string){return String(raw||'').normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[\u200B-\u200D\uFEFF]/g,'');}
function splitCompact(s:string){const spaced=s.replace(/[^a-zа-я0-9]+/giu,' ').replace(/\s+/g,' ').trim();return {spaced,compact:spaced.replace(/\s+/g,'')};}
function norm(raw:string){
  const src=cleaned(raw);
  const cyrLeet=src.replace(/[0346@$]/g,ch=>({'0':'о','3':'з','4':'ч','6':'б','@':'а','$':'с'}[ch]||ch));
  const cyrMixed=cyrLeet.replace(/[aceopxykmthb]/g,ch=>latinToCyr[ch]||ch);
  const cyr=splitCompact(cyrMixed);
  const latLeet=src.replace(/[0134@$]/g,ch=>({'0':'o','1':'i','3':'e','4':'a','@':'a','$':'s'}[ch]||ch));
  const latMixed=[...latLeet].map(ch=>cyrToLatin[ch]??ch).join('');
  const lat=splitCompact(latMixed);
  return {spaced:cyr.spaced,compact:cyr.compact,latinSpaced:lat.spaced,latinCompact:lat.compact};
}
function hasAny(v:string,terms:string[]){return terms.some(t=>v.includes(t));}
function anyPattern(values:string[],patterns:RegExp[]){return patterns.some(r=>values.some(v=>r.test(v)));}
function localModeration(raw:string){
  const f=norm(raw);
  const hardRu=['наркот','закладк','кладмен','героин','кокаин','амфетамин','метамфетамин','мефедрон','марихуан','каннабис','экстази','псилоциб','оружи','боеприпас','взрывчат','террор','экстрем','проституц','интимуслуг','сексзаденьги','массовоеубий','массовыйрасстрел','жертвопринош','человеческаяжертв','ритуальноеубий','изнасил','сексуальноенасили','самоубий','суицид','живодер'];
  const hardLat=['narkot','zaklad','heroin','cocaine','kokain','amphetamine','amfetamin','methamphetamine','metamfetamin','mefedron','marijuana','marihuana','cannabis','kanabis','ecstasy','mdma','lsd','psilocybin','weapon','explosive','terror','suicide','rape','prostitution'];
  const hardPatterns=[/массов\S*\s+(убий|расстрел|резн)/u,/убить\s+(люд|человек|кого|всех)/u,/(расстрел|резн[яи]|пытк|казн[ьи]|линч)/u,/(убить|мучить|издев\S*)\s+(кот|кош|собак|живот)/u,/(прыгн\S*\s+с\s+(крыши|моста)|вскрыть\s+вен)/u,/(юз\S*|поюз\S*)\s+(кот|кош|котик)/u,/(упорот|вмаз|ширнут|снюх|под\s+веществ)/u,/(дорожк\S*\s+(кокс|кокаин)|колоть\s+(героин|наркот))/u,/(сексуал\S*|секс)\s+.*(дет|ребен|подрост|несовершеннолет)/u,/mass\w*\s+(kill|shoot|murder)/i,/kill\s+(people|everyone|person)/i,/self\s*harm|suicid/i];
  if(hasAny(f.compact,hardRu)||hasAny(f.latinCompact,hardLat)||anyPattern([f.spaced,f.latinSpaced],hardPatterns))return {status:'block',reason:'dangerous_or_illegal'} as const;

  const reviewRu=['хуй','хуя','хуе','хер','пизд','пиздец','ебан','ебат','ебля','ебуч','ебнут','уеб','заеб','наеб','поеб','выеб','бляд','шлюх','манда','елда','залуп','фаллос','фалос','пенис','писюн','письк','вагин','вареник','сперм','конч','дроч','отсос','минет','куни','порно','оргия','сиськ','титьк','жоп','анус','секс','анал','член','шмаль','гашиш','травка','косяк','спиды','скорость','кислота','таблы','колеса','кокс','эскорт','драка','подраться','мордобой','охотаналюд','кровавыйритуал','сатанинскийритуал','безправил','секретныйадрес','тольконалич','легкиеденьги','100заработ'];
  const reviewLat=['hui','huy','khui','pizda','pizdec','pizdets','ebat','eblya','blyad','blyat','chlen','zalupa','falloc','fallos','penis','vagina','dick','cock','pussy','blowjob','porn','porno','fuck','sex','anal','escort','hashish','gashish','weed'];
  const reviewPatterns=[/(по\s+приколу|рофл|прикол\S*\s+событ)/u,/(кур\S*|забить|пыхн\S*)\s+.*(шмаль|трав|косяк|гаш)/u,/(поюз\S*|юз\S*)\s+.*(веществ|табл|колес|скорост)/u,/\b(fuck|blowjob|pussy|cock|dick|porn)\w*/i];
  if(hasAny(f.compact,reviewRu)||hasAny(f.latinCompact,reviewLat)||anyPattern([f.spaced,f.latinSpaced],reviewPatterns))return {status:'review',reason:'slang_or_ambiguous'} as const;
  return {status:'published',reason:'local_rules_clean'} as const;
}

async function resolveOpenAIKey(){
  const envKey=Deno.env.get('OPENAI_API_KEY');
  if(envKey)return envKey;
  try{
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const {data,error}=await db.rpc('chaika_openai_api_key');
    if(!error&&data)return String(data);
  }catch(error){console.error('OpenAI Vault lookup failed',error);}
  return '';
}

async function aiModeration(text:string,image:string){
  const apiKey=await resolveOpenAIKey();if(!apiKey)return {available:false,flagged:false,severe:false,reason:'openai_key_missing'};
  try{
    const input:any[]=[{type:'text',text}];if(image)input.push({type:'image_url',image_url:{url:image}});
    let lastStatus=0;
    for(let attempt=0;attempt<2;attempt++){
      const r=await fetch('https://api.openai.com/v1/moderations',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'omni-moderation-latest',input})});
      lastStatus=r.status;
      if(r.ok){
        const j=await r.json(),res=j?.results?.[0]||{},c=res.categories||{},scores=res.category_scores||{};
        const severe=Boolean(c['sexual/minors']||c['hate/threatening']||c['violence/graphic']||c['self-harm/instructions']||c['self-harm/intent']||c['illicit/violent']);
        const flaggedCategories=Object.entries(c).filter(([,v])=>Boolean(v)).map(([k])=>k);
        return {available:true,flagged:Boolean(res.flagged),severe,reason:flaggedCategories.length?`ai:${flaggedCategories.join(',')}`:'ai_clean',model:j?.model||'omni-moderation-latest',categories:c,scores};
      }
      const body=await r.text();console.error('OpenAI moderation HTTP',r.status,body.slice(0,500));
      if(r.status!==429)break;
      if(attempt===0)await new Promise(resolve=>setTimeout(resolve,700));
    }
    return {available:true,flagged:false,severe:false,error:true,reason:`openai_http_${lastStatus||'error'}`};
  }catch(error){console.error('OpenAI moderation failed',error);return {available:true,flagged:false,severe:false,error:true,reason:'openai_request_failed'};}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return out({error:'method_not_allowed'},405);
  try{
    const body=await req.json(),u=await verify(String(body.initData||'')),e=body.event||{};
    const title=String(e.title||'').trim(),category=String(e.category||''),type=String(e.event_type||'planned'),venue=String(e.venue||'').trim(),description=String(e.description||'').trim();
    if(title.length<3||title.length>70)throw new Error('invalid_title');if(!cats.has(category))throw new Error('invalid_category');if(!['planned','instant'].includes(type))throw new Error('invalid_event_type');if(venue.length<2||venue.length>140)throw new Error('invalid_venue');if(description.length>500)throw new Error('description_too_long');
    const starts=new Date(e.starts_at);if(Number.isNaN(starts.getTime())||starts.getTime()<Date.now()-2*3600000||starts.getTime()>Date.now()+31*86400000)throw new Error('invalid_start_time');let expires:null|string=null;if(type==='instant'){const x=new Date(e.expires_at);if(Number.isNaN(x.getTime())||x.getTime()<=Date.now()||x.getTime()>Date.now()+5*3600000)throw new Error('invalid_expiry');expires=x.toISOString();}
    const price=Number(e.price_rub||0),age=Number(e.age_limit||0),lat=Number(e.lat),lng=Number(e.lng);if(!Number.isFinite(price)||price<0||price>1000000)throw new Error('invalid_price');if(![0,16,18].includes(age))throw new Error('invalid_age');if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)throw new Error('invalid_coordinates');
    const image=String(e.image_url||'');if(image.length>1500000)throw new Error('image_too_large');if(image&&!(image.startsWith('data:image/jpeg;base64,')||image.startsWith('data:image/png;base64,')||image.startsWith('data:image/webp;base64,')||image.startsWith('https://')||image.startsWith('http://')))throw new Error('invalid_image');const ticketUrl=String(e.ticket_url||'').trim();if(ticketUrl&&!/^https?:\/\//i.test(ticketUrl))throw new Error('invalid_ticket_url');

    const allText=`Название: ${title}\nОписание: ${description}\nМесто: ${venue}`;const local=localModeration(allText);if(local.status==='block')throw new Error('event_blocked');
    const ai=await aiModeration(allText,image);if(ai.severe)throw new Error('event_blocked');
    let mod:'published'|'review'=local.status==='review'?'review':'published';let reason=local.reason;if(ai.flagged){mod='review';reason=ai.reason||'ai_flagged'}if(image&&(!ai.available||ai.error)){mod='review';reason='image_requires_manual_review'}
    const metadata={local:{status:local.status,reason:local.reason},ai:{available:Boolean(ai.available),flagged:Boolean(ai.flagged),severe:Boolean(ai.severe),reason:ai.reason||null,model:(ai as any).model||null,categories:(ai as any).categories||null,scores:(ai as any).scores||null},has_image:Boolean(image)};

    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),now=new Date().toISOString();
    const profile={telegram_user_id:Number(u.id),username:u.username||null,first_name:u.first_name||'',last_name:u.last_name||null,language_code:u.language_code||null,photo_url:u.photo_url||null,is_premium:Boolean(u.is_premium),allows_write_to_pm:u.allows_write_to_pm??null,updated_at:now,last_auth_at:now};const {error:ue}=await db.from('telegram_users').upsert(profile,{onConflict:'telegram_user_id'});if(ue)throw ue;
    const row={title,category,event_type:type,starts_at:starts.toISOString(),expires_at:expires,price_rub:price,venue,lat,lng,age_limit:age,description,ticket_url:ticketUrl||null,image_url:image||null,organizer_name:String(u.first_name||'Пользователь').slice(0,80),telegram_owner_id:Number(u.id),promoted:false,moderation_status:mod,moderation_reason:reason,moderation_metadata:metadata,moderated_at:now,going_count:0};
    const {data,error}=await db.from('events').insert(row).select('id,moderation_status,moderation_reason').single();if(error)throw error;
    return out({ok:true,...data,moderation_engine:ai.available?'rules+openai-omni':'rules+manual-image-review'});
  }catch(err){const m=err instanceof Error?err.message:'create_failed';const status=m==='bot_not_configured'?503:(m.includes('signature')||m.includes('init_data')||m.includes('user_')||m==='hash_missing'?401:400);return out({ok:false,error:m},status);}
});