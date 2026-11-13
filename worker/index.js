/** Cloudflare Worker: proxy RSS Google News et TheSportsDB. Aucune clé privée. */
const API='https://www.thesportsdb.com/api/v1/json/123/';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300',...cors}});
const HTML_ENTITIES={"AElig":"Æ","Aacute":"Á","Acirc":"Â","Agrave":"À","Alpha":"Α","Aring":"Å","Atilde":"Ã","Auml":"Ä","Beta":"Β","Ccedil":"Ç","Chi":"Χ","Dagger":"‡","Delta":"Δ","ETH":"Ð","Eacute":"É","Ecirc":"Ê","Egrave":"È","Epsilon":"Ε","Eta":"Η","Euml":"Ë","Gamma":"Γ","Iacute":"Í","Icirc":"Î","Igrave":"Ì","Iota":"Ι","Iuml":"Ï","Kappa":"Κ","Lambda":"Λ","Mu":"Μ","Ntilde":"Ñ","Nu":"Ν","OElig":"Œ","Oacute":"Ó","Ocirc":"Ô","Ograve":"Ò","Omega":"Ω","Omicron":"Ο","Oslash":"Ø","Otilde":"Õ","Ouml":"Ö","Phi":"Φ","Pi":"Π","Prime":"″","Psi":"Ψ","Rho":"Ρ","Scaron":"Š","Sigma":"Σ","THORN":"Þ","Tau":"Τ","Theta":"Θ","Uacute":"Ú","Ucirc":"Û","Ugrave":"Ù","Upsilon":"Υ","Uuml":"Ü","Xi":"Ξ","Yacute":"Ý","Yuml":"Ÿ","Zeta":"Ζ","aacute":"á","acirc":"â","acute":"´","aelig":"æ","agrave":"à","alefsym":"ℵ","alpha":"α","amp":"&","and":"∧","ang":"∠","aring":"å","asymp":"≈","atilde":"ã","auml":"ä","bdquo":"„","beta":"β","brvbar":"¦","bull":"•","cap":"∩","ccedil":"ç","cedil":"¸","cent":"¢","chi":"χ","circ":"ˆ","clubs":"♣","cong":"≅","copy":"©","crarr":"↵","cup":"∪","curren":"¤","dArr":"⇓","dagger":"†","darr":"↓","deg":"°","delta":"δ","diams":"♦","divide":"÷","eacute":"é","ecirc":"ê","egrave":"è","empty":"∅","emsp":" ","ensp":" ","epsilon":"ε","equiv":"≡","eta":"η","eth":"ð","euml":"ë","euro":"€","exist":"∃","fnof":"ƒ","forall":"∀","frac12":"½","frac14":"¼","frac34":"¾","frasl":"⁄","gamma":"γ","ge":"≥","gt":">","hArr":"⇔","harr":"↔","hearts":"♥","hellip":"…","iacute":"í","icirc":"î","iexcl":"¡","igrave":"ì","image":"ℑ","infin":"∞","int":"∫","iota":"ι","iquest":"¿","isin":"∈","iuml":"ï","kappa":"κ","lArr":"⇐","lambda":"λ","lang":"〈","laquo":"«","larr":"←","lceil":"⌈","ldquo":"“","le":"≤","lfloor":"⌊","lowast":"∗","loz":"◊","lrm":"‎","lsaquo":"‹","lsquo":"‘","lt":"<","macr":"¯","mdash":"—","micro":"µ","middot":"·","minus":"−","mu":"μ","nabla":"∇","nbsp":" ","ndash":"–","ne":"≠","ni":"∋","not":"¬","notin":"∉","nsub":"⊄","ntilde":"ñ","nu":"ν","oacute":"ó","ocirc":"ô","oelig":"œ","ograve":"ò","oline":"‾","omega":"ω","omicron":"ο","oplus":"⊕","or":"∨","ordf":"ª","ordm":"º","oslash":"ø","otilde":"õ","otimes":"⊗","ouml":"ö","para":"¶","part":"∂","permil":"‰","perp":"⊥","phi":"φ","pi":"π","piv":"ϖ","plusmn":"±","pound":"£","prime":"′","prod":"∏","prop":"∝","psi":"ψ","quot":"\"","rArr":"⇒","radic":"√","rang":"〉","raquo":"»","rarr":"→","rceil":"⌉","rdquo":"”","real":"ℜ","reg":"®","rfloor":"⌋","rho":"ρ","rlm":"‏","rsaquo":"›","rsquo":"’","sbquo":"‚","scaron":"š","sdot":"⋅","sect":"§","shy":"­","sigma":"σ","sigmaf":"ς","sim":"∼","spades":"♠","sub":"⊂","sube":"⊆","sum":"∑","sup":"⊃","sup1":"¹","sup2":"²","sup3":"³","supe":"⊇","szlig":"ß","tau":"τ","there4":"∴","theta":"θ","thetasym":"ϑ","thinsp":" ","thorn":"þ","tilde":"˜","times":"×","trade":"™","uArr":"⇑","uacute":"ú","uarr":"↑","ucirc":"û","ugrave":"ù","uml":"¨","upsih":"ϒ","upsilon":"υ","uuml":"ü","weierp":"℘","xi":"ξ","yacute":"ý","yen":"¥","yuml":"ÿ","zeta":"ζ","zwj":"‍","zwnj":"‌","apos":"'"};
// Décodage répété : certains flux encodent deux fois (&amp;eacute; → é).
function decode(s=''){let text=String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');for(let pass=0;pass<3;pass++){const next=text.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&([a-zA-Z][a-zA-Z0-9]{1,8});/g,(all,name)=>HTML_ENTITIES[name]??all);if(next===text)break;text=next;}return text.replace(/(?<!&)([aeiouycnAEIOUYCN])(acute|grave|circ|uml|cedil|tilde);/g,(all,l,a)=>HTML_ENTITIES[l+a]??all).replace(/(?<!&)(oe|OE|ae|AE)lig;/g,(all,l)=>HTML_ENTITIES[l+'lig']??all).replace(/(?<!&)(nbsp|rsquo|lsquo|rdquo|ldquo|laquo|raquo|hellip|ndash|mdash|deg|euro|quot|apos);/g,(all,n)=>HTML_ENTITIES[n]??all).trim()}
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
 const media=item.match(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*url=["']([^"']+)["']/i)?.[1];
 const inline=[...item.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].find(m=>!/wp-smiley|emoji|gravatar|width=["']?(?:[1-7]?\d)["' ]/i.test(m[0]))?.[1];
 const url=decode(media||inline||'');
 return /^https:\/\//i.test(url)&&!NOISE_IMAGE.test(url)?url:'';
}

// --- Articles en blocs (texte + images + tweets intégrés), partagé FFL / lecture intégrée.
const NOISE_LINE=/^(?:partager|share|tweet|tweeter|imprimer|print|publicit[ée]|advertisement|crédit photo.*|©.*|pic\.twitter\.com\/\w+)$/i;
const NOISE_IMAGE=/gravatar\.com|s\.w\.org\/images\/core\/emoji|\/emoji\/|pixel|spacer|blank\.gif|logo|avatar|icon/i;
function toBlocks(html,base){
 const resolve=src=>{try{const u=new URL(decode(src),base);return u.protocol==='https:'?u.href:''}catch{return ''}};
 const marked=String(html||'')
  .replace(/<(script|style|noscript|svg|form|button|nav|aside|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<img\b[^>]*>/gi,tag=>{
   if(/wp-smiley|emoji|s\.w\.org\/images\/core\/emoji/i.test(tag))return (tag.match(/\balt=["']([^"']*)["']/i)||[])[1]||'';
   const src=(tag.match(/\b(?:data-lazy-src|data-src|data-orig-file|src)=["']([^"']+)["']/i)||[])[1]||'';
   const url=resolve(src),width=+((tag.match(/\bwidth=["']?(\d+)/i)||[])[1]||0);
   return url&&!NOISE_IMAGE.test(url)&&!(width&&width<80)?'\n[[IMG '+url+']]\n':' ';
  })
  .replace(/<\/?(?:a|span|strong|em|b|i|u|mark|small|sup|sub|abbr|time|cite)\b[^>]*>/gi,'')
  .replace(/<(?:br|\/p|\/h[1-6]|\/li|\/blockquote|\/div|\/figure|\/figcaption|\/section|\/tr)\b[^>]*>/gi,'\n')
  .replace(/<[^>]+>/g,' ');
 const blocks=[],seen=new Set();
 for(const raw of decode(marked).replace(/\r/g,'').split(/\n+/)){
  const line=raw.replace(/\s+/g,' ').replace(/ +([,.)])/g,'$1').trim();
  if(!line)continue;
  const img=line.match(/^\[\[IMG (\S+)\]\]$/);
  if(img){if(!seen.has(img[1])&&blocks.filter(b=>b.type==='img').length<12){seen.add(img[1]);blocks.push({type:'img',src:img[1]});}continue;}
  if(/^(?:[àa] lire aussi|lire aussi|voir aussi|sur le même sujet)\s*[:：]\s*\S/i.test(line))continue;
  if(/^(?:[àa] lire aussi|lire aussi|sur le même sujet)\s*(?:\.\.\.|…|:)?\s*$/i.test(line))break;
  if(line.length<2||NOISE_LINE.test(line))continue;
  blocks.push({type:'p',text:line.slice(0,3000)});
 }
 return blocks.slice(0,200);
}
const blocksText=blocks=>blocks.filter(b=>b.type==='p').map(b=>b.text).join('\n');
// Image de partage d'une page (og:image / twitter:image), mise en cache 1 jour.
async function pageImage(link){
 try{
  const r=await fetch(link,{headers:{'User-Agent':'Mozilla/5.0 (compatible; MonSport/1.0)','Accept':'text/html'},cf:{cacheTtl:86400,cacheEverything:true},signal:AbortSignal.timeout(3000)});
  if(!r.ok)return '';
  const head=(await r.text()).slice(0,250000);
  const m=head.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
   ||head.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  const url=decode(m?.[1]||'');
  return /^https:\/\//i.test(url)?new URL(url,link).href:'';
 }catch{return ''}
}
// Budget de 5 s : au-delà, les articles restants gardent l'illustration du sport.
async function withImages(articles,limit=60,budget=5000){
 const started=Date.now();
 const missing=articles.filter(a=>!a.image).slice(0,limit);
 for(let i=0;i<missing.length&&Date.now()-started<budget;i+=12){
  await Promise.all(missing.slice(i,i+12).map(async a=>{a.image=await pageImage(a.link);}));
 }
 return articles;
}
// FFL : récupéré côté serveur (pas de CORS), texte complet et image à la une.
async function fflNews(start,now){
 const headers={'User-Agent':'Mozilla/5.0 (compatible; MonSport/1.0)','Accept':'application/json'};
 try{
  const r=await fetch('https://fflose.com/wp-json/wp/v2/posts?per_page=30&_embed=1&_fields=date_gmt,link,title,excerpt,content,jetpack_featured_media_url,_embedded',{headers,cf:{cacheTtl:600,cacheEverything:true},signal:AbortSignal.timeout(9000)});
  if(!r.ok)throw Error('FFL HTTP '+r.status);
  const posts=await r.json();
  return posts.map(p=>{
   const time=Date.parse((p.date_gmt||'')+'Z');
   if(!Number.isFinite(time)||time<start||time>now+600000||!/^https:\/\/fflose\.com\//.test(p.link||''))return null;
   const blocks=toBlocks(p.content?.rendered||'',p.link),media=p._embedded?.['wp:featuredmedia']?.[0];
   return {title:decode(String(p.title?.rendered||'').replace(/<[^>]+>/g,'')),link:p.link,date:new Date(time).toISOString(),source:'FFL',
    excerpt:decode(String(p.excerpt?.rendered||'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim().slice(0,600),
    image:media?.media_details?.sizes?.medium_large?.source_url||media?.source_url||p.jetpack_featured_media_url||blocks.find(b=>b.type==='img')?.src||'',
    blocks,text:blocksText(blocks)};
  }).filter(Boolean);
 }catch(e){
  // Repli : flux RSS complet (content:encoded).
  const r=await fetch('https://fflose.com/feed/',{headers:{...headers,'Accept':'application/rss+xml, text/xml'},cf:{cacheTtl:600,cacheEverything:true},signal:AbortSignal.timeout(9000)});
  if(!r.ok)throw Error('FFL indisponible ('+String(e.message||e)+')');
  const xml=await r.text();
  const items=feedItems(xml).map(item=>{
   const link=feedLink(item),time=Date.parse(xmlValue(item,['pubDate']));
   if(!Number.isFinite(time)||time<start||time>now+600000||!/^https:\/\/fflose\.com\//.test(link))return null;
   const raw=(item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1]||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');
   const blocks=toBlocks(raw,link);
   return {title:xmlValue(item,['title']),link,date:new Date(time).toISOString(),source:'FFL',excerpt:xmlValue(item,['description']).slice(0,600),
    image:'',fallbackImage:blocks.find(b=>b.type==='img')?.src||'',blocks,text:blocksText(blocks)};
  }).filter(Boolean);
  // Image à la une = og:image de la page (1920×1080), en parallèle et en cache 1 jour.
  await Promise.all(items.map(async a=>{a.image=await pageImage(a.link)||a.fallbackImage;delete a.fallbackImage;}));
  return items;
 }
}

// --- Résumé vidéo YouTube d'un match : recherche « équipe A équipe B résumé »
// publiée cette semaine ; on ne garde qu'une vidéo dont le titre cite les deux
// camps et annonce un résumé (highlights, temps forts…), de moins de 25 min.
const plainText=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const stem4=w=>w.slice(0,4);
function videoRenderers(node,out=[]){
 if(!node||typeof node!=='object')return out;
 if(node.videoRenderer)out.push(node.videoRenderer);
 for(const value of Object.values(node))if(value&&typeof value==='object')videoRenderers(value,out);
 return out;
}
function durationSeconds(text){return String(text||'').split(':').reduce((t,p)=>t*60+(+p||0),0);}
async function embeddable(id){
 try{const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{cf:{cacheTtl:86400,cacheEverything:true},signal:AbortSignal.timeout(4000)});return r.ok;}catch{return true}
}
async function highlight(query,teams){
 const url='https://www.youtube.com/results?search_query='+encodeURIComponent(query)+'&sp=EgIIAw%253D%253D&hl=fr&gl=FR';
 const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36','Accept-Language':'fr-FR,fr;q=0.9','Cookie':'SOCS=CAI; CONSENT=YES+'},cf:{cacheTtl:3600,cacheEverything:true},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('YouTube HTTP '+r.status);
 const html=await r.text();
 const raw=html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)?.[1];
 if(!raw)return {video:null,reason:'résultats illisibles'};
 const sides=teams.map(t=>plainText(t).split(/[^a-z0-9]+/).filter(w=>w.length>=4).map(stem4)).filter(s=>s.length);
 const wanted=/resume|highlights|temps forts|extended|all goals|tous les buts|best of|meilleurs moments/;
 // Chaînes officielles (diffuseurs, ligues, fédérations, clubs) d'abord ;
 // une autre chaîne certifiée par YouTube seulement en dernier recours.
 const official=/ligue 1|bein|canal|prime video|tf1|\bfff\b|equipe de france|france ?tv|france 2|france 3|\bm6\b|rmc|l ?equipe|laliga|espn|fox sports|cbs sports|tnt sports|\bnba\b|\bwta\b|\batp\b|tennis tv|roland|france rugby|world rugby|six nations|eurosport|dazn|\buefa\b|\bfifa\b|\bpsg\b|paris saint|real madrid|fc barcelona|spurs|\bwtt\b|ittf|world aquatics|\buci\b|sky sports|bt sport|movistar|dazn/;
 let fallback=null;
 for(const v of videoRenderers(JSON.parse(raw)).slice(0,25)){
  const title=(v.title?.runs||[]).map(x=>x.text).join('')||v.title?.simpleText||'';
  const words=new Set(plainText(title).split(/[^a-z0-9]+/).filter(w=>w.length>=4).map(stem4));
  const seconds=durationSeconds(v.lengthText?.simpleText);
  const verified=JSON.stringify(v.ownerBadges||[]).includes('VERIFIED');
  if(!v.videoId||!verified||!wanted.test(plainText(title))||!sides.every(s=>s.some(w=>words.has(w)))||!seconds||seconds>1500)continue;
  const channel=v.ownerText?.runs?.[0]?.text||'';
  // Chaînes régionales dont les vidéos sont bloquées hors de leur pays.
  if(/bein sports (?:usa|us|canada|australia|asia|mena|xtra)|sportsnet|\btsn\b|optus|stan sport|fubo|peacock|paramount|nbc sports|espn australia|supersport/.test(plainText(channel)))continue;
  // Intégration interdite par la chaîne : oEmbed renvoie 401/403.
  if(!(await embeddable(v.videoId)))continue;
  const video={id:v.videoId,title,channel,official:official.test(plainText(channel)),published:v.publishedTimeText?.simpleText||'',duration:v.lengthText?.simpleText||''};
  if(video.official)return {video};
  fallback=fallback||video;
 }
 if(fallback)return {video:fallback};
 return {video:null};
}

// --- Rugby international en direct : API publique de World Rugby (site world.rugby).
async function rugbyLive(day){
 const start=new Date(day+'T00:00:00Z'),end=new Date(start.getTime()+2*86400000);
 const iso=d=>d.toISOString().slice(0,10);
 const url='https://api.wr-rims-prod.pulselive.com/rugby/v3/match?startDate='+iso(new Date(start.getTime()-86400000))+'&endDate='+iso(end)+'&sort=asc&pageSize=100&page=0';
 const r=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'Mozilla/5.0 (compatible; MonSport/1.0)'},cf:{cacheTtl:30,cacheEverything:true},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('World Rugby HTTP '+r.status);
 const body=await r.json();
 const matches=(body.content||[]).map(m=>({
  id:String(m.matchId||''),start:m.time?.millis?new Date(m.time.millis).toISOString():'',
  status:m.status||'',clock:m.clock?.label||m.clock?.secs||'',
  competition:m.competition||m.events?.[0]?.label||'',venue:m.venue?.name||'',
  teams:(m.teams||[]).map(t=>({name:t?.name||'',abbreviation:t?.abbreviation||''})),
  scores:Array.isArray(m.scores)?m.scores:[]
 })).filter(m=>m.teams.length===2);
 return {matches};
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
 const ffl=await fflNews(start,now).then(value=>({ok:true,value}),error=>({ok:false,value:[],error:String(error.message||error)}));
 const articles=[...settled.flatMap(result=>result.status==='fulfilled'?result.value:[]),...ffl.value];
 const unique=new Map();
 for(const article of articles){const key=article.link.split('#')[0];if(!unique.has(key))unique.set(key,article);}
 const sorted=[...unique.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,90);
 await withImages(sorted);
 return {articles:sorted,
  feeds:[...RSS_FEEDS.map((feed,index)=>({source:feed.name,sport:feed.sport,ok:settled[index].status==='fulfilled',count:settled[index].status==='fulfilled'?settled[index].value.length:0})),
   {source:'FFL',sport:'',ok:ffl.ok,count:ffl.value.length,...(ffl.error?{error:ffl.error}:{})}]};
}

async function articleText(rawUrl){
 let url;try{url=new URL(rawUrl)}catch{return {text:''}}
 const allowed=['tennisactu.net','franceinfo.fr','basketusa.com','trashtalk.co','cyclismactu.net','fflose.com','espn.com','lequipe.fr','eurosport.fr','rugbyrama.fr','rmcsport.bfmtv.com'];
 if(url.protocol!=='https:'||!allowed.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))throw Error('Source non autorisée pour la lecture intégrée');
 const response=await fetch(url.href,{headers:{'User-Agent':'Mozilla/5.0 (compatible; MonSport/1.0)','Accept':'text/html'},redirect:'follow',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Article inaccessible (HTTP '+response.status+')');
 const finalUrl=new URL(response.url);
 if(!allowed.some(host=>finalUrl.hostname===host||finalUrl.hostname.endsWith('.'+host)))throw Error('Redirection vers un domaine non autorisé');
 const html=(await response.text()).slice(0,1800000);
 const sameHost=href=>{try{const u=new URL(href,finalUrl);return u.protocol==='https:'&&u.hostname===finalUrl.hostname?u.href:''}catch{return ''}};
 // 1. WordPress (FFL, TrashTalk, Basket USA…) : contenu exact via l'API REST du site.
 const wpLink=sameHost(html.match(/<link[^>]+rel=["']alternate["'][^>]+type=["']application\/json["'][^>]+href=["']([^"']+wp-json\/wp\/v2\/posts\/\d+)["']/i)?.[1]||html.match(/<link[^>]+href=["']([^"']+wp-json\/wp\/v2\/posts\/\d+)["'][^>]+type=["']application\/json["']/i)?.[1]||'');
 let candidateBody='';
 if(wpLink){
  try{const r=await fetch(wpLink+'?_fields=content',{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(8000)});if(r.ok)candidateBody=(await r.json())?.content?.rendered||'';}catch{}
 }
 // WordPress sans lien JSON dans la page : recherche par slug.
 if(!candidateBody&&/wp-content|wp-json/i.test(html)){
  const slug=finalUrl.pathname.split('/').filter(Boolean).pop()||'';
  if(/^[\w%-]+$/.test(slug)){
   try{const r=await fetch(finalUrl.origin+'/wp-json/wp/v2/posts?slug='+encodeURIComponent(decodeURIComponent(slug))+'&_fields=content',{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(8000)});if(r.ok)candidateBody=(await r.json())?.[0]?.content?.rendered||'';}catch{}
  }
 }
 // 2. Données structurées schema.org (articleBody).
 if(!candidateBody){
  for(const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)){
   try{const data=JSON.parse(m[1]);const items=[data,...(Array.isArray(data)?data:[]),...(data['@graph']||[])];const found=items.find(x=>x&&typeof x.articleBody==='string'&&x.articleBody.length>200);if(found){candidateBody=found.articleBody.replace(/\n/g,'</p>');break;}}catch{}
  }
 }
 // 3. Repli : le plus long bloc <article>/<main> (greedy pour les blocs imbriqués).
 const candidates=[...html.matchAll(/<(article|main)\b[^>]*>([\s\S]*)<\/\1>/gi)].map(m=>m[2]);
 let body=candidateBody||candidates.sort((a,b)=>b.length-a.length)[0]||html;
 const blocks=toBlocks(body,finalUrl.href);
 const text=blocksText(blocks);
 return {text:text.slice(0,18000),truncated:text.length>18000,blocks,source:finalUrl.hostname};
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
export default {async fetch(request){if(request.method==='OPTIONS')return new Response(null,{headers:cors});if(request.method!=='GET')return json({error:'Méthode non autorisée'},405);const u=new URL(request.url);try{if(u.pathname==='/api/sports-news'){
 const cache=typeof caches!=='undefined'?caches.default:null,key=new Request('https://cache.mon-sport/sports-news-v2');
 const hit=cache&&!u.searchParams.has('fresh')?await cache.match(key):null;
 if(hit)return hit;
 const response=json(await curatedSportsNews());
 if(cache)await cache.put(key,new Response(response.clone().body,{headers:{...Object.fromEntries(response.headers),'Cache-Control':'public, max-age=600'}}));
 return response;
}if(u.pathname==='/api/rugby-live'){const day=limit(u.searchParams.get('date'),10);if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return json({error:'Date attendue AAAA-MM-JJ'},400);return new Response(JSON.stringify(await rugbyLive(day)),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30',...cors}});}if(u.pathname==='/api/highlight'){const q=limit(u.searchParams.get('q'),160),teams=limit(u.searchParams.get('teams'),160).split('|').map(t=>t.trim()).filter(Boolean).slice(0,2);if(q.length<3||teams.length<2)return json({error:'Paramètres manquants'},400);return json(await highlight(q,teams));}if(u.pathname==='/api/article'){const target=limit(u.searchParams.get('url'),2048);if(!target)return json({error:'URL manquante'},400);return json(await articleText(target));}if(u.pathname==='/api/news'){const q=limit(u.searchParams.get('q'),120);if(q.length<2)return json({error:'Recherche trop courte'},400);return json(await news(q))}if(u.pathname==='/api/team'){const name=limit(u.searchParams.get('name'),100);if(name.length<2)return json({error:'Nom trop court'},400);return json(await team(name))}return json({service:'Mon Sport API',endpoints:['/api/news?q=PSG','/api/sports-news','/api/article?url=https%3A%2F%2Fwww.basketusa.com%2F','/api/team?name=Real%20Madrid']})}catch(e){return json({error:String(e.message||e)},502)}}};
