// Mon Sport V9 — dernières 7 journées, lecture à l'intérieur de la PWA.
// Un titre RSS et un extrait librement fourni ne sont PAS un article intégral.
// L'iframe de l'éditeur est tentée au clic ; l'éditeur peut refuser l'intégration.
const HOUR=3600000;
const DAY=24*HOUR;
export function newsLastWeek(items,now=new Date()){
 const end=now.getTime(),start=end-7*DAY,used=new Set();
 return (Array.isArray(items)?items:[]).filter(n=>{
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
export function renderNewsView({news=[],loading=false,hasWorker=false,esc,safeUrl,now=new Date()}){
 const recent=newsLastWeek(news,now);
 const head='<section class="news-feed"><div class="news-intro"><span class="agenda-eyebrow">ACTUALITÉS · 7 DERNIERS JOURS</span>'
  +'<h2>Le meilleur de tes favoris</h2>'
  +'<p>Articles publiés depuis sept jours, du plus récent au plus ancien. Appuie sur un titre pour le lire dans Mon Sport.</p></div>'
  +'<div class="agenda-countbar"><strong>'+recent.length+' article'+(recent.length>1?'s':'')+'</strong><span>Les 7 derniers jours</span></div>';
 const cards=recent.map((n,index)=>{
  const link=safeUrl(n.link);
  const published=new Date(n.date||n.published).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const excerpt=safeExcerpt(n.excerpt||n.description||n.summary||'');
  return '<details class="news-card" data-news-id="'+index+'" data-source-link="'+esc(link)+'">'
   +'<summary><div class="news-card-top"><span class="agenda-favorite">'+esc(n.favorite||'Sport')+'</span>'
   +'<span class="news-date">'+esc(published)+'</span></div>'
   +'<h3>'+esc(n.title)+'</h3>'
   +'<p class="news-source">'+esc(n.source||'Source sportive')+'</p>'
   +'<span class="news-tap">Ouvrir dans Mon Sport <span aria-hidden="true">⌄</span></span></summary>'
   +'<div class="news-reader"><p class="news-article-label">APERÇU DE L’ARTICLE</p>'
   +(excerpt?'<p class="news-excerpt">'+esc(excerpt)+'</p>':
     '<p class="news-excerpt">Ce flux ne diffuse pas de texte d’article réutilisable. La lecture intégrée ci-dessous dépend des autorisations du site éditeur.</p>')
   +'<p class="news-reading-info">Contenu fourni par '+esc(n.source||'le diffuseur')
     +'. L’article complet appartient à son éditeur.</p>'
   +(link!=='#'?'<button type="button" class="button ghost news-open-frame" data-news-frame="'+index+'">Afficher le site dans l’application</button>'
     +'<div class="news-frame-slot" id="newsFrame'+index+'"></div>'
     +'<p class="news-reading-info">Certains éditeurs bloquent les fenêtres intégrées. Si la page reste vide, '
     +'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">ouvrir chez l’éditeur ↗</a>.</p>'
     :'')
   +'</div></details>';
 }).join('');
 const empty=recent.length?'':'<div class="agenda-empty"><h3>Aucun article publié cette semaine</h3>'
  +'<p>Les articles plus anciens sont masqués. Actualise pour réessayer ; certaines sources n’exposent pas de dates fiables.</p></div>';
 const note=!hasWorker?'<p class="agenda-footnote">Le relais Cloudflare de tes favoris n’est pas configuré : seuls les articles publics de repli peuvent être affichés.</p>':'';
 return head+(loading?'<div class="agenda-progress">Actualisation des articles…</div>':'')
  +(cards||empty)+note+'<p class="agenda-footnote">La lecture intégrée n’évite pas les restrictions imposées par chaque éditeur : les extraits disponibles sont affichés dans l’application, sans copier le contenu intégral protégé.</p></section>';
}
export function mountNewsFrames(root,safeUrl){
 if(!root)return;
 root.querySelectorAll('[data-news-frame]').forEach(button=>button.onclick=()=>{
  const id=button.dataset.newsFrame;
  const parent=button.closest('.news-card');
  const link=parent?.dataset?.sourceLink;
  // URL fournie uniquement par l'appelant dans data-source-link validé.
  const url=safeUrl(link);
  const slot=parent?.querySelector('#newsFrame'+id);
  if(!slot||url==='#')return;
  if(slot.querySelector('iframe')){slot.innerHTML='';button.textContent='Afficher le site dans l’application';return;}
  const iframe=document.createElement('iframe');
  iframe.src=url;
  iframe.title='Lecture intégrée de l’article';
  iframe.loading='lazy';
  iframe.referrerPolicy='no-referrer';
  iframe.setAttribute('sandbox','allow-forms allow-scripts allow-same-origin allow-popups');
  iframe.className='news-embedded-frame';
  slot.replaceChildren(iframe);
  button.textContent='Fermer la lecture intégrée';
 });
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
   return {title,link,date,source:'ESPN',favorite:fav.name,excerpt:description};
  }).filter(Boolean);
 }));
 return newsLastWeek(settled.flatMap(x=>x.status==='fulfilled'?x.value:[]),now);
}
