import {sourceImage} from './sports-media.js?v=14.0.0';
// FFL (Fédération française de la Lose) : articles de sport uniquement.
// WordPress REST expose titre, date et URL; pas de copie intégrale des articles.
export const FFL_HOME='https://fflose.com/';
const SPORTS=/foot(?:ball)?|rugby|tennis|ping[- ]?pong|table|basket|nba|cyclis|vélo|natation|nage|swim|wtt|championnats|match|course|athlét|olympi|formule 1|f1|handball|sport|ligue|but|score|essai|course|tournoi|médaille|record/i;
const PEOPLE=/\b(?:people|potins|gossip|couple|petite amie|petit ami|fianc[ée]|mariage|divorce|grossesse|enceinte|b[ée]b[ée]|influenceur|influenceuse|relation amoureuse|vie priv[ée]e|instagram|tiktok|buzz de famille|scandale intime|ex[- ]?copine)\b/i;
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ')
 .replace(/&#39;|&apos;/gi,"'").replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();
export function isSportsArticle(article){
 const title=clean(article.title||'');
 const text=title+' '+clean(article.excerpt||article.description||'');
 if(!title||PEOPLE.test(text))return false;
 if(article.source==='FFL'||article.source==='Jeu, set et maths')return true; // Deux éditeurs sportifs spécialisés
 return SPORTS.test(text)||!!article.favorite;
}
export function filterSportsNews(list=[]){return list.filter(isSportsArticle);}
export async function fetchFFLNews({fetchFn=fetch,now=new Date()}={}){
 const endpoints=[
  'https://fflose.com/wp-json/wp/v2/posts?per_page=40&_embed=1&_fields=date,date_gmt,link,title,excerpt,slug,jetpack_featured_media_url,_embedded',
  'https://public-api.wordpress.com/wp/v2/sites/fflose.com/posts?per_page=40&_embed=1&_fields=date,date_gmt,link,title,excerpt,slug,jetpack_featured_media_url,_embedded'
 ];
 let posts=null;
 for(const endpoint of endpoints){
  try{
   const response=await fetchFn(endpoint,{signal:AbortSignal.timeout(9000),cache:'no-store'});
   if(!response.ok)continue;
   const value=await response.json();
   if(Array.isArray(value)){posts=value;break;}
  }catch{}
 }
 if(!posts){
  // Troisième secours : conversion du flux RSS public, sans clé privée.
  try{
   const rss='https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent('https://fflose.com/feed/');
   const response=await fetchFn(rss,{signal:AbortSignal.timeout(9000),cache:'no-store'});
   if(response.ok){
    const obj=await response.json();
    if(Array.isArray(obj.items))posts=obj.items.map(i=>({
     title:{rendered:i.title||''},date_gmt:(()=>{
      const time=Date.parse(i.pubDate||'');
      return Number.isFinite(time)?new Date(time).toISOString().replace(/Z$/,''):'';})(),
     link:i.link,thumbnail:i.thumbnail||i.enclosure?.link||'',excerpt:{rendered:i.description||''}
    }));
   }
  }catch{}
 }
 if(!posts)throw Error('Flux FFL indisponible');
 const start=now.getTime()-7*86400000,end=now.getTime()+10*60000;
 return posts.map(p=>{
  const when=p.date_gmt?p.date_gmt+'Z':p.date;
  const timestamp=Date.parse(when||'');
  if(!Number.isFinite(timestamp)||timestamp<start||timestamp>end)return null;
  const title=clean(p.title?.rendered||p.title);
  const link=p.link;
  if(!/^https:\/\/fflose\.com\//.test(String(link||'')))return null;
  const media=p._embedded?.['wp:featuredmedia']?.[0];
  const image=sourceImage(media?.media_details?.sizes?.thumbnail?.source_url||media?.source_url||
   p.jetpack_featured_media_url||p.thumbnail||p.enclosure?.link);
  return {title,link,date:new Date(timestamp).toISOString(),source:'FFL',
   favorite:'FFL',image,excerpt:clean(p.excerpt?.rendered||'')};
 }).filter(Boolean).filter(isSportsArticle);
}
// Des posts publics vérifiés, extraits du compte @JeuSetMaths par le collecteur.
// L'absence de données valides ne doit jamais produire de publications imaginaires.
// Posts préchargés et conservés localement : les Android avec réseau lent / hors-ligne
// n'affichent jamais un fil vide si un relevé vérifié des 7 derniers jours existe.
const JSM_CACHE_KEY='mon-sport-jeu-set-maths-feed-v15-5';
export function parseJeuSetMathsPosts(data,now=new Date()){
 if(!Array.isArray(data?.posts)||data.source!=='https://x.com/JeuSetMaths')return [];
 const cutoff=now.getTime()-7*86400000;
 return data.posts.filter(p=>{
  const time=Date.parse(p?.date||'');
  return time>=cutoff&&time<=now.getTime()+600000&&
   /^https:\/\/x\.com\/JeuSetMaths\/status\/\d{16,20}$/.test(String(p.link||''))&&
   String(p.title||'').trim().length>10;
 }).slice(0,25).map(p=>{
  const photos=Array.isArray(p.images)?p.images
   .filter(url=>/^https:\/\/pbs\.twimg\.com\/media\//.test(String(url||'')))
   .slice(0,4).map(sourceImage).filter(Boolean):[];
  const fallback=sourceImage(p.image);
  const images=photos.length?photos:fallback?[fallback]:[];
  const video=/^https:\/\/video\.twimg\.com\/[\w/.-]+\.mp4(?:\?[^\s]*)?$/.test(String(p.video||''))
   ?String(p.video):'';
  return {
   title:String(p.title).slice(0,180),link:p.link,date:p.date,
   source:'Jeu, set et maths',favorite:'Jeu, set et maths',sport:'Tennis',
   text:typeof p.text==='string'?p.text.slice(0,30000):'',
   image:images[0]||'',images,video
  };
 });
}
const browserStorage=()=>typeof localStorage==='undefined'?null:localStorage;
export function readCachedJeuSetMathsNews({storage=browserStorage(),now=new Date()}={}){
 try{
  const json=storage?.getItem(JSM_CACHE_KEY);
  return json?parseJeuSetMathsPosts(JSON.parse(json),now):[];
 }catch{return [];}
}
export async function fetchJeuSetMathsNews({fetchFn=fetch,now=new Date(),storage=browserStorage()}={}){
 const cached=readCachedJeuSetMathsNews({storage,now});
 try{
  const response=await fetchFn('./data/jeu-set-et-maths.json',{
   cache:'no-store',signal:AbortSignal.timeout(9500)
  });
  if(!response.ok)return cached;
  const data=await response.json();
  const fresh=parseJeuSetMathsPosts(data,now);
  if(!fresh.length)return cached;
  try{storage?.setItem(JSM_CACHE_KEY,JSON.stringify(data));}catch{}
  return fresh;
 }catch{return cached;}
}
export function findMatchArticles(item,news=[],now=new Date()){
 const day=Date.parse(item.date||''),key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(!Number.isFinite(day))return [];
 const raw=key([item.title,item.competition,item.favorite,...(item.favorites||[])].join(' '));
 const words=raw.split(/[^a-z0-9]+/).filter(w=>w.length>=5&&!['matchs','match','coupe','championnat','tennis','france','course','tournoi','sportif','retour'].includes(w));
 const important=new Set(words);
 return news.filter(n=>{
  if(!isSportsArticle(n))return false;
  const published=Date.parse(n.date||'');
  if(!Number.isFinite(published)||Math.abs(published-day)>5*86400000)return false;
  const text=key((n.title||'')+' '+(n.excerpt||''));
  const hits=words.filter(w=>text.includes(w)).length;
  // La compétition seule ou le mot "tennis" ne suffisent pas.
  return hits>=2||(hits===1&&important.has('wembanyama')&&text.includes('wembanyama'));
 }).slice(0,3);
}
