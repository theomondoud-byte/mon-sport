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
 if(article.source==='FFL')return true; // FFL : actualités satiriques sportives
 return SPORTS.test(text)||!!article.favorite;
}
export function filterSportsNews(list=[]){return list.filter(isSportsArticle);}
export async function fetchFFLNews({fetchFn=fetch,now=new Date()}={}){
 const endpoints=[
  'https://fflose.com/wp-json/wp/v2/posts?per_page=40&_fields=date,date_gmt,link,title,excerpt,slug',
  'https://public-api.wordpress.com/wp/v2/sites/fflose.com/posts?per_page=40&_fields=date,date_gmt,link,title,excerpt,slug'
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
     link:i.link,excerpt:{rendered:i.description||''}
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
  return {title,link,date:new Date(timestamp).toISOString(),source:'FFL',
   favorite:'FFL',excerpt:clean(p.excerpt?.rendered||'')};
 }).filter(Boolean).filter(isSportsArticle);
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
