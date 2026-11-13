import {sportInfo,sourceImage} from './sports-media.js?v=14.0.0';
import {filterSportsNews} from './sports-articles.js?v=15.6.0';
// Mon Sport V15.6 — dernières publications tennis intégrées au chargement Android.
const HOUR=3600000;
const DAY=24*HOUR;
const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const STOPWORDS=new Set(['avec','dans','pour','contre','chez','face','apres','avant','plus','moins','mais','sur','ses','son','sa','les','des','une','un','du','de','la','le','et','est','aux','par','qui','que','en','au','a','d']);
function titleTokens(article){
 return new Set(normalized(article.title).split(/\s+/).filter(word=>word.length>=3&&!STOPWORDS.has(word)));
}
function canonicalNewsLink(value){
 try{
  const url=new URL(String(value||''));
  url.hash='';
  for(const key of [...url.searchParams.keys()])if(/^utm_|^fbclid$|^gclid$|^ref$/i.test(key))url.searchParams.delete(key);
  return (url.hostname.replace(/^www\./,'')+url.pathname.replace(/\/$/,'')+url.search).toLowerCase();
 }catch{return String(value||'').split('#')[0].toLowerCase();}
}
function sameNewsStory(left,right){
 if(canonicalNewsLink(left.link)===canonicalNewsLink(right.link))return true;
 const leftDate=Date.parse(left.date||left.published||''),rightDate=Date.parse(right.date||right.published||'');
 if(!Number.isFinite(leftDate)||!Number.isFinite(rightDate)||Math.abs(leftDate-rightDate)>36*HOUR)return false;
 const leftSport=sportInfo(left.sport,left.favorite,left.title).name;
 const rightSport=sportInfo(right.sport,right.favorite,right.title).name;
 if(leftSport!=='Sport'&&rightSport!=='Sport'&&leftSport!==rightSport)return false;
 const a=titleTokens(left),b=titleTokens(right);
 if(Math.min(a.size,b.size)<4)return false;
 let common=0;for(const word of a)if(b.has(word))common++;
 const overlap=common/Math.min(a.size,b.size),jaccard=common/(a.size+b.size-common);
 const sameFavorite=left.favorite&&right.favorite&&normalized(left.favorite)===normalized(right.favorite);
 if(sameFavorite)return common>=4&&overlap>=.66&&jaccard>=.5;
 return overlap>=.82&&jaccard>=.62;
}
function newsRichness(article){
 return String(article.text||'').length+String(article.excerpt||article.description||'').length+String(article.title||'').length;
}
export function newsLastWeek(items,now=new Date()){
 const end=now.getTime(),start=end-7*DAY;
 const candidates=filterSportsNews(Array.isArray(items)?items:[]).filter(n=>{
  const t=Date.parse(n.date||n.published||'');
  return Number.isFinite(t)&&t>=start&&t<=end+10*60*1000&&n.title&&n.link;
 }).sort((a,b)=>Date.parse(b.date||b.published)-Date.parse(a.date||a.published));
 const ordered=[];
 for(const article of candidates){
  const index=ordered.findIndex(previous=>sameNewsStory(previous,article));
  if(index<0)ordered.push(article);
  else if(newsRichness(article)>newsRichness(ordered[index]))ordered[index]=article;
 }
 const top=ordered.slice(0,60);
 const maths=ordered.filter(n=>n.source==='Jeu, set et maths').slice(0,25);
 return [...new Map([...top,...maths].map(n=>[n.link,n])).values()]
  .sort((a,b)=>Date.parse(b.date||b.published)-Date.parse(a.date||a.published));
}
function newsSourceName(article){
 const value=String(article.source||article.publisher||article.provider||'').trim();
 if(value&&value!=='Éditeur')return value;
 try{
  const host=new URL(article.link).hostname.replace(/^www\./,'');
  if(host.includes('fflose.com'))return 'FFL';
  if(host.includes('espn.com'))return 'ESPN';
  if(host.includes('tennisactu.net'))return 'Tennis Actu';
  if(host.includes('trashtalk.co'))return 'TrashTalk';
  if(host.includes('basketusa.com'))return 'Basket USA';
  if(host.includes('franceinfo.fr'))return 'Franceinfo';
  return host;
 }catch{return 'Autre';}
}
function newsSportName(article){
 return String(article.sport||sportInfo(article.favorite,article.title,article.excerpt,article.text).name||'Autre');
}
function matchesFavorite(article,favorite){
 if(article.favorite===favorite.name)return true;
 const haystack=normalized([article.title,article.excerpt,article.text,article.description].join(' '));
 const aliases=[favorite.name,favorite.apiName].map(normalized).filter(value=>value.length>=3);
 return aliases.some(alias=>{
  if(alias.length>=5&&haystack.includes(alias))return true;
  const tokens=alias.split(' ').filter(word=>word.length>=5);
  return tokens.some(word=>haystack.split(' ').includes(word));
 });
}
function videoCandidates(value){
 const url=String(value||'');
 if(!/^https:\/\/video\.twimg\.com\/[\w/.-]+\.mp4(?:\?[^\s]*)?$/.test(url))return [];
 const candidates=[url];
 try{
  const fallback=new URL(url);fallback.searchParams.delete('tag');
  if(fallback.href!==url)candidates.push(fallback.href);
 }catch{}
 return [...new Set(candidates)];
}
export function safeExcerpt(value){
 return String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ')
  .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/\s+/g,' ').trim().slice(0,600);
}
export function renderNewsView({
 news=[],loading=false,hasWorker=false,photos={},esc,safeUrl,now=new Date(),
 sourceFilter='Tous',sportFilter='Tous',favoriteFilter='Tous',favorites=[]
}={}){
 const recentAll=newsLastWeek(news,now);
 const mathsTotal=recentAll.filter(n=>n.source==='Jeu, set et maths').length;
 const sportOptions=[...new Set([...favorites.map(f=>f.sport),...recentAll.map(newsSportName)].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
 const favoriteOptions=favorites.length?favorites:[...new Map(recentAll.filter(n=>n.favorite&&n.favorite!=='FFL'&&n.favorite!=='Jeu, set et maths').map(n=>[n.favorite,{name:n.favorite}])).values()];
 const contextual=recentAll.filter(n=>
  (sportFilter==='Tous'||newsSportName(n)===sportFilter)&&
  (favoriteFilter==='Tous'||favoriteOptions.some(f=>f.name===favoriteFilter&&matchesFavorite(n,f)))
 );
 const sourceOptions=[...new Set(contextual.map(newsSourceName))].sort((a,b)=>{
  const order=['Jeu, set et maths','FFL','ESPN'];const ai=order.indexOf(a),bi=order.indexOf(b);
  return (ai<0?99:ai)-(bi<0?99:bi)||a.localeCompare(b,'fr');
 });
 const sourceCounts=new Map();for(const n of contextual)sourceCounts.set(newsSourceName(n),(sourceCounts.get(newsSourceName(n))||0)+1);
 const recent=sourceFilter==='Tous'?contextual:contextual.filter(n=>newsSourceName(n)===sourceFilter);
 const maths=recent.filter(n=>n.source==='Jeu, set et maths');
 const pinned=new Set(maths.slice(0,3).map(n=>n.link));
 const ordered=[...maths.slice(0,3),...recent.filter(n=>!pinned.has(n.link))];
 const sourceButton=(name,label,count)=>'<button type="button" class="news-source-chip '+(sourceFilter===name?'active':'')+'" data-news-source="'+esc(name)+'" aria-pressed="'+(sourceFilter===name?'true':'false')+'">'+esc(label)+' <span>'+count+'</span></button>';
 const sourceControls='<div class="news-filter-block"><span class="news-filter-label">Médias</span><div class="news-source-filters" role="group" aria-label="Filtrer par média">'
  +sourceButton('Tous','Tous les médias',contextual.length)
  +sourceOptions.map(name=>sourceButton(name,name,sourceCounts.get(name)||0)).join('')
  +'</div></div>';
 const option=(value,label,selected)=>'<option value="'+esc(value)+'" '+(selected?'selected':'')+'>'+esc(label)+'</option>';
 const contextControls='<div class="news-context-filters">'
  +'<label>Sport<select id="newsSportFilter">'+option('Tous','Tous les sports',sportFilter==='Tous')+sportOptions.map(v=>option(v,v,sportFilter===v)).join('')+'</select></label>'
  +'<label>Favori<select id="newsFavoriteFilter">'+option('Tous','Tous les favoris',favoriteFilter==='Tous')+favoriteOptions.map(f=>option(f.name,f.name,favoriteFilter===f.name)).join('')+'</select></label>'
  +'</div>';
 const head='<section class="news-feed"><div class="news-intro"><span class="agenda-eyebrow">ACTUALITÉS · 7 DERNIERS JOURS</span>'
  +'<h2>Articles et posts sportifs · tous tes favoris</h2>'
  +'<p>Tous les médias réunis, sans doublons évidents. Filtre par média, sport ou favori.</p>'
  +'<div class="jsm-feed-indicator" role="status">🎾 Jeu, set et maths : <b>'+mathsTotal+' publication'+(mathsTotal!==1?'s':'')+'</b> chargée'+(mathsTotal!==1?'s':'')+' dans Mon Sport'
  +(mathsTotal?' · les 3 dernières en tête':' · aucun relevé récent')
  +'<button id="jsmRefresh" class="button ghost" type="button" aria-label="Actualiser les publications Jeu, set et maths">↻ Posts</button></div>'
  +sourceControls+contextControls
  +'<a class="news-ffl-link" href="https://fflose.com/" target="_blank" rel="noopener noreferrer">Actualités FFL ↗</a></div>'
  +'<div class="agenda-countbar"><strong>'+recent.length+' article'+(recent.length!==1?'s':'')+'</strong><span>Derniers 7 jours</span></div>';
 const cards=ordered.map(n=>{
  const link=safeUrl(n.link);
  if(link==='#')return '';
  const published=new Date(n.date||n.published).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const sport=sportInfo(n.sport,n.favorite,n.title,n.excerpt);
  const image=sourceImage(n.image)||sourceImage(photos?.[n.favorite]?.src);
  const picture=image?'<span class="article-visual"><img class="article-thumb-image" loading="lazy" decoding="async" src="'+esc(image)+'" alt="" /><span class="article-image-fallback" aria-hidden="true">'+sport.icon+'</span></span>'
   :'<span class="article-visual article-visual-empty" aria-hidden="true">'+sport.icon+'</span>';
  if(n.source==='Jeu, set et maths'&&/^https:\/\/x\.com\/JeuSetMaths\/status\/\d{16,20}$/.test(n.link||'')){
   const fullText=String(n.text||'').trim();
   const images=(Array.isArray(n.images)&&n.images.length?n.images:n.image?[n.image]:[])
    .filter(x=>/^https:\/\/pbs\.twimg\.com\/media\//.test(String(x||''))).slice(0,4);
   const videoUrls=videoCandidates(n.video);
   const gallery=images.length?'<div class="jsm-native-gallery '+(images.length>1?'multi':'single')+'">'
    +images.map((url,i)=>'<figure class="jsm-native-figure">'
      +'<img class="jsm-native-image" loading="lazy" decoding="async" src="'+esc(sourceImage(url))+'" alt="Visuel '+(i+1)+' du post de Jeu, set et maths" />'
      +'<figcaption class="jsm-native-image-error" hidden>Image indisponible.</figcaption>'
      +'</figure>').join('')+'</div>':'';
   const media=videoUrls.length?'<video class="jsm-native-video" controls playsinline webkit-playsinline preload="metadata" referrerpolicy="no-referrer" aria-label="Vidéo du post de Jeu, set et maths">'
    +videoUrls.map(url=>'<source src="'+esc(url)+'" type="video/mp4" />').join('')
    +'<p>Ton navigateur ne peut pas lire cette vidéo. <a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Ouvrir la publication originale ↗</a></p></video>'
    +'<p class="jsm-video-hint">Si le lecteur reste bloqué, <a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">ouvrir la publication originale ↗</a>.</p>':'';
   return '<article class="news-card jsm-native-card">'
    +'<header class="jsm-native-header"><div><span class="jsm-native-avatar" aria-hidden="true">📊</span>'
    +'<span class="jsm-native-author"><b>Jeu, set et maths</b><small>@JeuSetMaths · 🎾 Tennis</small></span></div>'
    +'<time class="news-date" datetime="'+esc(n.date||'')+'">'+esc(published)+'</time></header>'
    +'<p class="jsm-native-text">'+esc(fullText||n.title)+'</p>'
    +(fullText?'':'<p class="jsm-native-note">Seul le court extrait est actuellement disponible ; le prochain relevé complétera le texte.</p>')
    +gallery+media
    +'<footer class="jsm-native-footer"><span>Publication attribuée à Jeu, set et maths</span>'
    +'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" aria-label="Source originale sur X">Source originale ↗</a></footer>'
    +'</article>';
  }
  return '<article class="news-card news-link-card"><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" class="news-plain-link">'
    +picture+'<span class="news-text"><span class="news-card-top"><span class="news-sport" aria-label="'+esc(sport.name)+'"><span aria-hidden="true">'+sport.icon+'</span> '+esc(sport.name)+'</span>'
    +'<span class="news-date">'+esc(published)+'</span></span>'
    +'<h3>'+esc(n.title)+'</h3><p class="news-source">'+esc(newsSourceName(n))+'</p>'
    +'<span class="news-tap">Lire l’article chez l’éditeur ↗</span></span></a></article>';
 }).join('');
 return head+(loading?'<p class="agenda-progress">Actualisation du fil…</p>':'')
  +(cards||'<div class="agenda-empty"><h3>Aucun article pour ces filtres</h3><p>Essaie « Tous les médias », « Tous les sports » ou « Tous les favoris ».</p></div>')
  +(!hasWorker?'<p class="agenda-footnote">Sources : FFL, ESPN et Jeu, set et maths · flux complémentaires via Cloudflare si configuré.</p>':'')
  +'<p class="agenda-footnote">Les publications de Jeu, set et maths sont affichées directement dans Mon Sport. Un lien discret permet de retrouver la source ; aucun lecteur X externe n’est nécessaire.</p>'
  +'<p class="agenda-footnote">Les publications sont créditées à leur auteur. Les autres articles continuent de renvoyer à leur éditeur.</p></section>';
}
// Sources complémentaires directes : annonces ESPN avec description officielle.
// Ce repli fonctionne même si le Cloudflare Worker n'a pas encore reçu
// le champ 'description'. Il n'affiche que les articles citant des favoris.
const SPORTS_NEWS=[
 'soccer/esp.1','soccer/fra.1','soccer/uefa.champions',
 'basketball/nba','tennis/atp','tennis/wta'
];
const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export async function fetchSportsNews(favorites,now=new Date()){
 const aliases=name=>({
  'PSG':['psg','paris saint-germain','paris saint germain'],
  'Real Madrid':['real madrid','madrid'],
  'San Antonio Spurs':['san antonio spurs','spurs'],
  'Victor Wembanyama':['wembanyama'],
  'Kylian Mbappé':['mbappe','mbappé'],
  'Moïse Kouamé':['kouamé','kouame'],
  'Rafael Jódar':['jódar','jodar'],
  'Mirra Andreeva':['andreeva'],
  'Équipe de France de football':['france football','les bleus']
 }[name]||[normalized(name)]).map(normalized);
 const settled=await Promise.allSettled(SPORTS_NEWS.map(async path=>{
  const url='https://site.api.espn.com/apis/site/v2/sports/'+path+'/news?limit=30';
  const r=await fetch(url,{signal:AbortSignal.timeout(9000),cache:'no-store'});
  if(!r.ok)throw Error('ESPN news '+r.status);
  const body=await r.json();
  return (body.articles||[]).map(a=>{
   const link=a.links?.web?.href||a.links?.mobile?.href||'';
   const title=a.headline||a.title||'';
   const description=safeExcerpt(a.description||a.story||'');
   const date=a.published||a.lastModified||'';
   const text=normalized(title+' '+description);
   const fav=favorites.find(f=>aliases(f.name).some(alias=>alias.length>3&&text.includes(alias)));
   if(!fav||!/^https?:\/\//.test(link))return null;
   const image=(a.images||a.image||[]);
   const editorial=Array.isArray(image)?image.find(v=>v?.url||v?.href):image;
   return {title,link,date,source:'ESPN',favorite:fav.name,sport:fav.sport,excerpt:description,image:sourceImage(editorial?.url||editorial?.href||editorial)};
  }).filter(Boolean);
 }));
 return newsLastWeek(settled.flatMap(x=>x.status==='fulfilled'?x.value:[]),now);
}
