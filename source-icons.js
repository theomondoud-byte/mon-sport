// Icônes des sources : pastille ronde, couleur du média et monogramme lisible
// même en 18 px. Aucune image distante : disponibles hors connexion.
const SOURCES={
 'FFL':{label:'FFL',bg:'#d7263d',fg:'#ffffff',title:'Fédération Française de la Lose'},
 'Jeu, set et maths':{label:'JSM',bg:'#0f766e',fg:'#e7fff9',title:'Jeu, set et maths'},
 'ESPN':{label:'E',bg:'#c8102e',fg:'#ffffff',title:'ESPN'},
 'Tennis Actu':{label:'TA',bg:'#2f7d32',fg:'#ffffff',title:'Tennis Actu'},
 'Franceinfo':{label:'fi',bg:'#ffd200',fg:'#1b2c7a',title:'Franceinfo'},
 'Basket USA':{label:'BU',bg:'#e8642c',fg:'#ffffff',title:'Basket USA'},
 'TrashTalk':{label:'#',bg:'#111827',fg:'#ff3b3b',title:'TrashTalk'},
 "Cyclism'Actu":{label:'CA',bg:'#6d3fc0',fg:'#ffffff',title:"Cyclism'Actu"}
};
const PALETTE=['#33658a','#86598f','#2f6f73','#9a6b2f','#4a5b8c'];
export function sourceStyle(name){
 const known=SOURCES[String(name||'').trim()];
 if(known)return known;
 const clean=String(name||'?').replace(/^www\./,'').trim();
 const words=clean.split(/[\s.'’-]+/).filter(Boolean);
 const label=(words.length>1?words[0][0]+words[1][0]:clean.slice(0,2)).toUpperCase();
 let hash=0;for(const c of clean)hash=(hash*31+c.charCodeAt(0))>>>0;
 return {label,bg:PALETTE[hash%PALETTE.length],fg:'#ffffff',title:clean};
}
export function sourceIcon(name,esc,size=''){
 const s=sourceStyle(name);
 return '<span class="source-icon'+(size?' '+size:'')+(s.label.length>=3?' long':'')+'" style="--src-bg:'+s.bg+';--src-fg:'+s.fg+'" title="'+esc(s.title)+'" aria-hidden="true">'+esc(s.label)+'</span>';
}
