import { createClient } from "npm:@supabase/supabase-js@2";

const headers={"Access-Control-Allow-Origin":"*","Content-Type":"application/json","Cache-Control":"no-store"};

async function hasOpenAIKey(){
  if(Deno.env.get("OPENAI_API_KEY")) return true;
  try{
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
    const {data,error}=await db.rpc("chaika_openai_api_key");
    if(error) return false;
    return Boolean(data);
  }catch{return false;}
}

Deno.serve(async()=>{
  const token=Deno.env.get("TELEGRAM_BOT_TOKEN")||"";
  const openaiConfigured=await hasOpenAIKey();
  if(!token)return new Response(JSON.stringify({configured:false,bot_username:null,openai_moderation_configured:openaiConfigured}),{headers,status:503});
  try{
    const r=await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const j=await r.json();
    return new Response(JSON.stringify({configured:true,bot_username:j?.result?.username||null,bot_name:j?.result?.first_name||null,openai_moderation_configured:openaiConfigured}),{headers,status:r.ok?200:502});
  }catch{
    return new Response(JSON.stringify({configured:true,bot_username:null,openai_moderation_configured:openaiConfigured,error:"telegram_unreachable"}),{headers,status:502});
  }
});