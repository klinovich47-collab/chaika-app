import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const enc=new TextEncoder();
const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});
async function mac(key:Uint8Array,msg:string){const k=await crypto.subtle.importKey("raw",key,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",k,enc.encode(msg)));}
const hx=(b:Uint8Array)=>[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
function eq(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function verify(raw:string){const token=Deno.env.get("TELEGRAM_BOT_TOKEN");if(!token)throw new Error("bot_not_configured");const p=new URLSearchParams(raw),hash=(p.get("hash")||"").toLowerCase(),auth=Number(p.get("auth_date")||0),now=Math.floor(Date.now()/1000);if(!hash)throw new Error("hash_missing");if(!auth||auth>now+300||now-auth>86400)throw new Error("init_data_expired");const chk=(drop=false)=>[...p.entries()].filter(([k])=>k!=="hash"&&(!drop||k!=="signature")).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join("\n");const secret=await mac(enc.encode("WebAppData"),token);let ok=eq(hx(await mac(secret,chk(false))),hash);if(!ok&&p.has("signature"))ok=eq(hx(await mac(secret,chk(true))),hash);if(!ok)throw new Error("signature_invalid");const u=JSON.parse(p.get("user")||"null");if(!u?.id)throw new Error("user_missing");return u;}
const esc=(s:string)=>s.replace(/[&<>]/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':'&gt;');
async function tg(method:string,payload:Record<string,unknown>){const token=Deno.env.get('TELEGRAM_BOT_TOKEN')!;const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!j.ok)throw new Error(`telegram_${method}:${j.description||r.status}`);return j.result;}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({ok:false,error:'method_not_allowed'},405);
 try{
  const body=await req.json(); const user=await verify(String(body.initData||''));
  const kind=String(body.kind||'other'); const allowed=new Set(['problem','idea','other']);
  const message=String(body.message||'').trim(); if(!allowed.has(kind)||message.length<3||message.length>2000)return reply({ok:false,error:'invalid_feedback'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  const {data:cfg,error:cfgErr}=await db.from('chaika_app_config').select('forum_chat_id,forum_username').eq('id','telegram_forum').maybeSingle(); if(cfgErr)throw cfgErr; if(!cfg?.forum_chat_id||!cfg?.forum_username)throw new Error('forum_not_configured');
  let {data:topic,error:topicErr}=await db.from('support_forum_topic').select('*').eq('id','support').maybeSingle(); if(topicErr)throw topicErr;
  if(!topic){
   const created=await tg('createForumTopic',{chat_id:cfg.forum_chat_id,name:'🛟 Техподдержка ЧАЙКИ'});
   const row={id:'support',chat_id:cfg.forum_chat_id,chat_username:cfg.forum_username,message_thread_id:created.message_thread_id,topic_name:'🛟 Техподдержка ЧАЙКИ',updated_at:new Date().toISOString()};
   const {data:inserted,error}=await db.from('support_forum_topic').insert(row).select('*').single(); if(error)throw error; topic=inserted;
   await tg('sendMessage',{chat_id:topic.chat_id,message_thread_id:topic.message_thread_id,text:'🛟 <b>Техподдержка ЧАЙКИ</b>\n\nСюда автоматически приходят отзывы и сообщения пользователей из приложения.',parse_mode:'HTML'});
  }
  const labels:Record<string,string>={problem:'🐞 Проблема',idea:'💡 Идея',other:'💬 Другое'};
  const name=[user.first_name,user.last_name].filter(Boolean).join(' ')||'Пользователь';
  const username=user.username?`@${user.username}`:'без username';
  const ctx=body.context&&typeof body.context==='object'?body.context:{};
  const lines=[`<b>${labels[kind]}</b>`,`👤 ${esc(name)} · ${esc(username)} · <code>${user.id}</code>`,``,`<b>Сообщение:</b>`,`${esc(message)}`];
  const meta=[ctx.view?`Экран: ${ctx.view}`:'',ctx.version?`Версия: ${ctx.version}`:'',ctx.platform?`Платформа: ${ctx.platform}`:''].filter(Boolean);
  if(meta.length)lines.push('',`<i>${esc(meta.join(' · '))}</i>`);
  await tg('sendMessage',{chat_id:topic.chat_id,message_thread_id:topic.message_thread_id,text:lines.join('\n'),parse_mode:'HTML',disable_web_page_preview:true});
  return reply({ok:true});
 }catch(e){const m=e instanceof Error?e.message:'support_failed';const auth=m.includes('signature')||m.includes('init_data')||m==='hash_missing'||m==='user_missing';return reply({ok:false,error:m},auth?401:400);}
});