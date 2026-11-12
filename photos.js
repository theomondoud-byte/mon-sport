// V8 — portraits libres via les vignettes des articles Wikipédia.
// Pas de photo inventée : à défaut de fichier libre fiable, on affiche
// les initiales. Une attribution ouvre la page du fichier sur Commons.
const WIKI_TITLES={
 'Victor Wembanyama':['Victor Wembanyama','Victor Wembanyama'],
 'Léon Marchand':['Léon Marchand (natation)','Léon Marchand'],
 'Félix Lebrun':['Félix Lebrun','Félix Lebrun'],
 'Alexis Lebrun':['Alexis Lebrun','Alexis Lebrun'],
 'Flavien Coton':['Flavien Coton','Flavien Coton'],
 'Paul Seixas':['Paul Seixas','Paul Seixas'],
 'Kylian Mbappé':['Kylian Mbappé','Kylian Mbappé'],
 'Arthur Fils':['Arthur Fils','Arthur Fils'],
 'Jannik Sinner':['Jannik Sinner','Jannik Sinner'],
 'Carlos Alcaraz':['Carlos Alcaraz (tennis)','Carlos Alcaraz'],
 'Rafael Jódar':['Rafael Jódar','Rafael Jódar'],
 'Moïse Kouamé':['Moïse Kouamé','Moise Kouame'],
 'Mirra Andreeva':['Mirra Andreeva','Mirra Andreeva']
};
const CACHE='monsport-portraits-v8:';
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
const acceptable=(wanted,title)=>{
 const a=key(wanted).split(' '),b=key(title).split(' ');
 return a.length>=2&&b.length>=2&&a[0]===b[0]&&a[1]===b[1];
};
export function photoInitials(name){
 const parts=String(name||'').trim().split(/\s+/);
 return parts.slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'★';
}
async function wikiImage(name,language,title){
 const url='https://'+language+'.wikipedia.org/w/api.php?action=query&format=json&formatversion=2'
  +'&origin=*&redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pilicense=free'
  +'&pithumbsize=360&titles='+encodeURIComponent(title);
 const response=await fetch(url,{signal:AbortSignal.timeout(9000)});
 if(!response.ok)throw Error('Wikipedia '+response.status);
 const json=await response.json(),page=json?.query?.pages?.[0];
 if(!page||page.missing||!acceptable(name,page.title))return null;
 const src=page.thumbnail?.source;
 if(typeof src!=='string'||!/^https:\/\/upload\.wikimedia\.org\//.test(src))return null;
 if(/(?:logo|signature|flag|blason|icon)\b/i.test(page.pageimage||''))return null;
 const fileName=page.pageimage||'';
 return {
  src,
  creditUrl:fileName?'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(fileName)
   :'https://'+language+'.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')),
  credit:'Wikimedia Commons · voir licence'
 };
}
export async function loadFavoritePhotos(favorites,onPhoto=()=>{}){
 const athletes=favorites.filter(f=>f.type==='sportif'&&WIKI_TITLES[f.name]);
 const results={},jobs=[];
 for(const athlete of athletes){
  const name=athlete.name;
  try{
   const saved=JSON.parse(localStorage.getItem(CACHE+name)||'null');
   if(saved&&Date.now()-saved.at<7*86400000){
    if(saved.photo)results[name]=saved.photo;
    continue;
   }
  }catch{}
  jobs.push(name);
 }
 // 3 requêtes en parallèle au plus pour éviter une rafale d'appels.
 for(let i=0;i<jobs.length;i+=3){
  const found=await Promise.all(jobs.slice(i,i+3).map(async name=>{
   const titles=WIKI_TITLES[name];
   let photo=null;
   for(const [idx,language] of ['fr','en'].entries()){
    try{photo=await wikiImage(name,language,titles[idx]);if(photo)break;}catch{}
   }
   try{localStorage.setItem(CACHE+name,JSON.stringify({photo,at:Date.now()}));}catch{}
   return {name,photo};
  }));
  for(const item of found){
   if(item.photo){results[item.name]=item.photo;onPhoto(item.name,item.photo);}
  }
 }
 return results;
}
