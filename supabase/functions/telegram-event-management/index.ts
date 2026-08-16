import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const enc=new TextEncoder();
const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});

async function mac(key:Uint8Array,msg:string){const k=await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(msg)));}
const hx=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
function eq(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function verify(raw:string){
  const token=Deno.env.get("TELEGRAM_BOT_TOKEN");if(!token)throw new Error("bot_not_configured");
  const p=new URLSearchParams(raw),hash=(p.get("hash")||"").toLowerCase(),auth=Number(p.get("auth_date")||0),now=Math.floor(Date.now()/1000);
  if(!hash)throw new Error("hash_missing");if(!auth||auth>now+300||now-auth>86400)throw new Error("init_data_expired");
  const chk=(drop=false)=>[...p.entries()].filter(([k])=>k!=="hash"&&(!drop||k!=="signature")).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");
  const secret=await mac(enc.encode("WebAppData"),token);let ok=eq(hx(await mac(secret,chk(false))),hash);if(!ok&&p.has("signature"))ok=eq(hx(await mac(secret,chk(true))),hash);if(!ok)throw new Error("signature_invalid");
  const u=JSON.parse(p.get("user")||"null");if(!u?.id)throw new Error("user_missing");return u;
}

async function telegram(method:string,payload:Record<string,unknown>){
  const token=Deno.env.get("TELEGRAM_BOT_TOKEN");if(!token)throw new Error("bot_not_configured");
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>({ok:false,description:`HTTP ${r.status}`}));
  if(!r.ok||!data?.ok)throw new Error(`telegram_${method}:${String(data?.description||r.status)}`);
  return data.result;
}

function normalizeForumUsername(raw:unknown){
  let value=String(raw||"").trim();
  value=value.replace(/^https?:\/\/(?:www\.)?t\.me\//i,"").replace(/^@/,"").split(/[/?#]/)[0].trim();
  return value;
}

const fields='id,title,category,event_type,starts_at,expires_at,price_rub,venue,lat,lng,age_limit,description,ticket_url,image_url,promoted,moderation_status,moderation_reason,moderation_metadata,moderated_at,going_count,created_at,organizer_name,telegram_owner_id,source,source_url';

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405);
  try{
    const body=await req.json(),u=await verify(String(body.initData||'')),action=String(body.action||'dashboard');
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),uid=Number(u.id);
    const {data:profile,error:pe}=await db.from('telegram_users').select('telegram_user_id,is_admin,is_moderator').eq('telegram_user_id',uid).maybeSingle();if(pe)throw pe;
    const isAdmin=Boolean(profile?.is_admin);
    const isModerator=Boolean(profile?.is_moderator);
    const canModerate=isAdmin||isModerator;

    if(action==='dashboard'){
      const {data:mine,error:me}=await db.from('events').select(fields).eq('telegram_owner_id',uid).order('created_at',{ascending:false}).limit(100);if(me)throw me;
      let moderation:any[]=[];
      if(canModerate){const {data,error}=await db.from('events').select(fields).or('source.is.null,moderation_status.eq.review').order('created_at',{ascending:false}).limit(200);if(error)throw error;moderation=data||[];}
      return reply({ok:true,is_admin:isAdmin,is_moderator:isModerator,can_moderate:canModerate,my_events:mine||[],moderation});
    }

    if(action==='forum_status'){
      if(!isAdmin)return reply({ok:false,error:'forbidden'},403);
      const {data,error}=await db.from('chaika_app_config').select('forum_chat_id,forum_username,forum_title,updated_at').eq('id','telegram_forum').maybeSingle();if(error)throw error;
      return reply({ok:true,forum:data?{configured:true,chat_id:data.forum_chat_id,username:data.forum_username,title:data.forum_title,updated_at:data.updated_at}:{configured:false}});
    }

    if(action==='forum_configure'){
      if(!isAdmin)return reply({ok:false,error:'forbidden'},403);
      const username=normalizeForumUsername(body.forumUsername);
      if(!/^[A-Za-z0-9_]{5,32}$/.test(username))return reply({ok:false,error:'invalid_forum_username'},400);
      const chat=await telegram('getChat',{chat_id:`@${username}`});
      if(chat?.type!=='supergroup')return reply({ok:false,error:'forum_must_be_supergroup'},400);
      if(!chat?.is_forum)return reply({ok:false,error:'topics_not_enabled'},400);
      if(!chat?.username)return reply({ok:false,error:'forum_must_be_public'},400);
      const me=await telegram('getMe',{});
      const member=await telegram('getChatMember',{chat_id:chat.id,user_id:me.id});
      const canManage=member?.status==='creator'||(member?.status==='administrator'&&Boolean(member?.can_manage_topics));
      if(!canManage)return reply({ok:false,error:'bot_needs_manage_topics'},400);

      const {data:previous,error:prevError}=await db.from('chaika_app_config').select('forum_chat_id').eq('id','telegram_forum').maybeSingle();if(prevError)throw prevError;
      if(previous?.forum_chat_id&&String(previous.forum_chat_id)!==String(chat.id)){
        const {error:clearError}=await db.from('event_forum_topics').delete().neq('chat_id',chat.id);if(clearError)throw clearError;
      }
      const now=new Date().toISOString();
      const row={id:'telegram_forum',forum_chat_id:chat.id,forum_username:String(chat.username),forum_title:String(chat.title||'ЧАЙКА'),configured_by:uid,updated_at:now};
      const {error:upsertError}=await db.from('chaika_app_config').upsert(row,{onConflict:'id'});if(upsertError)throw upsertError;
      return reply({ok:true,forum:{configured:true,chat_id:chat.id,username:String(chat.username),title:String(chat.title||'ЧАЙКА'),updated_at:now}});
    }

    const eventId=String(body.eventId||'');if(!/^[0-9a-f-]{36}$/i.test(eventId))throw new Error('invalid_event_id');
    const {data:event,error:ee}=await db.from('events').select('id,telegram_owner_id,moderation_metadata').eq('id',eventId).maybeSingle();if(ee)throw ee;if(!event)throw new Error('event_not_found');
    if(action==='delete'){
      if(!canModerate&&Number(event.telegram_owner_id)!==uid)return reply({ok:false,error:'forbidden'},403);
      const {error}=await db.from('events').delete().eq('id',eventId);if(error)throw error;return reply({ok:true,deleted:true});
    }
    if(action==='moderate'){
      if(!canModerate)return reply({ok:false,error:'forbidden'},403);
      const decision=String(body.decision||'');if(!['published','rejected'].includes(decision))throw new Error('invalid_decision');
      const at=new Date().toISOString(),role=isAdmin?'admin':'moderator',metadata={...(event.moderation_metadata||{}),reviewer:{telegram_user_id:uid,role,decision,at}};
      const {error}=await db.from('events').update({moderation_status:decision,moderation_reason:`${role}_${decision}`,moderation_metadata:metadata,moderated_at:at,updated_at:at}).eq('id',eventId);if(error)throw error;
      return reply({ok:true,status:decision});
    }
    return reply({ok:false,error:'unknown_action'},400);
  }catch(e){
    const m=e instanceof Error?e.message:'management_failed';
    return reply({ok:false,error:m},m.includes('signature')||m.includes('init_data')||m==='hash_missing'||m==='user_missing'?401:400);
  }
});
