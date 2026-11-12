// Mon Sport V11 — portraits de sportifs et logos d'équipes, chargés depuis
// leurs producteurs (Wikimedia/ESPN) et vérifiés avant affichage.
// Aucun portrait fictif ni photo d'une autre personne.
const KNOWN={
 'Arthur Fils':'Arthur Fils - 2024 Olympics (still) (cropped).jpg',
 'Jannik Sinner':'Jannik Sinner.jpg',
 'Carlos Alcaraz':'Carlos Alcaraz.jpg',
 'Léon Marchand':'Léon Marchand - JO 2024.jpg',
 'Félix Lebrun':'Félix Lebrun (FRA) 2022.jpg',
 'Alexis Lebrun':'Alexis Lebrun.jpg',
 'Paul Seixas':'Paul Seixas.jpg',
 'Kylian Mbappé':'Kylian Mbappé.jpg',
 'Victor Wembanyama':'Victor Wembanyama.jpg',
 'Moïse Kouamé':'Moïse Kouamé (2026 US Open) 02 (cropped).jpg',
 'Mirra Andreeva':'Mirra Andreeva.jpg'
};
const ARTICLE={
 'Arthur Fils':['Arthur Fils','Arthur Fils'],
 'Jannik Sinner':['Jannik Sinner','Jannik Sinner'],
 'Carlos Alcaraz':['Carlos Alcaraz (tennis)','Carlos Alcaraz'],
 'Léon Marchand':['Léon Marchand','Léon Marchand'],
 'Félix Lebrun':['Félix Lebrun','Félix Lebrun'],
 'Alexis Lebrun':['Alexis Lebrun','Alexis Lebrun'],
 'Flavien Coton':['Flavien Coton','Flavien Coton'],
 'Paul Seixas':['Paul Seixas','Paul Seixas'],
 'Kylian Mbappé':['Kylian Mbappé','Kylian Mbappé'],
 'Victor Wembanyama':['Victor Wembanyama','Victor Wembanyama'],
 'Moïse Kouamé':['Moïse Kouamé','Moise Kouame'],
 'Mirra Andreeva':['Mirra Andreeva','Mirra Andreeva'],
 'Rafael Jódar':['Rafael Jódar','Rafael Jodar'],
 'Sauveur Cristofini':['Sauveur Cristofini','Sauveur Cristofini']
};
const TEAMS={
 'FC Barcelone':{league:'soccer/esp.1',test:/\b(barcelona|fc barcelona)\b/i,wiki:'FC Barcelona'},
 'Real Madrid':{league:'soccer/esp.1',test:/\breal madrid\b/i,wiki:'Real Madrid CF'},
 'PSG':{league:'soccer/fra.1',test:/paris saint|psg/i,wiki:'Paris Saint-Germain FC'},
 'San Antonio Spurs':{league:'basketball/nba',test:/san antonio spurs/i,wiki:'San Antonio Spurs'},
 'Équipe de France de football':{league:'soccer/fifa.world',test:/^france$|france national/i,wiki:'France national football team'},
 'XV de France':{league:'rugby/180659',test:/^france$|france rugby/i,wiki:'France national rugby union team'}
};
const CACHE='mon-sport-photo-v11:';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').trim().replace(/\s+/g,' ');
const samePerson=(name,title)=>{
 const x=normalize(name).split(' '),y=normalize(title).split(' ');
 return x.length>=2&&y.length>=2&&x[0]===y[0]&&x[1]===y[1];
};
const fileLink=file=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(file.replaceAll(' ','_'));
const fileRedirect=file=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=380';
const validImage=url=>/^https:\/\/(?:upload\.wikimedia\.org|a\.espncdn\.com)\//.test(String(url||''));
export function photoInitials(name){return String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'★';}
export function staticPortrait(name){
 if(name==='San Antonio Spurs')return {src:'https://a.espncdn.com/i/teamlogos/nba/500/sas.png',
  fallbackSrc:null,creditUrl:'https://www.nba.com/spurs',credit:'Logo NBA',source:'ESPN'};
 if(name==='FC Barcelone')return {src:fileRedirect('FC Barcelona Logo on Window.jpg'),
  fallbackSrc:null,creditUrl:fileLink('FC Barcelona Logo on Window.jpg'),credit:'Image du blason · Wikimedia Commons',source:'Commons'};
 const file=KNOWN[name];
 return file?{src:fileRedirect(file),fallbackSrc:null,creditUrl:fileLink(file),
  credit:'Wikimedia Commons · attribution/licence sur la fiche',source:'Commons'}:null;
}
async function requestJSON(url){
 const r=await fetch(url,{signal:AbortSignal.timeout(8000),cache:'no-store'});
 if(!r.ok)throw Error('HTTP '+r.status);
 return r.json();
}
async function commonsImage(file){
 const url='https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*'
  +'&prop=imageinfo&iiprop=url&iiurlwidth=380&titles='+encodeURIComponent('File:'+file);
 const page=(await requestJSON(url))?.query?.pages?.[0],image=page?.imageinfo?.[0];
 const src=image?.thumburl||image?.url;
 if(page?.missing||!validImage(src))return null;
 return {src,fallbackSrc:fileRedirect(file),creditUrl:fileLink(file),credit:'Wikimedia Commons · auteur et licence sur fiche',source:'Commons'};
}
async function wikipediaImage(name,lang,title,team=false){
 const url='https://'+lang+'.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*'
  +'&redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pilicense=free&pithumbsize=380&titles='+encodeURIComponent(title);
 const page=(await requestJSON(url))?.query?.pages?.[0];
 if(!team&&!samePerson(name,page?.title))return null;
 if(!validImage(page?.thumbnail?.source)||page?.missing)return null;
 return {src:page.thumbnail.source,fallbackSrc:null,
  creditUrl:'https://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')),
  credit:'Wikipédia · voir le crédit photographique',source:'Wikipedia'};
}
function teamArray(json){
 return json?.sports?.flatMap(s=>s.leagues?.flatMap(l=>l.teams||[])||[])||
  json?.leagues?.flatMap(l=>l.teams||[])||json?.teams||[];
}
async function espnLogo(name,team){
 const url='https://site.api.espn.com/apis/site/v2/sports/'+team.league+'/teams';
 const json=await requestJSON(url);
 for(const row of teamArray(json)){
  const t=row.team||row;
  const title=t.displayName||t.name||t.shortDisplayName||'';
  if(!team.test.test(title))continue;
  const src=t.logos?.find(l=>validImage(l.href))?.href||t.logo||null;
  if(validImage(src))return {src,fallbackSrc:null,
   creditUrl:t.links?.[0]?.href||'https://www.espn.com/',
   credit:'Logo officiel publié dans les données ESPN',source:'ESPN'};
 }
 return null;
}
async function findPortrait(name){
 if(TEAMS[name]){
  try{const logo=await espnLogo(name,TEAMS[name]);if(logo)return logo;}catch{}
  try{return await wikipediaImage(name,'en',TEAMS[name].wiki,true);}catch{}
  return null;
 }
 // Le nom du fichier « connu » n'est qu'une piste : imageinfo vérifie
 // physiquement le fichier. Si absent, ne jamais garder le mauvais portrait.
 if(KNOWN[name])try{const im=await commonsImage(KNOWN[name]);if(im)return im;}catch{}
 const titles=ARTICLE[name];
 if(titles)for(const [i,lang] of ['fr','en'].entries()){
  try{const im=await wikipediaImage(name,lang,titles[i]);if(im)return im;}catch{}
 }
 return null;
}
export async function loadFavoritePhotos(favorites,onPhoto=()=>{}){
 const result={},queue=[];
 for(const f of favorites){
  if(!TEAMS[f.name]&&!ARTICLE[f.name])continue;
  const saved=(()=>{try{return JSON.parse(localStorage.getItem(CACHE+f.name)||'null')}catch{return null}})();
  if(saved?.photo&&Date.now()-saved.at<3*86400000){
   result[f.name]=saved.photo;onPhoto(f.name,saved.photo);continue;
  }
  const quick=staticPortrait(f.name);
  if(quick){result[f.name]=quick;onPhoto(f.name,quick);}
  queue.push(f.name);
 }
 // 3 requêtes en parallèle ; aucun blocage global si une API est en panne.
 for(let i=0;i<queue.length;i+=3){
  const batch=await Promise.all(queue.slice(i,i+3).map(async name=>{
   let photo=null;try{photo=await findPortrait(name);}catch{}
   if(photo)try{localStorage.setItem(CACHE+name,JSON.stringify({photo,at:Date.now()}));}catch{}
   return {name,photo};
  }));
  for(const {name,photo} of batch)if(photo){result[name]=photo;onPhoto(name,photo);}
 }
 return result;
}
