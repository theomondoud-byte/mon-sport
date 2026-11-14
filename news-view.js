import {sportInfo,sourceImage} from './sports-media.js?v=17.4.0';
import {filterSportsNews} from './sports-articles.js?v=17.4.0';
import {sourceIcon} from './source-icons.js?v=17.4.0';
// Mon Sport — fil chronologique, sélection de sources et lecture intégrée.
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
const noHashtags=value=>String(value||'').replace(/(^|\s)#[\p{L}\p{N}_]+/gu,' ').replace(/\s+/g,' ').trim();
export function cleanTitle(value){return noHashtags(decodeEntities(value))||decodeEntities(value);}
export function articleKey(article){return canonicalNewsLink(article?.link);}
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
 // Ne pas fusionner deux posts distincts du même compte ; le rapprochement
 // s'applique uniquement entre médias, et pas aux sources génériques FFL/JSM.
 if(left.source&&left.source===right.source)return false;
 const generic=new Set(['ffl','jeu, set et maths']);
 const sameFavorite=left.favorite&&right.favorite&&normalized(left.favorite)===normalized(right.favorite)
  &&!generic.has(normalized(left.favorite));
 if(sameFavorite)return common>=4&&overlap>=.66&&jaccard>=.5;
 return overlap>=.82&&jaccard>=.62;
}
function newsRichness(article){
 return String(article.text||'').length+String(article.excerpt||article.description||'').length+String(article.title||'').length;
}
export function newsLastWeek(items,now=new Date()){
 const end=now.getTime(),start=end-7*DAY;
 const candidates=(Array.isArray(items)?items:[]).filter(n=>{
  const t=Date.parse(n.date||n.published||'');
  return Number.isFinite(t)&&t>=start&&t<=end+10*60*1000&&n.title&&n.link;
 }).sort((a,b)=>Date.parse(b.date||b.published)-Date.parse(a.date||a.published));
 const ordered=[];
 for(const article of candidates){
  const index=ordered.findIndex(previous=>sameNewsStory(previous,article));
  if(index<0)ordered.push(article);
  else if(newsRichness(article)>newsRichness(ordered[index]))ordered[index]=article;
 }
 // Les publications Jeu, set et maths (25 max) sont toujours conservées,
 // même si le fil des favoris dépasse la limite de 100 cartes.
 const isMaths=n=>n.source==='Jeu, set et maths';
 const maths=ordered.filter(isMaths).slice(0,25);
 const others=ordered.filter(n=>!isMaths(n)).slice(0,100-maths.length);
 return [...maths,...others].sort((a,b)=>Date.parse(b.date||b.published)-Date.parse(a.date||a.published));
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
const KNOWN_ALIASES={
 'PSG':['psg','paris saint-germain','paris saint germain','paris sg'],
 'Real Madrid':['real madrid'],
 'FC Barcelone':['fc barcelona','barcelona','barcelone','barça','barca'],
 'San Antonio Spurs':['san antonio spurs','spurs'],
 'Victor Wembanyama':['victor wembanyama','wembanyama','wemby'],
 'Kylian Mbappé':['kylian mbappe','mbappe'],
 'Équipe de France de football':['equipe de france','les bleus','bleus'],
 'XV de France':['xv de france','equipe de france rugby','france rugby','les bleus du rugby'],
 'Arthur Fils':['arthur fils'],
 'Jannik Sinner':['jannik sinner','sinner'],
 'Carlos Alcaraz':['carlos alcaraz','alcaraz'],
 'Rafael Jódar':['rafael jodar','jodar'],
 'Moïse Kouamé':['moise kouame','kouame'],
 'Mirra Andreeva':['mirra andreeva','andreeva'],
 'Léon Marchand':['leon marchand','marchand'],
 'Sauveur Cristofini':['sauveur cristofini','cristofini'],
 'Félix Lebrun':['felix lebrun'],
 'Alexis Lebrun':['alexis lebrun'],
 'Flavien Coton':['flavien coton'],
 'Paul Seixas':['paul seixas','seixas']
};
export function favoriteAliases(favorite){
 const base=[favorite.name,favorite.apiName,...(KNOWN_ALIASES[favorite.name]||[])];
 return [...new Set(base.map(normalized).filter(alias=>alias.length>=3))];
}
// Un favori de football ne peut pas être associé à un article de tennis :
// « équipe de France » en Coupe Davis n'est pas l'équipe de France de football.
export function sportCompatible(article,favorite){
 const sport=String(article.sport||'').trim();
 if(!sport||!favorite.sport||['Sport','Autre'].includes(sport))return true;
 return sport===favorite.sport;
}
export function titleMentions(article,favorite){
 const title=' '+normalized(noHashtags(article.title))+' ';
 return favoriteAliases(favorite).some(alias=>{
  // Une expression complète est fiable ; un mot seul doit être assez long
  // et entier (jamais une sous-chaîne d'un autre nom).
  if(alias.includes(' '))return title.includes(' '+alias+' ');
  if(alias==='psg')return title.includes(' psg ');
  return alias.length>=5&&title.includes(' '+alias+' ');
 });
}
// Un article parle d'un favori si son nom figure dans le titre (et que le sport concorde).
export function matchesFavorite(article,favorite){
 return sportCompatible(article,favorite)&&titleMentions(article,favorite);
}
export function findFavorite(article,favorites=[]){
 const preferred=favorites.find(f=>f.name===article.favorite);
 if(preferred&&matchesFavorite(article,preferred))return preferred;
 return favorites.find(f=>matchesFavorite(article,f))||null;
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
const HTML_ENTITIES={"AElig":"Æ","Aacute":"Á","Acirc":"Â","Agrave":"À","Alpha":"Α","Aring":"Å","Atilde":"Ã","Auml":"Ä","Beta":"Β","Ccedil":"Ç","Chi":"Χ","Dagger":"‡","Delta":"Δ","ETH":"Ð","Eacute":"É","Ecirc":"Ê","Egrave":"È","Epsilon":"Ε","Eta":"Η","Euml":"Ë","Gamma":"Γ","Iacute":"Í","Icirc":"Î","Igrave":"Ì","Iota":"Ι","Iuml":"Ï","Kappa":"Κ","Lambda":"Λ","Mu":"Μ","Ntilde":"Ñ","Nu":"Ν","OElig":"Œ","Oacute":"Ó","Ocirc":"Ô","Ograve":"Ò","Omega":"Ω","Omicron":"Ο","Oslash":"Ø","Otilde":"Õ","Ouml":"Ö","Phi":"Φ","Pi":"Π","Prime":"″","Psi":"Ψ","Rho":"Ρ","Scaron":"Š","Sigma":"Σ","THORN":"Þ","Tau":"Τ","Theta":"Θ","Uacute":"Ú","Ucirc":"Û","Ugrave":"Ù","Upsilon":"Υ","Uuml":"Ü","Xi":"Ξ","Yacute":"Ý","Yuml":"Ÿ","Zeta":"Ζ","aacute":"á","acirc":"â","acute":"´","aelig":"æ","agrave":"à","alefsym":"ℵ","alpha":"α","amp":"&","and":"∧","ang":"∠","aring":"å","asymp":"≈","atilde":"ã","auml":"ä","bdquo":"„","beta":"β","brvbar":"¦","bull":"•","cap":"∩","ccedil":"ç","cedil":"¸","cent":"¢","chi":"χ","circ":"ˆ","clubs":"♣","cong":"≅","copy":"©","crarr":"↵","cup":"∪","curren":"¤","dArr":"⇓","dagger":"†","darr":"↓","deg":"°","delta":"δ","diams":"♦","divide":"÷","eacute":"é","ecirc":"ê","egrave":"è","empty":"∅","emsp":" ","ensp":" ","epsilon":"ε","equiv":"≡","eta":"η","eth":"ð","euml":"ë","euro":"€","exist":"∃","fnof":"ƒ","forall":"∀","frac12":"½","frac14":"¼","frac34":"¾","frasl":"⁄","gamma":"γ","ge":"≥","gt":">","hArr":"⇔","harr":"↔","hearts":"♥","hellip":"…","iacute":"í","icirc":"î","iexcl":"¡","igrave":"ì","image":"ℑ","infin":"∞","int":"∫","iota":"ι","iquest":"¿","isin":"∈","iuml":"ï","kappa":"κ","lArr":"⇐","lambda":"λ","lang":"〈","laquo":"«","larr":"←","lceil":"⌈","ldquo":"“","le":"≤","lfloor":"⌊","lowast":"∗","loz":"◊","lrm":"‎","lsaquo":"‹","lsquo":"‘","lt":"<","macr":"¯","mdash":"—","micro":"µ","middot":"·","minus":"−","mu":"μ","nabla":"∇","nbsp":" ","ndash":"–","ne":"≠","ni":"∋","not":"¬","notin":"∉","nsub":"⊄","ntilde":"ñ","nu":"ν","oacute":"ó","ocirc":"ô","oelig":"œ","ograve":"ò","oline":"‾","omega":"ω","omicron":"ο","oplus":"⊕","or":"∨","ordf":"ª","ordm":"º","oslash":"ø","otilde":"õ","otimes":"⊗","ouml":"ö","para":"¶","part":"∂","permil":"‰","perp":"⊥","phi":"φ","pi":"π","piv":"ϖ","plusmn":"±","pound":"£","prime":"′","prod":"∏","prop":"∝","psi":"ψ","quot":"\"","rArr":"⇒","radic":"√","rang":"〉","raquo":"»","rarr":"→","rceil":"⌉","rdquo":"”","real":"ℜ","reg":"®","rfloor":"⌋","rho":"ρ","rlm":"‏","rsaquo":"›","rsquo":"’","sbquo":"‚","scaron":"š","sdot":"⋅","sect":"§","shy":"­","sigma":"σ","sigmaf":"ς","sim":"∼","spades":"♠","sub":"⊂","sube":"⊆","sum":"∑","sup":"⊃","sup1":"¹","sup2":"²","sup3":"³","supe":"⊇","szlig":"ß","tau":"τ","there4":"∴","theta":"θ","thetasym":"ϑ","thinsp":" ","thorn":"þ","tilde":"˜","times":"×","trade":"™","uArr":"⇑","uacute":"ú","uarr":"↑","ucirc":"û","ugrave":"ù","uml":"¨","upsih":"ϒ","upsilon":"υ","uuml":"ü","weierp":"℘","xi":"ξ","yacute":"ý","yen":"¥","yuml":"ÿ","zeta":"ζ","zwj":"‍","zwnj":"‌","apos":"'"};
// Certains flux (Tennis Actu « social ») suppriment le « & » des entités :
// « apporteacute; » doit redevenir « apporté », « agrave; » « à ».
const BARE_ENTITY=/(?<!&)([aeiouycnAEIOUYCN])(acute|grave|circ|uml|cedil|tilde);|(?<!&)(oe|OE|ae|AE)lig;|(?<!&)(nbsp|rsquo|lsquo|rdquo|ldquo|laquo|raquo|hellip|ndash|mdash|deg|euro|quot|apos);|(?<!&)#(\d{2,5});/g;
function repairBareEntities(text){
 return text.replace(BARE_ENTITY,(all,letter,accent,lig,named,code)=>{
  if(letter)return HTML_ENTITIES[letter+accent]??all;
  if(lig)return HTML_ENTITIES[lig+'lig']??all;
  if(named)return HTML_ENTITIES[named]??all;
  return String.fromCodePoint(+code);
 });
}
// Décodage répété : certains flux encodent deux fois (&amp;eacute; → &eacute; → é).
export function decodeEntities(value){
 let text=String(value||'');
 for(let pass=0;pass<3;pass++){
  const next=text.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n))
   .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
   .replace(/&([a-zA-Z][a-zA-Z0-9]{1,8});/g,(all,name)=>HTML_ENTITIES[name]??all);
  if(next===text)break;
  text=next;
 }
 return repairBareEntities(text);
}
// HTML d'article (WordPress…) → blocs : paragraphes, citations intégrées
// (tweets, Instagram) et images. Rien n'est jeté sauf scripts et décor.
const NOISE_LINE=/^(?:partager|share|tweet|tweeter|imprimer|print|publicit[ée]|advertisement|lire aussi|à lire aussi|a lire aussi|voir aussi|crédit photo.*|©.*|pic\.twitter\.com\/\w+)$/i;
const NOISE_IMAGE=/gravatar\.com|s\.w\.org\/images\/core\/emoji|\/emoji\/|[\/_-]pixel|spacer|blank\.gif|[\/_-]logo|[\/_-]avatar|[\/_-]icons?[\/_.-]|favicon/i;
export function htmlToBlocks(html,base=''){
 const resolve=src=>{try{const u=new URL(decodeEntities(src),base||undefined);return u.protocol==='https:'?u.href:''}catch{return ''}};
 const marked=String(html||'')
  .replace(/<(script|style|noscript|svg|form|button|nav|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<blockquote[^>]*class=["'][^"']*twitter-tweet[^"']*["'][^>]*>([\s\S]*?)<\/blockquote>/gi,(all,inner)=>{
   const id=(inner.match(/(?:twitter|x)\.com\/\w+\/status(?:es)?\/(\d{10,20})/i)||[])[1];
   return '\n[[TWEETSTART]]\n'+inner+'\n[[TWEETEND '+(id||'0')+']]\n';
  })
  .replace(/<img\b[^>]*>/gi,tag=>{
   if(/wp-smiley|emoji|s\.w\.org\/images\/core\/emoji/i.test(tag))return (tag.match(/\balt=["']([^"']*)["']/i)||[])[1]||'';
   const src=(tag.match(/\b(?:data-lazy-src|data-src|data-orig-file|src)=["']([^"']+)["']/i)||[])[1]||'';
   const url=resolve(src);
   const width=+((tag.match(/\bwidth=["']?(\d+)/i)||[])[1]||0);
   return url&&!NOISE_IMAGE.test(url)&&!(width&&width<80)?'\n[[IMG '+url+']]\n':' ';
  })
  .replace(/<\/?(?:a|span|strong|em|b|i|u|mark|small|sup|sub|abbr|time|cite)\b[^>]*>/gi,'')
  .replace(/<(?:br|\/p|\/h[1-6]|\/li|\/blockquote|\/div|\/figure|\/figcaption|\/section|\/tr)\b[^>]*>/gi,'\n')
  .replace(/<[^>]+>/g,' ');
 const blocks=[],seen=new Set();let inTweet=false,tweetLines=[];
 for(const raw of decodeEntities(marked).replace(/\r/g,'').split(/\n+/)){
  const line=raw.replace(/\s+/g,' ').replace(/ +([,.)])/g,'$1').replace(/([(“"]) +/g,'$1').trim();
  if(!line)continue;
  if(line==='[[TWEETSTART]]'){inTweet=true;tweetLines=[];continue;}
  const tweetEnd=line.match(/^\[\[TWEETEND (\d+)\]\]$/);
  if(tweetEnd){
   inTweet=false;
   const id=tweetEnd[1]==='0'?'':tweetEnd[1];
   if(id&&seen.has('t'+id))continue;
   if(id)seen.add('t'+id);
   const sign=(tweetLines[tweetLines.length-1]||'').match(/^[—–-]\s*(.+?)\s*\((@\w{1,20})\)\s*(.*)$/);
   if(sign)tweetLines.pop();
   if(tweetLines.length||id)blocks.push({type:'tweet',id,lines:tweetLines.slice(0,12),author:sign?sign[1]:'',handle:sign?sign[2]:'',date:sign?sign[3]:''});
   continue;
  }
  if(inTweet){
   const text=line.replace(/https?:\/\/t\.co\/\w+/g,'').replace(/pic\.twitter\.com\/\w+/g,'').replace(/\s+/g,' ').trim();
   if(text.length>1)tweetLines.push(text.slice(0,1500));
   continue;
  }
  const img=line.match(/^\[\[IMG (\S+)\]\]$/);
  if(img){if(!seen.has(img[1])&&blocks.filter(b=>b.type==='img').length<12){seen.add(img[1]);blocks.push({type:'img',src:img[1]});}continue;}
  if(/^(?:[àa] lire aussi|lire aussi|voir aussi|sur le même sujet)\s*[:：]\s*\S/i.test(line))continue;
  if(/^(?:[àa] lire aussi|lire aussi|sur le même sujet)\s*(?:\.\.\.|…|:)?\s*$/i.test(line))break;
  if(line.length<2||NOISE_LINE.test(line))continue;
  blocks.push({type:'p',text:line.slice(0,3000)});
 }
 return blocks.slice(0,200);
}
export function htmlToText(html){
 return htmlToBlocks(html).flatMap(b=>b.type==='p'?[b.text]:b.type==='tweet'?(b.lines||[]):[]).join('\n').slice(0,20000);
}
function mediaBlock(b,esc){
 return b.type==='img'&&/^https:\/\//.test(String(b.src||''))
  ?'<figure class="news-body-figure"><img class="news-body-image" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(b.src)+'" alt="" /></figure>'
  :b.type==='video'&&/^https:\/\/video\.twimg\.com\/[\w\/.%-]+\.mp4(?:\?[^\s"]*)?$/.test(String(b.src||''))
  ?'<figure class="news-body-figure"><video class="news-body-video" controls playsinline preload="none" referrerpolicy="no-referrer"'+(/^https:\/\//.test(String(b.poster||''))?' poster="'+esc(b.poster)+'"':'')+' src="'+esc(b.src)+'"></video></figure>'
  :'';
}
// Tweet intégré : carte avec auteur, texte et médias. Les médias viennent du
// relais à l'ouverture de l'article (repère data-tweet-id en attendant).
function tweetCard(b,esc,tweets){
 const id=/^\d{10,20}$/.test(String(b.id||''))?String(b.id):'';
 const known=id&&tweets?.has?.(id)?tweets.get(id):null;
 const lines=(Array.isArray(b.lines)?b.lines:[]).filter(Boolean);
 const media=known?(known.media||[]).map(m=>mediaBlock(m,esc)).join(''):id?'<div class="news-tweet-media" data-tweet-id="'+esc(id)+'"></div>':'';
 const author=b.author||known?.name||'';
 const handle=b.handle||known?.handle||'';
 if(!lines.length&&!media)return '';
 return '<figure class="news-tweet">'
  +'<figcaption class="news-tweet-head"><span class="news-tweet-x" aria-hidden="true">𝕏</span>'
  +(author?'<b>'+esc(author)+'</b>':'<b>Publication X</b>')+(handle?'<span>'+esc(handle)+'</span>':'')+'</figcaption>'
  +lines.map(l=>'<p>'+esc(l)+'</p>').join('')+media
  +(id?'<a class="news-tweet-link" href="https://x.com/i/status/'+esc(id)+'" target="_blank" rel="noopener noreferrer">Voir sur X ↗</a>':'')
  +'</figure>';
}
export function renderBlocks(blocks,esc,tweets=null){
 return (Array.isArray(blocks)?blocks:[]).map(b=>b.type==='tweet'?tweetCard(b,esc,tweets)
  :b.type==='p'?'<p'+(b.tweet?' class="news-body-tweet"':'')+'>'+esc(b.text)+'</p>':mediaBlock(b,esc)).join('');
}
const TRAILING_NOISE=/\s*(?:…|\.\.\.|\[…\]|\[\.\.\.\])?\s*(?:lire la suite|read more|voir plus)\.?\s*$/i;
export function safeExcerpt(value){
 return decodeEntities(String(value||'').replace(/<[^>]*>/g,' '))
  .replace(/\s+/g,' ').trim().replace(TRAILING_NOISE,'').trim().slice(0,600);
}
// Texte intégral : paragraphes propres, sans la rubrique « À lire aussi » de fin.
const RELATED_SECTION=/\n\s*(?:[àa] lire aussi|lire aussi|sur le même sujet|à voir aussi|voir aussi)\s*(?:\.\.\.|…|:)?\s*\n[\s\S]*$/i;
const RELATED_INLINE=/^\s*(?:[àa] lire aussi|lire aussi|voir aussi|sur le même sujet)\s*:\s*\S.*$/gim;
export function articleParagraphs(text){
 const clean=decodeEntities(String(text||'')).replace(/\r/g,'').replace(RELATED_SECTION,'').replace(RELATED_INLINE,'');
 return clean.split(/\n+/).map(p=>p.replace(/\s+/g,' ').replace(/ +([,.)])/g,'$1').replace(/([(“"]) +/g,'$1').trim()).filter(p=>p.length>1);
}
export function renderArticleBody(text,esc){
 const paragraphs=articleParagraphs(text);
 if(!paragraphs.length)return '';
 return paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('');
}
// Pertinence (hors FFL et Jeu, set et maths) : on garde les comptes rendus
// de matchs joués et les records, on écarte avant-matchs, interviews,
// programmes TV, pronostics et rumeurs de transfert.
const RESULT_WORDS=/\b(s impose|l emporte|bat|battu|battue|bats|victoire|vainqueur|gagne|remporte|remportee?|elimine|eliminee?|elimination|qualifie|qualifiee?|sacre|sacree?|titre|champion|championne|medaille|podium|defaite|s incline|renverse|domine|ecrase|corrige|triomphe|match nul|score|buteur|marque|doublé|double|triple double|double double|points|rebonds|passes decisives|chrono|s offre|prend sa revanche|revanche|dompte|fait tomber|surclasse|vient a bout|terrasse|balaie|balaye|arrache|sombre|chute|tombe|craque|cede|revivez|heroique|exploit|ne font qu une bouchee|deroule|file en|se hisse|couronne|beat|beats|beaten|defeat|defeats|defeated|win|wins|won|victory|rout|routs|edge|edges|tops|outlast|scores|scored|rebounds|assists|advance|advances|eliminated|loses|lost|falls|title|clinch|clinches)\b/;
const RECORD_WORDS=/\b(record|records|historique|histoire|inedit|premier joueur|premiere joueuse|plus jeune|career high|franchise record|first player|youngest|all time|milestone)\b/;
const SCORE_PATTERN=/\b\d{1,3}\s?[-–]\s?\d{1,3}\b/;
const OFF_TOPIC=/\b(affrontera|affronter|affronte ce|se frottera|defiera|avant le match|avant de jouer|programme|horaire|a quelle heure|chaine|diffusion|en direct|pronostic|pronostics|cote|cotes|compo|composition probable|mercato|transfert|rumeur|contrat|prolongation|interview|confie|estime|selon lui|reagit|conference de presse|blessure|blesse|forfait|preview|how to watch|odds|picks|prediction|betting|injury|injured|trade|rumor|contract|what to watch|ce qu il faut savoir|visit|visits|host|hosts|take on|takes on|to face|faces|square off|matchup|slate|fantasy|best player|ranking the|power rankings|grades)\b/;
export function articleRelevance(article){
 const title=normalized(noHashtags(article.title)),body=normalized([article.excerpt,article.description].join(' '));
 const record=RECORD_WORDS.test(title);
 const result=RESULT_WORDS.test(title)||SCORE_PATTERN.test(String(article.title||''));
 const quoted=/^[«"“]|:\s*[«"“]|^[A-Z][\w'’.-]+(?: [A-Z][\w'’.-]+)?: /.test(String(article.title||'').trim());
 const offTopic=OFF_TOPIC.test(title)||quoted||/\?\s*$/.test(String(article.title||'').trim());
 if(record)return 'record';
 if(offTopic)return '';
 return result?'résultat':'';
}
export function relevantFavoriteNews(article,favorites){
 const favorite=findFavorite(article,favorites);
 return favorite&&articleRelevance(article)?favorite:null;
}
// Article de presse correspondant à un résultat : publié entre 6 h avant et
// 3 jours après le match, citant le favori ou l'adversaire dans le titre.
const GENERIC_WORDS=new Set(['match','matchs','coupe','championnat','tennis','france','course','tournoi','finals','final','finale','open','masters','ligue','league','cup','round','groupe','phase','journee','saison','club','team','united','city','real','sporting','olympique','athletic']);
// Mots d'un nom propre comparés par leurs 4 premières lettres (Italy/Italie, Fiji/Fidji…).
const stem=w=>w.slice(0,4);
function mentions(text,words){
 const tokens=new Set(normalized(text).split(/\s+/).filter(w=>w.length>=4).map(stem));
 return words.filter(w=>tokens.has(stem(w))).length;
}
export function matchSummaryArticle(item,news=[],favorites=[]){
 const day=Date.parse(item.date||'');
 if(!Number.isFinite(day))return null;
 const favNames=item.favorites||[item.favorite];
 const favs=favorites.filter(f=>favNames.includes(f.name));
 const favWords=new Set(favs.flatMap(f=>favoriteAliases(f)).flatMap(a=>a.split(' ')).map(stem));
 const opponents=[...new Set(normalized(item.title).split(/\s+/).filter(w=>w.length>=4&&!favWords.has(stem(w))&&!GENERIC_WORDS.has(w)))];
 if(!opponents.length)return null;
 let best=null,bestScore=0;
 for(const n of news){
  const source=newsSourceName(n);
  if(source==='FFL'||source==='Jeu, set et maths')continue;
  const published=Date.parse(n.date||n.published||'');
  if(!Number.isFinite(published)||published<day-6*3600000||published>day+2*86400000)continue;
  if(!favs.some(f=>sportCompatible(n,f)))continue;
  const headline=noHashtags(n.title);
  const favHit=favs.some(f=>titleMentions(n,f)||mentions(headline,favoriteAliases(f).flatMap(a=>a.split(' ')).filter(w=>w.length>=5)));
  const oppTitle=mentions(headline,opponents);
  // Le favori ET l'adversaire doivent figurer dans le TITRE (un extrait peut
  // citer le prochain adversaire) ; un avant-match est écarté.
  if(!favHit||!oppTitle)continue;
  const relevance=articleRelevance(n);
  if(!relevance&&OFF_TOPIC.test(normalized(n.title)))continue;
  const score=oppTitle*3+(relevance?2:0)+(safeExcerpt(n.excerpt||n.description)?1:0)-(published-day)/86400000;
  if(score>bestScore){best=n;bestScore=score;}
 }
 if(!best)return null;
 return {title:cleanTitle(best.title),excerpt:safeExcerpt(best.excerpt||best.description),link:best.link,source:newsSourceName(best),image:best.image||''};
}
// Deux articles au plus par rencontre d'un favori. Une « rencontre » est le
// match le plus récent du favori avant la publication (à défaut : le jour).
export function limitPerMatch(articles,favorites=[],matches=[],max=2){
 const groups=new Map();
 for(const article of articles){
  const favorite=findFavorite(article,favorites);
  if(!favorite)continue;
  const published=Date.parse(article.date||article.published||'');
  const match=matches.filter(m=>(m.favorites||[]).includes(favorite.name)).map(m=>({m,start:Date.parse(m.date||'')}))
   .filter(x=>Number.isFinite(x.start)&&published>=x.start-6*3600000&&published<=x.start+60*3600000)
   .sort((a,b)=>b.start-a.start)[0];
  // Même rencontre pour deux favoris (Spurs et Wembanyama) : un seul groupe.
  const key=match?'match:'+match.m.date+':'+match.m.title:favorite.name+'|jour:'+new Date(published).toISOString().slice(0,10);
  const opponents=match?normalized(match.m.title).split(/\s+/).filter(w=>w.length>=4&&!favoriteAliases(favorite).some(a=>a.split(' ').includes(w))&&!GENERIC_WORDS.has(w)):[];
  // Le meilleur d'abord : compte rendu citant l'adversaire, record, extrait fourni.
  const relevance=articleRelevance(article);
  const score=(opponents.length&&mentions(noHashtags(article.title),opponents)?4:0)+(relevance==='record'?3:relevance?2:0)+(safeExcerpt(article.excerpt||article.description)?1:0)+(article.image?0.5:0)+(newsSourceName(article)==='ESPN'?0:2.5);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({article,score,published});
 }
 const kept=new Set();
 for(const list of groups.values())
  list.sort((a,b)=>b.score-a.score||b.published-a.published).slice(0,max).forEach(x=>kept.add(x.article));
 return kept;
}
export function renderNewsView({news=[],loading=false,hasWorker=false,photos={},esc,safeUrl,now=new Date(),sourceFilter='Tous',selectedSources=[],sportFilter='Tous',favoriteFilter='Tous',favorites=[],showAllRelated=false,readKeys=new Set(),readView='unread',keepVisible=new Set(),tweets=null,matches=[]}={}){
 const recentAll=newsLastWeek(news,now);
 const always=n=>['FFL','Jeu, set et maths'].includes(newsSourceName(n));
 const linked=recentAll.filter(n=>!always(n)&&findFavorite(n,favorites));
 const relevant=limitPerMatch(linked.filter(n=>relevantFavoriteNews(n,favorites)),favorites,matches,2);
 const hidden=linked.length-relevant.size;
 const visible=recentAll.filter(n=>always(n)||relevant.has(n)||(showAllRelated&&linked.includes(n)));
 // Un article ouvert reste visible dans « À lire » jusqu'au prochain passage
 // dans l'onglet, pour ne pas disparaître pendant la lecture.
 const isRead=n=>readKeys.has(articleKey(n))&&!keepVisible.has(articleKey(n));
 const unreadList=visible.filter(n=>!isRead(n)),readList=visible.filter(isRead);
 const section=readView==='read'?readList:unreadList;
 const sourceOptions=[...new Set(section.map(newsSourceName))].sort((a,b)=>a.localeCompare(b,'fr'));
 const counts=new Map();for(const n of section)counts.set(newsSourceName(n),(counts.get(newsSourceName(n))||0)+1);
 const chosen=selectedSources.length?selectedSources:[];
 const recent=section.filter(n=>!chosen.length||chosen.includes(newsSourceName(n)));
 const mathsTotal=visible.filter(n=>n.source==='Jeu, set et maths').length;
 const sourceButton=name=>'<button type="button" class="news-source-chip '+(chosen.includes(name)?'active':'')+'" data-news-source="'+esc(name)+'" aria-pressed="'+(chosen.includes(name)?'true':'false')+'">'+sourceIcon(name,esc,'small')+esc(name)+' <span>'+(counts.get(name)||0)+'</span></button>';
 const sourceControls='<div class="news-filter-block"><span class="news-filter-label">Sources à afficher</span><div class="news-source-filters" role="group" aria-label="Sélectionner les sources">'+sourceOptions.map(sourceButton).join('')+'</div><button type="button" class="button ghost" id="newsSourcesAll">Toutes les sources</button></div>';
 const ordered=recent;
 const head='<section class="news-feed"><div class="news-intro"><span class="agenda-eyebrow">ACTUALITÉS · 7 DERNIERS JOURS</span><h2>Articles et posts sportifs</h2><p>FFL et Jeu, set et maths en entier. Autres médias : résultats et records de tes favoris, 2 articles au plus par rencontre.</p><div class="jsm-feed-indicator" role="status">'+sourceIcon('Jeu, set et maths',esc,'small')+' Jeu, set et maths : <b>'+mathsTotal+' publication'+(mathsTotal!==1?'s':'')+'</b><button id="jsmRefresh" class="button ghost" type="button">↻ Posts</button></div>'+'<div class="news-read-tabs" role="tablist" aria-label="Articles lus ou non">'
   +'<button type="button" role="tab" data-news-view="unread" aria-selected="'+(readView!=='read')+'" class="'+(readView!=='read'?'active':'')+'">À lire <span>'+unreadList.length+'</span></button>'
   +'<button type="button" role="tab" data-news-view="read" aria-selected="'+(readView==='read')+'" class="'+(readView==='read'?'active':'')+'">Lus <span>'+readList.length+'</span></button></div>'
   +sourceControls+'</div><div class="agenda-countbar"><strong>'+recent.length+' article'+(recent.length!==1?'s':'')+(readView==='read'?' lu'+(recent.length!==1?'s':''):' à lire')+'</strong>'
   +(readView!=='read'&&recent.length?'<button type="button" class="button ghost news-mark-all" id="newsMarkAll">✓ Tout marquer comme lu</button>':'<span>Tri chronologique · plus récent d’abord</span>')+'</div>'
   +'<p class="news-swipe-hint">Tri chronologique, plus récent d’abord · '+(readView!=='read'?'glisse un article vers la gauche pour le ranger dans « Lus ».':'glisse un article vers la gauche pour le remettre dans « À lire ».')+'</p>'
  +(hidden>0?'<div class="news-hidden-note"><span>'+(showAllRelated?hidden+' article'+(hidden>1?'s':'')+' hors résultats/records affiché'+(hidden>1?'s':''):hidden+' article'+(hidden>1?'s':'')+' sur tes favoris écarté'+(hidden>1?'s':'')+' (avant-match, interview, au-delà de 2 par rencontre…)')+'</span><button type="button" class="button ghost" id="newsShowAll">'+(showAllRelated?'Masquer':'Afficher quand même')+'</button></div>':'');
 const cardHtml=n=>{
  const link=safeUrl(n.link);
  if(link==='#')return '';
  const published=new Date(n.date||n.published).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const sport=sportInfo(n.sport,n.favorite,n.title,n.excerpt);
  const linkedFavorite=findFavorite(n,favorites);
  const firstBodyImage=(Array.isArray(n.blocks)?n.blocks:[]).find(b=>b.type==='img')?.src;
  const image=sourceImage(n.image)||sourceImage(firstBodyImage)||sourceImage(photos?.[linkedFavorite?.name||n.favorite]?.src);
  const sportClass='sport-'+normalized(sport.name).replace(/\s+/g,'-');
  const picture='<span class="article-visual '+sportClass+(image?'':' article-visual-empty')+'">'
   +(image?'<img class="article-thumb-image" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(image)+'" alt="" />':'')
   +'<span class="article-image-fallback" aria-hidden="true">'+sport.icon+'</span></span>';
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
    +'<header class="jsm-native-header"><div>'+sourceIcon('Jeu, set et maths',esc,'large')
    +'<span class="jsm-native-author"><b>Jeu, set et maths</b><small>@JeuSetMaths · 🎾 Tennis</small></span></div>'
    +'<time class="news-date" datetime="'+esc(n.date||'')+'">'+esc(published)+'</time></header>'
    +'<p class="jsm-native-text">'+esc(fullText||n.title)+'</p>'
    +(fullText?'':'<p class="jsm-native-note">Seul le court extrait est actuellement disponible ; le prochain relevé complétera le texte.</p>')
    +gallery+media
    +'<footer class="jsm-native-footer"><span>Publication attribuée à Jeu, set et maths</span>'
    +'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer" aria-label="Source originale sur X">Source originale ↗</a></footer>'
    +'</article>';
  }
  const favorite=always(n)?null:linkedFavorite;
  const excerpt=safeExcerpt(n.excerpt||n.description);
  return '<article class="news-card news-link-card'+(favorite?' has-favorite':'')+'">'
    +picture+'<div class="news-text"><div class="news-card-top"><span class="news-sport" aria-label="'+esc(sport.name)+'"><span aria-hidden="true">'+sport.icon+'</span> '+esc(sport.name)+'</span>'
    +'<span class="news-date">'+esc(published)+'</span></div>'
    +'<h3>'+esc(cleanTitle(n.title))+'</h3>'
    +(excerpt?'<p class="news-excerpt">'+esc(excerpt)+'</p>':'')
    +'<div class="news-meta"><span class="news-source">'+sourceIcon(newsSourceName(n),esc)+esc(newsSourceName(n))+'</span>'
    +(favorite?'<span class="news-favorite" title="Article lié à un favori">⭐ '+esc(favorite.name)+'</span>':'')+'</div>'
    +'<div class="news-actions"><button type="button" class="button news-read-inline" data-read-article="'+esc(link)+'"'+(n.text||n.blocks?.length?' data-local-text="1"':'')+'>Lire dans Mon Sport</button><a class="news-tap" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Source originale ↗</a></div>'
    +'<div class="news-fulltext" data-article-content="'+esc(link)+'" hidden>'+(n.blocks?.length?renderBlocks(n.blocks,esc,tweets):n.text?renderArticleBody(n.text,esc):'')+'</div></div></article>';
 };
 const cards=ordered.map(n=>{
  const card=cardHtml(n);
  if(!card)return '';
  const key=articleKey(n),read=readView==='read';
  return '<div class="news-swipe" data-article-key="'+esc(key)+'">'
   +'<div class="news-swipe-action" aria-hidden="true">'+(read?'↩ À lire':'✓ Lu')+'</div>'
   +card.replace(/<\/article>$/,'<button type="button" class="news-mark" data-mark-read="'+esc(key)+'" aria-label="'+(read?'Remettre dans À lire':'Marquer comme lu')+'">'+(read?'↩':'✓')+'</button></article>')
   +'</div>';
 }).join('');
 return head+(loading?'<p class="agenda-progress">Actualisation du fil…</p>':'')
  +(cards||(readView!=='read'&&!unreadList.length&&visible.length
   ?'<div class="agenda-empty"><h3>Tout est lu 🎉</h3><p>Les nouveaux articles apparaîtront ici. Les articles lus restent dans l’onglet « Lus ».</p></div>'
   :'<div class="agenda-empty"><h3>Aucun article ici</h3><p>Essaie de sélectionner d’autres sources.</p></div>'))
  +(!hasWorker?'<p class="agenda-footnote">Les flux RSS Tennis Actu, Franceinfo, Basket USA, TrashTalk et Cyclism’Actu nécessitent l’URL du Worker Cloudflare dans Paramétrage. Sans cette URL, seuls les flux FFL, ESPN et Jeu, set et maths sont affichés.</p>':'')
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
export async function fetchSportsNews(favorites,now=new Date(),workerUrl=''){
 const aliases=favorite=>favoriteAliases(favorite);
 const leagueSport=path=>path.startsWith('soccer/')?'Football':path.startsWith('basketball/')?'Basketball':path.startsWith('tennis/')?'Tennis':'';
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
   const text=normalized(title);
   const words=new Set(text.split(/\s+/));
   const sport=leagueSport(path);
   const fav=favorites.find(f=>sportCompatible({sport},f)&&aliases(f).some(alias=>{
    if(alias.includes(' '))return text.includes(alias);
    return alias.length>=5&&words.has(alias);
   }));
   if(!fav||!/^https?:\/\//.test(link))return null;
   const image=(a.images||a.image||[]);
   const editorial=Array.isArray(image)?image.find(v=>v?.url||v?.href):image;
   return {title,link,date,source:'ESPN',favorite:fav.name,sport:sport||fav.sport,excerpt:description,image:sourceImage(editorial?.url||editorial?.href||editorial)};
  }).filter(Boolean);
 }));

 const curated=workerUrl?await (async()=>{
  try{
   const response=await fetch(new URL('/api/sports-news',workerUrl),{signal:AbortSignal.timeout(25000),cache:'no-store'});
   if(!response.ok)throw Error('Flux RSS '+response.status);
   const body=await response.json();
   return (body.articles||[]).map(article=>{
    const cleaned={...article,title:decodeEntities(article.title),excerpt:safeExcerpt(article.excerpt),source:article.source||'Média sportif'};
    if(cleaned.source==='FFL')return {...cleaned,favorite:'FFL'};
    const favorite=favorites.find(f=>matchesFavorite(cleaned,f));
    return {...cleaned,...(favorite?{favorite:favorite.name}:{})};
   });
  }catch{return []}
 })():[];
 return newsLastWeek([...settled.flatMap(x=>x.status==='fulfilled'?x.value:[]),...curated],now);
}
