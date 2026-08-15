import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const enc=new TextEncoder();
const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});

async function mac(key:Uint8Array,msg:string){const k=await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(msg)));}
const toHex=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
function same(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function verify(raw:string){
  const token=Deno.env.get("TELEGRAM_BOT_TOKEN");if(!token)throw new Error("bot_not_configured");
  const p=new URLSearchParams(raw),hash=(p.get("hash")||"").toLowerCase();if(!hash)throw new Error("hash_missing");
  const auth=Number(p.get("auth_date")||0),now=Math.floor(Date.now()/1000);if(!auth||auth>now+300||now-auth>86400)throw new Error("init_data_expired");
  const check=(dropSig=false)=>[...p.entries()].filter(([k])=>k!=="hash"&&(!dropSig||k!=="signature")).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");
  const secret=await mac(enc.encode("WebAppData"),token);let ok=same(toHex(await mac(secret,check(false))),hash);if(!ok&&p.has("signature"))ok=same(toHex(await mac(secret,check(true))),hash);if(!ok)throw new Error("signature_invalid");
  const user=JSON.parse(p.get("user")||"null");if(!user?.id)throw new Error("user_missing");return user;
}

async function telegram(method:string,payload:Record<string,unknown>){
  const token=Deno.env.get("TELEGRAM_BOT_TOKEN");if(!token)throw new Error("bot_not_configured");
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>({ok:false,description:`HTTP ${r.status}`}));
  if(!r.ok||!data?.ok)throw new Error(`telegram_${method}:${String(data?.description||r.status)}`);
  return data.result;
}

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const html=(value:unknown)=>String(value??"").replace(/[&<>]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[ch]||ch));
const topicColors:Record<string,number>={music:13338331,guitar:16766590,mic:16749490,party:16478047,drink:16766590,art:16749490,sport:7322096,walk:9367192,chat:9367192,coffee:16766590,chess:7322096,game:13338331,study:7322096,dating:16749490,dog:16766590,other:7322096};

async function readyTopic(db:any,eventId:string,chatId:number,username:string){
  const {data,error}=await db.from('event_forum_topics').select('event_id,chat_id,message_thread_id,status,lease_until,attempt_count,updated_at').eq('event_id',eventId).maybeSingle();
  if(error)throw error;
  if(data?.status==='ready'&&String(data.chat_id)===String(chatId)&&data.message_thread_id){
    return {available:true,url:`https://t.me/${username}/${Number(data.message_thread_id)}`,thread_id:Number(data.message_thread_id)};
  }
  return {available:false,row:data||null};
}

