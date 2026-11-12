// Mon Sport V9 — photos réelles et libres, cache réseau réparable.
// V8 mémorisait un échec/null pendant 7 jours : suppression du cache négatif.
// Les portraits Wikimedia vérifiés sont des URLs directes, sans API CORS.
const FILES={
 'Jannik Sinner':'Jannik Sinner (2024 US Open) 04 (cropped).jpg',
 'Carlos Alcaraz':'Carlos Alcaraz (2026 US Open) - 01.jpg',
 'Arthur Fils':'Arthur Fils - 2024 Olympics (still) (cropped).jpg',
 'Léon Marchand':'Léon Marchand - JO 2024.jpg',
 'Félix Lebrun':'20220818 European Championships Munich 2022 Felix Lebrun 850 9499.jpg',
 'Kylian Mbappé':'Kylian Mbappe - France v Senegal - 16 June 2026.jpg'
};
const ARTICLE={
 'Victor Wembanyama':['Victor Wembanyama','Victor Wembanyama'],
 'Léon Marchand':['Léon Marchand','Léon Marchand'],
 'Félix Lebrun':['Félix Lebrun','Félix Lebrun'],
 'Alexis Lebrun':['Alexis Lebrun','Alexis Lebrun'],
 'Flavien Coton':['Flavien Coton','Flavien Coton'],
 'Paul Seixas':['Paul Seixas','Paul Seixas'],
 'Kylian Mbappé':['Kylian Mbappé','Kylian Mbappé'],
 'Arthur Fils':['Arthur Fils','Arthur Fils'],
 'Jannik Sinner':['Jannik Sinner','Jannik Sinner'],
 'Carlos Alcaraz':['Carlos Alcaraz','Carlos Alcaraz'],
 'Rafael Jódar':['Rafael Jódar','Rafael Jodar'],
 'Moïse Kouamé':['Moïse Kouamé','Moise Kouame'],
 'Mirra Andreeva':['Mirra Andreeva','Mirra Andreeva']
};
const CACHE='monsport-photos-v9:';
const tidy=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').trim().replace(/\s+/g,' ');
const matched=(a,b)=>{
 const x=tidy(a).split(' '),y=tidy(b).split(' ');
 return x.length>1&&y.length>1&&x[0]===y[0]&&x[1]===y[1];
};
const fileLink=(name)=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name.replaceAll(' ','_'));
export function photoInitials(name){
 return String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'★';
}
export function staticPortrait(name){
 const filename=FILES[name];
 if(!filename)return null;
 return {
  src:'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(filename)+'?width=360',
  creditUrl:fileLink(filename),
  credit:'Wikimedia Commons · licence et auteur sur la fiche',
  source:'Commons'
 };
}
async function wikiPhoto(name,lang,title){
 const address='https://'+lang+'.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(title.replaceAll(' ','_'));
 const response=await fetch(address,{signal:AbortSignal.timeout(7000),cache:'no-store'});
 if(!response.ok)throw Error('Wikipedia HTTP '+response.status);
 const data=await response.json();
 if(data.type==='disambiguation'||!matched(name,data.title||''))return null;
 const src=data.thumbnail?.source;
 if(!/^https:\/\/upload\.wikimedia\.org\//.test(src||''))return null;
 const link=data.content_urls?.desktop?.page||address;
 return {src,creditUrl:link,credit:'Wikipédia · photo et crédit sur la page',source:'Wikipedia'};
}
export async function loadFavoritePhotos(favorites,onPhoto=()=>{}){
 const result={},jobs=[];
 for(const favorite of favorites){
  if(favorite.type!=='sportif')continue;
  const name=favorite.name;
  // Ressources Wikimedia connues : rendu immédiat, même sans accès aux APIs.
  const known=staticPortrait(name);
  if(known){result[name]=known;onPhoto(name,known);continue;}
  if(!ARTICLE[name])continue;
  try{
   const saved=JSON.parse(localStorage.getItem(CACHE+name)||'null');
   if(saved?.photo&&Date.now()-saved.at<7*86400000){
    result[name]=saved.photo;onPhoto(name,saved.photo);continue;
   }
   if(saved?.empty&&Date.now()-saved.at<30*60000)continue; // 30 minutes seulement
  }catch{}
  jobs.push(name);
 }
 for(let i=0;i<jobs.length;i+=3){
  const data=await Promise.all(jobs.slice(i,i+3).map(async name=>{
   let photo=null,hadResponse=false;
   for(const [index,lang] of ['fr','en'].entries()){
    try{
     photo=await wikiPhoto(name,lang,ARTICLE[name][index]);
     hadResponse=true;
     if(photo)break;
    }catch{}
   }
   try{
    if(photo)localStorage.setItem(CACHE+name,JSON.stringify({at:Date.now(),photo}));
    // Ne JAMAIS conserver une erreur réseau en tant qu'absence de photo.
    else if(hadResponse)localStorage.setItem(CACHE+name,JSON.stringify({at:Date.now(),empty:true}));
   }catch{}
   return {name,photo};
  }));
  for(const {name,photo} of data)if(photo){result[name]=photo;onPhoto(name,photo);}
 }
 return result;
}
