#!/usr/bin/env node
// Génère style-light.css (thème clair) à partir de style.css (thème sombre).
// Chaque couleur garde sa teinte ; seule sa luminosité est retournée :
// fonds sombres → fonds clairs, textes clairs → textes foncés.
// Usage : node scripts/build-light-theme.mjs   (à relancer après toute
// modification de style.css ; un test vérifie que le fichier est à jour).
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');

function toHsl(r,g,b){
 r/=255;g/=255;b/=255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
 if(max===min)return [0,0,l];
 const d=max-min,s=l>0.5?d/(2-max-min):d/(max+min);
 const h=max===r?((g-b)/d+(g<b?6:0)):max===g?(b-r)/d+2:(r-g)/d+4;
 return [h/6,s,l];
}
function toRgb(h,s,l){
 if(s===0){const v=Math.round(l*255);return [v,v,v];}
 const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
 const t=x=>{x=(x+1)%1;return x<1/6?p+(q-p)*6*x:x<1/2?q:x<2/3?p+(q-p)*(2/3-x)*6:p;};
 return [t(h+1/3),t(h),t(h-1/3)].map(v=>Math.round(v*255));
}
// Luminosité : continue en 0,5 ; les fonds (sombres) deviennent très clairs,
// les textes et accents (clairs) deviennent assez foncés pour rester lisibles.
export function lightness(l){
 // Fonds : presque blancs pour la page, cartes et bordures un peu plus marquées.
 return l<0.5?1-0.3*l-0.9*l*l:Math.max(0.1,0.625-1.05*Math.pow(l-0.5,0.72));
}
export function convert(r,g,b){
 const [h,s,l]=toHsl(r,g,b);
 // Les fonds bleu nuit donnent des clairs à peine teintés ; les accents gardent leur couleur.
 const saturation=l<0.5?s*(0.35+0.6*l):Math.min(1,s*0.95);
 return toRgb(h,saturation,lightness(l));
}
const hex2=v=>v.toString(16).padStart(2,'0');
export function lightTheme(css){
 return css
  // Le seul nom de couleur utilisé : « white ».
  .replace(/(color|background):white\b/g,'$1:#ffffff')
  .replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,(all,hex)=>{
   const full=hex.length===3?hex.split('').map(c=>c+c).join(''):hex;
   const [r,g,b]=[0,2,4].map(i=>parseInt(full.slice(i,i+2),16));
   const alpha=full.length===8?full.slice(6):'';
   // Ombres et fonds de lecteur vidéo (noir pur) : inchangés.
   if(r===0&&g===0&&b===0)return all;
   // Ombres portées colorées : très atténuées sur fond clair.
   const out=convert(r,g,b);
   return '#'+out.map(hex2).join('')+alpha;
  })
  .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g,(all,r,g,b,a)=>{
   if(+r===0&&+g===0&&+b===0)return all;
   const out=convert(+r,+g,+b);
   return a===undefined?'rgb('+out.join(',')+')':'rgba('+out.join(',')+','+a+')';
  })
  .replace('color-scheme:dark','color-scheme:light');
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const css=await readFile(join(root,'style.css'),'utf8');
 const header='/* Fichier généré par scripts/build-light-theme.mjs à partir de style.css — ne pas modifier à la main. */\n';
 await writeFile(join(root,'style-light.css'),header+lightTheme(css)+await readFile(join(root,'style-light-overrides.css'),'utf8').catch(()=>''));
 console.log('✔ style-light.css généré');
}