async function ensureEventChat(db:any,event:any,userId:number){
  const {data:config,error:configError}=await db.from('chaika_app_config').select('forum_chat_id,forum_username,forum_title').eq('id','telegram_forum').maybeSingle();
  if(configError)throw configError;
  if(!config?.forum_chat_id||!config?.forum_username)return {chat_available:false,chat_error:'forum_not_configured'};
  const chatId=Number(config.forum_chat_id),username=String(config.forum_username);

  let current=await readyTopic(db,event.id,chatId,username);
  if(current.available)return {chat_available:true,chat_url:current.url,message_thread_id:current.thread_id};

  if(current.row&&String(current.row.chat_id)!==String(chatId)){
    const {error}=await db.from('event_forum_topics').delete().eq('event_id',event.id);if(error)throw error;
    current={available:false,row:null};
  }

  const now=new Date(),leaseUntil=new Date(Date.now()+20000).toISOString();
  let claimed=false;
  if(!current.row){
    const {error}=await db.from('event_forum_topics').insert({event_id:event.id,chat_id:chatId,chat_username:username,status:'creating',lease_until:leaseUntil,attempt_count:1,created_by:userId,updated_at:now.toISOString()});
    if(!error)claimed=true;else if(error.code!=='23505')throw error;
  }else if(current.row.status==='error'){
    const {data,error}=await db.from('event_forum_topics').update({chat_id:chatId,chat_username:username,status:'creating',lease_until:leaseUntil,last_error:null,attempt_count:Number(current.row.attempt_count||0)+1,updated_at:now.toISOString()}).eq('event_id',event.id).eq('status','error').select('event_id').maybeSingle();
    if(error)throw error;claimed=Boolean(data);
  }else if(current.row.status==='creating'&&(!current.row.lease_until||new Date(current.row.lease_until).getTime()<Date.now())){
    const {data,error}=await db.from('event_forum_topics').update({chat_id:chatId,chat_username:username,status:'creating',lease_until:leaseUntil,last_error:null,attempt_count:Number(current.row.attempt_count||0)+1,updated_at:now.toISOString()}).eq('event_id',event.id).eq('status','creating').lt('lease_until',now.toISOString()).select('event_id').maybeSingle();
    if(error)throw error;claimed=Boolean(data);
  }

  if(!claimed){
    for(let i=0;i<10;i++){
      await sleep(250);
      const waited=await readyTopic(db,event.id,chatId,username);
      if(waited.available)return {chat_available:true,chat_url:waited.url,message_thread_id:waited.thread_id};
      if(waited.row?.status==='error')return {chat_available:false,chat_error:'topic_creation_failed'};
    }
    return {chat_available:false,chat_pending:true,chat_error:'topic_creation_pending'};
  }

  try{
    const topicName=String(event.title||'Событие ЧАЙКИ').trim().slice(0,128)||'Событие ЧАЙКИ';
    const topic=await telegram('createForumTopic',{chat_id:chatId,name:topicName,icon_color:topicColors[String(event.category||'other')]||7322096});
    const threadId=Number(topic?.message_thread_id);if(!Number.isFinite(threadId)||threadId<=0)throw new Error('invalid_topic_id');
    const url=`https://t.me/${username}/${threadId}`;
    const updatedAt=new Date().toISOString();
    const {error:updateError}=await db.from('event_forum_topics').update({message_thread_id:threadId,chat_username:username,topic_url:url,status:'ready',lease_until:null,last_error:null,updated_at:updatedAt}).eq('event_id',event.id);if(updateError)throw updateError;

    const eventLink=`https://t.me/chaika47bot?startapp=${encodeURIComponent(`event_${event.id}`)}`;
    const starts=new Date(event.starts_at).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'});
    const intro=`<b>${html(event.title)}</b>\n${html(starts)} · ${html(event.venue||'')}\n\nЭто общий чат участников события в ЧАЙКЕ. Договоритесь здесь, где встретиться и как найти друг друга.\n\n<a href="${eventLink}">Открыть событие в ЧАЙКЕ</a>`;
    telegram('sendMessage',{chat_id:chatId,message_thread_id:threadId,text:intro,parse_mode:'HTML',disable_web_page_preview:true}).catch(error=>console.error('CHAIKA topic intro',error));
    return {chat_available:true,chat_url:url,message_thread_id:threadId};
  }catch(error){
    const message=error instanceof Error?error.message:'topic_creation_failed';
    await db.from('event_forum_topics').update({status:'error',lease_until:null,last_error:message.slice(0,500),updated_at:new Date().toISOString()}).eq('event_id',event.id);
    console.error('CHAIKA event chat',message);
    return {chat_available:false,chat_error:message};
  }
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405);
  try{
    const body=await req.json(),user=await verify(String(body.initData||'')),eventId=String(body.eventId||''),action=String(body.action||'toggle');
    if(!/^[0-9a-f-]{36}$/i.test(eventId))return reply({ok:false,error:'invalid_event_id'},400);
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const {data:event,error:eventError}=await db.from('events').select('id,title,category,starts_at,venue,moderation_status').eq('id',eventId).maybeSingle();
    if(eventError)throw eventError;if(!event||event.moderation_status!=='published')return reply({ok:false,error:'event_not_found'},404);
    const uid=Number(user.id);

    if(action==='chat'){
      const {data:attendee,error:attendeeError}=await db.from('event_attendees').select('event_id').eq('event_id',eventId).eq('telegram_user_id',uid).maybeSingle();if(attendeeError)throw attendeeError;
      if(!attendee)return reply({ok:false,error:'not_attending'},403);
      const chat=await ensureEventChat(db,event,uid);
      return reply({ok:true,going:true,...chat});
    }

    if(action!=='toggle')return reply({ok:false,error:'unknown_action'},400);
    const {data,error}=await db.rpc('toggle_event_attendance_verified',{p_event_id:eventId,p_telegram_user_id:uid});if(error)throw error;
    const row=Array.isArray(data)?data[0]:data;
    const going=Boolean(row?.going),goingCount=Number(row?.going_count||0);
    if(!going)return reply({ok:true,going:false,going_count:goingCount,chat_available:false});
    const chat=await ensureEventChat(db,event,uid);
    return reply({ok:true,going:true,going_count:goingCount,...chat});
  }catch(e){
    const m=e instanceof Error?e.message:'toggle_failed';
    const authError=m==='bot_not_configured'||m==='hash_missing'||m==='init_data_expired'||m==='signature_invalid'||m==='user_missing';
    return reply({ok:false,error:m},m==='bot_not_configured'?503:authError?401:400);
  }
});