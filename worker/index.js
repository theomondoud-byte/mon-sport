/** Cloudflare Worker: proxy RSS Google News et TheSportsDB. Aucune clé privée. */
const API='https://www.thesportsdb.com/api/v1/json/123/';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300',...cors}});
const HTML_ENTITIES={"eacute":"é","egrave":"è","ecirc":"ê","euml":"ë","agrave":"à","acirc":"â","auml":"ä","ccedil":"ç","ocirc":"ô","oelig":"œ","ugrave":"ù","ucirc":"û","uuml":"ü","iuml":"ï","icirc":"î","yuml":"ÿ","Eacute":"É","Egrave":"È","Ecirc":"Ê","Euml":"Ë","Agrave":"À","Acirc":"Â","Auml":"Ä","Ccedil":"Ç","Ocirc":"Ô","Oelig":"Œ","Ugrave":"Ù","Ucirc":"Û","Uuml":"Ü","Iuml":"Ï","Icirc":"Î","Yuml":"Ÿ","nbsp":" ","rsquo":"’","lsquo":"‘","rdquo":"”","ldquo":"“","ndash":"–","mdash":"—","hellip":"…","euro":"€","apos":"'","quot":"\"","amp":"&","lt":"<","gt":">"};
function decode(s=''){return String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&([a-z]+);/gi,(all,name)=>HTML_ENTITIES[name]??all).trim()}
function tag(xml,name){const pattern=new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i');return decode(xml.match(pattern)?.[1]||'')}
function limit(s,n){return String(s||'').trim().slice(0,n)}
async function getJson(url){const r=await fetch(url,{cf:{cacheTtl:900,cacheEverything:true},headers:{'User-Agent':'MonSport/1.0'}});if(!r.ok)throw Error('Source sportive HTTP '+r.status);return r.json()}

const RSS_FEEDS=[
 {name:'Tennis Actu',sport:'Tennis',url:'https://www.tennisactu.net/rss_social.xml'},
 {name:'Franceinfo',sport:'Tennis',url:'https://www.franceinfo.fr/sports/tennis.rss'},
 {name:'Franceinfo',sport:'Football',url:'https://www.franceinfo.fr/sports/foot.rss'},
 {name:'Basket USA',sport:'Basketball',url:'https://www.basketusa.com/feed/'},
 {name:'TrashTalk',sport:'Basketball',url:'https://trashtalk.co/feed/'},
 {name:'Franceinfo',sport:'Rugby',url:'https://www.franceinfo.fr/sports/rugby.rss'},
 {name:"Cyclism'Actu",sport:'Cyclisme',url:'https://www.cyclismactu.net/rss_social.xml'},
 {name:'Franceinfo',sport:'Cyclisme',url:'https://www.franceinfo.fr/sports/cyclisme.rss'},
 {name:'Franceinfo',sport:'Natation',url:'https://www.franceinfo.fr/sports/natation.rss'},
 {name:'Franceinfo',sport:'Tennis de table',url:'https://www.franceinfo.fr/sports/tennis-de-table.rss'}
];
function xmlValue(xml,names){
 for(const name of names){
  const escaped=name;
  const match=xml.match(new RegExp('<'+escaped+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+escaped+'>','i'));
  if(match){
   const raw=match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');
   return decode(raw.replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
  }
 }
 return '';
}
function feedItems(xml){return xml.match(/<(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:item|entry)>/gi)||[];}
function feedLink(item){
 const value=xmlValue(item,['link']);
 if(/^https?:\/\//i.test(value))return value;
 return item.match(/<link\b[^>]*href=["']([^"']+)["']/i)?.[1]||'';
}
function feedImage(item){
 const match=item.match(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*url=["']([^"']+)["']/i)
  ||item.match(/<img\b[^>]*src=["']([^"']+)["']/i);
 const url=decode(match?.[1]||'');
 return /^https:\/\//i.test(url)?url:'';
}
async function curatedSportsNews(){
 const now=Date.now(),start=now-7*86400000;
 const settled=await Promise.allSettled(RSS_FEEDS.map(async feed=>{
  const response=await fetch(feed.url,{headers:{'User-Agent':'MonSport/1.0 (+https://github.com/theomondoud-byte/mon-sport)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8'},cf:{cacheTtl:600,cacheEverything:true},signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw Error(feed.name+' HTTP '+response.status);
  const xml=await response.text();
  const articles=feedItems(xml).map(item=>{
   const title=xmlValue(item,['title']),link=feedLink(item);
   const rawDate=xmlValue(item,['pubDate','published','updated','dc:date']);
   const time=Date.parse(rawDate),description=xmlValue(item,['description','summary','content:encoded','content']);
   if(!title||!/^https?:\/\//i.test(link)||!Number.isFinite(time)||time<start||time>now+600000)return null;
   return {title,link,date:new Date(time).toISOString(),source:feed.name,sport:feed.sport,
    excerpt:description.slice(0,600),image:feedImage(item)};
  }).filter(Boolean);
  return articles;
 }));
 const articles=settled.flatMap(result=>result.status==='fulfilled'?result.value:[]);
 const unique=new Map();
 for(const article of articles){const key=article.link.split('#')[0];if(!unique.has(key))unique.set(key,article);}
 return {articles:[...unique.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,60),
  feeds:RSS_FEEDS.map((feed,index)=>({source:feed.name,sport:feed.sport,ok:settled[index].status==='fulfilled',count:settled[index].status==='fulfilled'?settled[index].value.length:0}))};
}

async function articleText(rawUrl){
 let url;try{url=new URL(rawUrl)}catch{return {text:''}}
 const allowed=['tennisactu.net','franceinfo.fr','basketusa.com','trashtalk.co','cyclismactu.net','fflose.com','espn.com'];
 if(url.protocol!=='https:'||!allowed.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))throw Error('Source non autorisée pour la lecture intégrée');
 const response=await fetch(url.href,{headers:{'User-Agent':'Mozilla/5.0 (compatible; MonSport/1.0)','Accept':'text/html'},redirect:'follow',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Article inaccessible (HTTP '+response.status+')');
 const finalUrl=new URL(response.url);
 if(!allowed.some(host=>finalUrl.hostname===host||finalUrl.hostname.endsWith('.'+host)))throw Error('Redirection vers un domaine non autorisé');
 const html=(await response.text()).slice(0,1800000);
 const candidates=[...html.matchAll(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>m[2]);
 let body=candidates.sort((a,b)=>b.length-a.length)[0]||html;
 body=body.replace(/<(script|style|nav|header|footer|aside|form|noscript|svg|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<(?:br|\/p|\/h[1-6]|\/li|\/div|\/section)\b[^>]*>/gi,'\n')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"')
  .replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/[ \t]+/g,' ').replace(/\n\s*/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
 return {text:body.slice(0,18000),truncated:body.length>18000,source:finalUrl.hostname};
}
async function team(name){const found=await getJson(API+'searchteams.php?t='+encodeURIComponent(name));const teams=found.teams||[];const normalized=name.toLocaleLowerCase();const t=teams.find(x=>x.strTeam?.toLocaleLowerCase()===normalized)||teams[0];if(!t?.idTeam)return {events:[],note:'Équipe introuvable via API gratuite'};const calls=await Promise.allSettled(['eventslast.php?id=','eventsnext.php?id='].map(s=>getJson(API+s+encodeURIComponent(t.idTeam))));const raw=calls.flatMap(r=>r.status==='fulfilled'?(r.value.results||r.value.events||[]):[]);const events=raw.map(e=>({id:e.idEvent,home:e.strHomeTeam||'',away:e.strAwayTeam||'',homeScore:e.intHomeScore??null,awayScore:e.intAwayScore??null,date:e.strTimestamp||(e.dateEvent?e.dateEvent+'T'+(e.strTime||'12:00:00'):'') ,status:e.strStatus||((e.intHomeScore!==null&&e.intHomeScore!==undefined)?'Terminé':'À venir')}));return {events,note:'L’API gratuite peut ne renvoyer que certains matchs à domicile.'}}
async function news(q){
 const query=q+' when:7d',url='https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl=fr&gl=FR&ceid=FR:fr';
 const r=await fetch(url,{cf:{cacheTtl:600,cacheEverything:true},headers:{'User-Agent':'Mozilla/5.0 (compatible; MonSport/1.0)'}});
 if(!r.ok)throw Error('Google News HTTP '+r.status);
 const xml=await r.text(),items=xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi)||[];
 const now=Date.now(),start=now-7*86400000;
 const plain=v=>decode(String(v||'').replace(/<[^>]*>/g,' ')).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const articles=items.map(item=>{
  const date=tag(item,'pubDate'),time=Date.parse(date);
  if(!Number.isFinite(time)||time<start||time>now+600000)return null;
  const media=item.match(/<media:(?:thumbnail|content)\\b[^>]*\\burl=["']([^"']+)["']/i)?.[1]
   ||item.match(/<enclosure\\b[^>]*\\burl=["']([^"']+)["'][^>]*\\btype=["']image\\//i)?.[1]||'';
  const image=decode(media);
  return {title:tag(item,'title'),link:tag(item,'link'),source:tag(item,'source')||'Google Actualités',date,
   excerpt:plain(tag(item,'description')).slice(0,550),image:/^https:\/\//i.test(image)?image:''};
 }).filter(x=>x&&x.title&&/^https?:\/\//.test(x.link)).sort((x,y)=>Date.parse(y.date)-Date.parse(x.date));
 return {articles:articles.slice(0,12)};
}
export default {async fetch(request){if(request.method==='OPTIONS')return new Response(null,{headers:cors});if(request.method!=='GET')return json({error:'Méthode non autorisée'},405);const u=new URL(request.url);try{if(u.pathname==='/api/sports-news')return json(await curatedSportsNews());if(u.pathname==='/api/article'){const target=limit(u.searchParams.get('url'),2048);if(!target)return json({error:'URL manquante'},400);return json(await articleText(target));}if(u.pathname==='/api/news'){const q=limit(u.searchParams.get('q'),120);if(q.length<2)return json({error:'Recherche trop courte'},400);return json(await news(q))}if(u.pathname==='/api/team'){const name=limit(u.searchParams.get('name'),100);if(name.length<2)return json({error:'Nom trop court'},400);return json(await team(name))}return json({service:'Mon Sport API',endpoints:['/api/news?q=PSG','/api/sports-news','/api/article?url=https%3A%2F%2Fwww.basketusa.com%2F','/api/team?name=Real%20Madrid']})}catch(e){return json({error:String(e.message||e)},502)}}};
