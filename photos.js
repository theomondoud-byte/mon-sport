// Mon Sport V10 : images Wikimedia Commons réelles, sans noms de fichiers
// inventés. Les vignettes sont demandées à l'API imageinfo (URL canonique).
// Le redirect Special:FilePath et les initiales assurent un repli Android.
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
const WIKIPEDIA={
 'Flavien Coton':['Flavien Coton','Flavien Coton'],
 'Rafael Jódar':['Rafael Jódar','Rafael Jodar']
};
const CACHE='mon-sport-photo-v10:';
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ]/g,' ').trim().replace(/\s+/g,' ');
const samePerson=(name,title)=>{
 const expected=normal(name).split(' '),found=normal(title).split(' ');
 return expected.length>=2&&found.length>=2&&expected[0]===found[0]&&expected[1]===found[1];
};
const fileLink=name=>'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name.replaceAll(' ','_'));
const fileRedirect=name=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(name)+'?width=380';
export function photoInitials(name){return String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'★';}
export function staticPortrait(name){
 const file=KNOWN[name];
 return file?{src:fileRedirect(file),fallbackSrc:null,creditUrl:fileLink(file),credit:'Wikimedia Commons · licence et photographe indiqués sur la fiche',source:'Commons'}:null;
}
async function commonsImage(file){
 const url='https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*'
  +'&prop=imageinfo&iiprop=url&iiurlwidth=380&titles='+encodeURIComponent('File:'+file);
 const r=await fetch(url,{signal:AbortSignal.timeout(9000),cache:'no-store'});
 if(!r.ok)throw Error('Commons '+r.status);
 const body=await r.json(),page=body?.query?.pages?.[0];
 if(!page||page.missing)return null;
 const image=page.imageinfo?.[0],thumb=image?.thumburl||image?.url;
 if(typeof thumb!=='string'||!thumb.startsWith('https://upload.wikimedia.org/'))return null;
 return {src:thumb,fallbackSrc:fileRedirect(file),creditUrl:fileLink(file),credit:'Wikimedia Commons · auteur et licence sur la fiche',source:'Commons'};
}
async function wikipediaPortrait(name,lang,title){
 const url='https://'+lang+'.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*'
  +'&redirects=1&prop=pageimages&piprop=thumbnail%7Cname&pilicense=free&pithumbsize=380&titles='+encodeURIComponent(title);
 const r=await fetch(url,{signal:AbortSignal.timeout(8500),cache:'no-store'});
 if(!r.ok)throw Error('Wikipédia '+r.status);
 const page=(await r.json())?.query?.pages?.[0];
 const src=page?.thumbnail?.source;
 if(!samePerson(name,page?.title)||typeof src!=='string'||!src.startsWith('https://upload.wikimedia.org/'))return null;
 return {src,fallbackSrc:null,creditUrl:'https://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')),
  credit:'Wikipédia · crédit photo sur la page',source:'Wikipedia'};
}
export async function loadFavoritePhotos(favorites,onPhoto=()=>{}){
 const result={},jobs=[];
 for(const f of favorites){
  if(f.type!=='sportif')continue;
  const name=f.name,known=staticPortrait(name);
  // Retour immédiat d'une image vérifiée, sans attendre l'API. Pour Android,
  // une URL directe upload.wikimedia.org remplacera le redirect si possible.
  if(known){result[name]=known;onPhoto(name,known);}
  let cached=null;
  try{cached=JSON.parse(localStorage.getItem(CACHE+name)||'null');}catch{}
  if(cached?.photo&&Date.now()-cached.at<3*86400000){
   result[name]=cached.photo;onPhoto(name,cached.photo);continue;
  }
  if(!known&&!WIKIPEDIA[name])continue;
  jobs.push(name);
 }
 for(let i=0;i<jobs.length;i+=3){
  const responses=await Promise.all(jobs.slice(i,i+3).map(async name=>{
   let photo=null;
   if(KNOWN[name]){
    try{photo=await commonsImage(KNOWN[name]);}catch{}
   }
   if(!photo&&WIKIPEDIA[name]){
    for(const [i,lang] of ['fr','en'].entries()){
     try{photo=await wikipediaPortrait(name,lang,WIKIPEDIA[name][i]);if(photo)break;}catch{}
    }
   }
   if(photo)try{localStorage.setItem(CACHE+name,JSON.stringify({photo,at:Date.now()}));}catch{}
   return {name,photo};
  }));
  for(const {name,photo} of responses)if(photo){result[name]=photo;onPhoto(name,photo);}
 }
 return result;
}
