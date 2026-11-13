import {sportInfo,sourceImage} from './sports-media.js?v=14.0.0';
import {filterSportsNews} from './sports-articles.js?v=15.0.0';
// Mon Sport V9 — dernières 7 journées, lecture à l'intérieur de la PWA.
// Un titre RSS et un extrait librement fourni ne sont PAS un article intégral.
// L'iframe de l'éditeur est tentée au clic ; l'éditeur peut refuser l'intégration.
const HOUR=3600000;
const DAY=24*HOUR;
export function newsLastWeek(items,now=new Date()){
 const end=now.getTime(),start=end-7*DAY,used=new Set();
 return filterSportsNews(Array.isArray(items)?items:[]).filter(n=>{
  const t=Date.parse(n.date||n.published||'');
  if(!Number.isFinite(t)||t<start||t>end+10*60*1000||!n.title||!n.link)return false;
  const key=String(n.link).replace(/[?#].*$/,'').toLowerCase()+'|'+String(n.title).trim().toLowerCase();
  if(used.has(key))return false;
  used.add(key);return true;
 }).sort((a,b)=>Date.parse(b.date||b.published)-Date.parse(a.date||a.published))
  .slice(0,60);
}
export function safeExcerpt(value){
 return String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ')
  .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/\s+/g,' ').trim().slice(0,600);
}
export function renderNewsView({news=[],loading=false,hasWorker=false,photos={},esc,safeUrl,now=new Date()}){
 const recent=newsLastWeek(news,now);
 const head='<section class="news-feed"><div class="news-intro"><span class="agenda-eyebrow">ACTUALITÉS · 7 DERNIERS JOURS</span>'
  +'<h2>Articles et posts sportifs · favoris, FFL et Jeu, set et maths</h2>'
  +'<p>Sept derniers jours · du plus récent au plus ancien · sans actualités people. Les posts de Jeu, set et maths se lisent directement ici.</p>'
  +'<a class="news-ffl-link" href="https://fflose.com/" target="_blank" rel="noopener noreferrer">Actualités FFL ↗</a>'
  +'<a class="news-ffl-link" href="https://x.com/JeuSetMaths" target="_blank" rel="noopener noreferrer">Posts de Jeu, set et maths ↗</a></div>'
  +'<div class="agenda-countbar"><strong>'+recent.length+' article'+(recent.length!==1?'s':'')+'</strong><span>Derniers 7 jours</span></div>';
 const cards=recent.map(n=>{
  const link=safeUrl(n.link);
  if(link==='#')return '';
  const published=new Date(n.date||n.published).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const sport=sportInfo(n.sport,n.favorite,n.title,n.excerpt);
  const image=sourceImage(n.image)||sourceImage(photos?.[n.favorite]?.src);
  const picture=image?'<span class="article-visual"><img class="article-thumb-image" loading="lazy" decoding="async" src="'+esc(image)+'" alt="" /><span class="article-image-fallback" aria-hidden="true">'+sport.icon+'</span></span>'
   :'<span class="article-visual article-visual-empty" aria-hidden="true">'+sport.icon+'</span>';
  // Les publications du compte Jeu, set et maths s'ouvrent dans la PWA.
  // Seuls l'extrait public et le visuel source sont affichés, sans copie intégrale.
  if(n.source==='Jeu, set et maths'&&/^https:\/\/x\.com\/JeuSetMaths\/status\/\d{16,20}$/.test(n.link||'')){
   const fullImage=sourceImage(n.image);
   const visual=fullImage?'<div class="jsm-reader-visual"><img class="jsm-reader-image" loading="lazy" decoding="async" src="'+esc(fullImage)+'" alt="Visuel du post de Jeu, set et maths, contenant éventuellement un graphique de statistiques de tennis" />'
    +'<p class="jsm-image-error" role="status">Visuel indisponible depuis la source X.</p></div>':'';
   return '<details class="news-card news-post-card">'
    +'<summary class="news-post-summary">'+picture
    +'<span class="news-text"><span class="news-card-top"><span class="news-sport" aria-label="Tennis">🎾 Tennis</span>'
    +'<span class="news-date">'+esc(published)+'</span></span>'
    +'<h3>'+esc(n.title)+'</h3><p class="news-source">Jeu, set et maths</p>'
    +'<span class="news-tap">Voir le post dans Mon Sport <span class="news-expand-chevron" aria-hidden="true">⌄</span></span>'
    +'</span></summary>'
    +'<div class="news-reader jsm-reader"><p class="news-article-label">📊 JEU, SET ET MATHS</p>'
    +'<p class="news-excerpt">'+esc(n.title)+'</p>'
    +visual
    +'<p class="news-reading-info">Extrait de la publication et visuel d’origine. Si le post contient davantage de texte, l’extrait ne le reproduit pas intégralement.</p>'
    +'<a class="jsm-original-link" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Voir la publication originale sur X ↗</a>'
    +'</div></details>';
  }
  return '<article class="news-card news-link-card"><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" class="news-plain-link">'
    +picture+'<span class="news-text"><span class="news-card-top"><span class="news-sport" aria-label="'+esc(sport.name)+'"><span aria-hidden="true">'+sport.icon+'</span> '+esc(sport.name)+'</span>'
    +'<span class="news-date">'+esc(published)+'</span></span>'
    +'<h3>'+esc(n.title)+'</h3><p class="news-source">'+esc(n.source||'Éditeur')+'</p>'
    +'<span class="news-tap">Lire l’article chez l’éditeur ↗</span></span></a></article>';
 }).join('');
 return head+(loading?'<p class="agenda-progress">Actualisation du fil…</p>':'')
  +(cards||'<div class="agenda-empty"><h3>Aucun article récent</h3><p>Les articles plus anciens que sept jours sont masqués.</p></div>')
  +(!hasWorker?'<p class="agenda-footnote">Sources : FFL et ESPN · flux complémentaires via Cloudflare si configuré.</p>':'')
  +'<p class="agenda-footnote">Les posts « Jeu, set et maths » s’ouvrent ici, avec leur extrait et leur visuel d’origine. Le lien X reste facultatif ; un contenu plus long peut nécessiter la source.</p>'
  +'<p class="agenda-footnote">Mon Sport affiche uniquement les titres, dates, sources et liens. Le contenu intégral appartient à son éditeur.</p></section>';
}
// Lecture intégrée des posts : aucun iframe externe, pas de sortie obligatoire vers X.
export function mountNewsFrames(){}

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
