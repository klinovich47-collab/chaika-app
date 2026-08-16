import { createClient } from "npm:@supabase/supabase-js@2";

const DAY=86400000;
const SPB={latMin:58.8,latMax:60.3,lngMin:29.2,lngMax:31.2};
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors,"Content-Type":"application/json"}});

function clean(v:unknown,max=500){return String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim().slice(0,max)}
function httpsUrl(v:unknown){const s=String(v||'').trim();if(!s)return null;if(s.startsWith('//'))return'https:'+s;if(s.startsWith('http://'))return'https://'+s.slice(7);return/^https:\/\//i.test(s)?s:null}
function coords(a:unknown,b:unknown){let lat=Number(a),lng=Number(b);if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;if(lat>=SPB.latMin&&lat<=SPB.latMax&&lng>=SPB.lngMin&&lng<=SPB.lngMax)return[lat,lng]as const;if(lng>=SPB.latMin&&lng<=SPB.latMax&&lat>=SPB.lngMin&&lat<=SPB.lngMax)return[lng,lat]as const;return null}
function age(v:unknown){const n=Number(String(v||'').match(/\d+/)?.[0]||0);return n>=18?18:n>=16?16:0}
function price(v:unknown,isFree=false){if(isFree)return 0;const nums=String(v||'').replace(/\s/g,'').match(/\d+/g)?.map(Number).filter(Number.isFinite)||[];return nums.length?Math.min(...nums):0}
function museumVenue(v:string){return/(музей|эрмитаж|русский музей|эрарта|манеж|росфото|артмуза|галере)/i.test(v)}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  try{
    const now=new Date(),until=new Date(Date.now()+31*DAY);
    const q=new URLSearchParams({location:'spb',actual_since:String(Math.floor((now.getTime()-120*DAY)/1000)),actual_until:String(Math.floor(until.getTime()/1000)),categories:'exhibition',fields:'id,title,description,dates,place,categories,age_restriction,price,is_free,images,site_url',expand:'place,dates',text_format:'text',page_size:'100'});
    const rows:any[]=[];
    const moscowDayStart=Math.floor((now.getTime()+3*3600000)/DAY)*DAY-3*3600000;
    let next:string|null=`https://kudago.com/public-api/v1.4/events/?${q}`,pages=0;
    while(next&&pages<8){
      const response=await fetch(next,{headers:{Accept:'application/json','User-Agent':'CHAIKA/1.0 museum importer'}});
      if(!response.ok)throw new Error(`kudago_exhibition_${response.status}`);
      const payload=await response.json();
      for(const event of payload?.results||[]){
        const place=event.place||{},venue=clean(place.title||place.address||'Санкт-Петербург',140),xy=coords(place?.coords?.lat,place?.coords?.lon);
        if(!museumVenue(venue)||!xy)continue;
        const title=clean(event.title,100);if(title.length<3)continue;
        const periods=(event.dates||[]).map((date:any)=>{const start=Number(date.start)*1000,end=Number(date.end||date.start)*1000;return{start,end,continuous:Boolean(date.is_continuous)||end-start>36*3600000}}).filter((date:any)=>Number.isFinite(date.start)&&Number.isFinite(date.end)&&date.end>=now.getTime()&&date.start<=until.getTime()).sort((a:any,b:any)=>a.start-b.start);
        const seen=new Set<string>();
        for(const period of periods){
          const suffix=period.continuous?`range:${Math.floor(period.start/1000)}`:String(Math.floor(period.start/1000));
          if(seen.has(suffix))continue;seen.add(suffix);
          const displayStart=period.continuous&&period.start<moscowDayStart?moscowDayStart:period.start;
          const displayEnd=period.continuous?Math.min(period.end,until.getTime()):period.end;
          rows.push({title,category:'museum',event_type:'planned',starts_at:new Date(displayStart).toISOString(),expires_at:displayEnd>displayStart?new Date(displayEnd).toISOString():null,price_rub:price(event.price,Boolean(event.is_free)),venue,lat:xy[0],lng:xy[1],age_limit:age(event.age_restriction),description:clean(event.description,700),ticket_url:httpsUrl(event.site_url),image_url:httpsUrl(event.images?.[0]?.image),organizer_name:'KudaGo',telegram_owner_id:null,promoted:false,moderation_status:'published',going_count:0,source:'kudago',source_event_id:`${event.id}:${suffix}`,source_url:httpsUrl(event.site_url),imported_at:new Date().toISOString()});
        }
      }
      next=payload?.next||null;pages++;
    }
    let upserted=0;
    for(let i=0;i<rows.length;i+=100){const{data,error}=await db.from('events').upsert(rows.slice(i,i+100),{onConflict:'source,source_event_id'}).select('id');if(error)throw error;upserted+=data?.length||0}
    return json({ok:true,found:rows.length,upserted});
  }catch(e){console.error(e);return json({ok:false,error:e instanceof Error?e.message:'museum_import_failed'},500)}
});
