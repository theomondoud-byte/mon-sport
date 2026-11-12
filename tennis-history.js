// Mon Sport V5.2 — Archives gratuites ATP, Challenger, ITF et WTA.
// Source : Jeff Sackmann, miroir Aneeshers/tennis-sackmann-archive.
// Licence des DONNÉES : CC BY-NC-SA 4.0 (usage personnel et non commercial).
// Le miroir a été mis à jour le 25 juin 2026 : il ne donne PAS les derniers matchs.
export const TENNIS_HISTORY_SOURCE =
  'https://github.com/Aneeshers/tennis-sackmann-archive';
export const TENNIS_LATEST_SOURCE =
  'https://fr.tennistemple.com/player/moise-kouame/results';
const MIRROR='https://raw.githubusercontent.com/Aneeshers/tennis-sackmann-archive/main/';
const filesForYear=year=>[
 [`atp/atp_matches_${year}.csv`,'ATP'],
 [`atp/atp_matches_qual_chall_${year}.csv`,'ATP / Challenger / qualifications'],
 [`atp/atp_matches_futures_${year}.csv`,'ITF masculin'],
 [`wta/wta_matches_${year}.csv`,'WTA'],
 [`wta/wta_matches_qual_itf_${year}.csv`,'ITF féminin / qualifications']
];
const CACHE_PREFIX='mon-sport-history-v5-2:';
const SNAPSHOT_DATE='2026-11-12';
// Sources des faits : TennisExplorer et TennisTemple (liens uniquement, pas de scraping).
// Relevé MANUEL : ne prétend pas se mettre à jour automatiquement.
const KOUAME_MATCHES=[
 ['2026-11-11','Jonas Forejtek','D','6-4 4-6 6-4','Monastir Challenger','R16'],
 ['2026-11-09','Rudolf Strombachs','V','6-3 6-4','Monastir Challenger','R32'],
 ['2026-11-03','Nuno Borges','D','6-3 6-1','Paris Masters','R64'],
 ['2026-11-01','Martin Damm','V','6-4 6-7(5) 7-6(4)','Brest Challenger','Finale'],
 ['2026-10-31','Otto Virtanen','V','6-1 6-2','Brest Challenger','Demi-finale'],
 ['2026-10-30','Francesco Maestrelli','V','6-3 6-4','Brest Challenger','Quart de finale'],
 ['2026-10-29','Hugo Gaston','V','7-5 2-1 RET','Brest Challenger','Huitième de finale'],
 ['2026-10-27','Hugo Grenier','V','6-4 7-6(1)','Brest Challenger','Premier tour'],
 ['2026-10-21','Lorenzo Musetti','D','6-4 6-4','Lyon ATP 250','Deuxième tour'],
 ['2026-10-19','Lorenzo Sonego','V','7-6(2) 6-4','Lyon ATP 250','Premier tour'],
 ['2026-10-15','Nicolai Budkov Kjaer','D','6-4 6-2','Roanne Challenger','Huitième de finale'],
 ['2026-10-13','Diego Dedura','V','6-1 6-4','Roanne Challenger','Premier tour'],
 ['2026-09-30','Adam Walton','D','6-1 6-4','Jingshan Challenger','Premier tour'],
 ['2026-09-24','Alexandre Muller','D','6-4 6-0','Chengdu ATP 250','Premier tour'],
 ['2026-09-19','Rodrigo Pacheco Méndez','D','2-6 6-3 6-4','Phan Thiet Challenger','Demi-finale'],
 ['2026-09-18','Florent Bax','V','6-4 6-2','Phan Thiet Challenger','Quart de finale'],
 ['2026-09-17','Filip Peliwo','V','6-1 4-2 RET','Phan Thiet Challenger','Huitième de finale'],
 ['2026-09-15','Ryuki Matsuda','V','6-1 6-3','Phan Thiet Challenger','Premier tour'],
 ['2026-09-08','Kenta Miyoshi','D','4-6 6-4 7-5','Phan Thiet Challenger','Premier tour'],
 ['2026-08-25','Nishesh Basavareddy','D','7-6(3) 4-6 6-3','US Open - qualifications','Qualification 1'],
 ['2026-07-29','Edward Winter','D','6-1 6-4','Los Cabos ATP 250','Premier tour'],
 ['2026-07-14','Nuno Borges','D','6-4 6-2','Bastad ATP 250','Premier tour'],
 ['2026-07-06','Max Hans Rehberg','D','6-4 6-4','Braunschweig Challenger','Premier tour'],
 ["2026-08-22','Moez Echargui','D','6-4 2-6 7-6(5)','Cancun Challenger','Quart de finale"],
 ["2026-08-21','Roman Andrés Burruchaga','V','6-2 6-2','Cancun Challenger','Huitième de finale"],
 ["2026-08-20','Felipe Meligeni Alves','V','6-1 6-4','Cancun Challenger','Premier tour"],
 ["2026-05-30','Alejandro Tabilo','D','4-6 6-3 6-4 7-6(9)','Roland-Garros','Troisième tour"],
 ["2026-05-28','Adolfo Daniel Vallejo','V','6-3 7-5 3-6 2-6 7-6(8)','Roland-Garros','Deuxième tour"],
 ["2026-05-26','Marin Čilić','V','7-6(4) 6-2 6-1','Roland-Garros','Premier tour"],
 ["2026-05-19','Jacopo Vasami','D','6-3 7-6(3)','Cervia Challenger','Premier tour"],
 ["2026-05-12','Benjamin Bonzi','D','2-6 6-4 6-0','Bordeaux Challenger','Premier tour"],
 ["2026-04-20','Patrick Kypson','D','6-2 6-2','Madrid Masters - qualifications','Qualification 1"],
 ["2026-04-18','Juan Cruz Martin Manzano','V','6-3 4-6 6-3','Santa Margherita di Pula ITF M25','Finale"],
 ["2026-04-17','Philip Henning','V','6-2 6-3','Santa Margherita di Pula ITF M25','Demi-finale"],
 ["2026-04-17','Andrey Chepelev','V','6-1 6-2','Santa Margherita di Pula ITF M25','Quart de finale"],
 ["2026-04-15','Francesco Ferrari','V','6-2 6-0','Santa Margherita di Pula ITF M25','Huitième de finale"],
 ["2026-04-14','Henry Bernet','V','7-5 2-6 6-4','Santa Margherita di Pula ITF M25','Premier tour"],
 ["2026-04-05','Ugo Humbert','D','6-3 7-5','Monte-Carlo Masters','Premier tour"],
 ["2026-03-21','Jiří Lehečka','D','6-2 7-5','Miami Masters','Deuxième tour"],
 ["2026-03-19','Zachary Svajda','V','5-7 6-4 6-4','Miami Masters','Premier tour"],
 ["2026-03-06','Hugo Gaston','D','3-6 6-3 6-4','Thionville Challenger','Quart de finale"],
 ["2026-03-04','Giulio Zeppieri','V','6-1 1-0 (abandon adverse)','Thionville Challenger','Huitième de finale"],
 ["2026-03-03','Jelle Sels','V','6-3 6-0','Thionville Challenger','Premier tour"],
 ["2026-02-25','Titouan Droguet','D','7-6(3) 6-4','Saint-Brieuc Challenger','Premier tour"],
 ["2026-02-21','Luca Van Assche','D','6-1 6-1','Lille Challenger','Demi-finale"],
 ["2026-02-20','Nishesh Basavareddy','V','6-3 6-3','Lille Challenger','Quart de finale"],
 ["2026-02-19','Joel Schwärzler','V','6-3 6-4','Lille Challenger','Huitième de finale"],
 ["2026-02-17','Matej Dodig','V','6-4 6-2','Lille Challenger','Premier tour"],
 ["2026-02-10','Henri Squire','D','6-3 7-5','Pau Challenger','Premier tour"],
 ["2026-02-04','Aleksandar Kovacevic','D','6-7(5) 6-2 6-2','Montpellier ATP 250','Premier tour"],
 ["2026-02-02','Clément Chidekh','V','7-5 6-7(6) 6-3','Montpellier ATP 250 - qualifications','Qualification 2"],
 ["2026-02-01','Elias Ymer','V','6-4 4-6 7-5','Montpellier ATP 250 - qualifications','Qualification 1"],
 ["2026-01-18','Pierre-Yves Bailly','V','6-1 6-4','Bressuire ITF M15','Finale"],
 ["2026-01-17','Cannon Kingsley','V','6-2 6-4','Bressuire ITF M15','Demi-finale"],
 ["2026-01-16','Amaury Raynel','V','6-4 7-6(5)','Bressuire ITF M15','Quart de finale"],
 ["2026-01-15','Martin Sabas','V','5-7 6-3 6-4','Bressuire ITF M15','Huitième de finale"],
 ["2026-01-14','Arthur Nagel','V','6-1 6-3','Bressuire ITF M15','Premier tour"],
 ["2026-01-11','Théo Papamalamis','V','7-6(5) 6-1','Hazebrouck ITF M25','Finale"],
 ["2026-01-10','Lucas Poullain','V','6-3 6-2','Hazebrouck ITF M25','Demi-finale"],
 ["2026-01-09','Arthur Nagel','V','6-2 6-7(5) 7-6(5)','Hazebrouck ITF M25','Quart de finale"],
 ["2026-01-08','Yanis Ghazouani Durand','V','3-6 6-2 6-4','Hazebrouck ITF M25','Huitième de finale"],
 ["2026-01-07','Timo Legout','V','3-6 7-6(5) (abandon adverse)','Hazebrouck ITF M25','Premier tour"]
];
const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function sameName(a,b){
 const x=normalized(a),y=normalized(b);
 if(!x||!y)return false;
 if(x===y)return true;
 const p=x.split(' '),q=y.split(' ');
 return p.length>=2&&q.length>=2&&p.at(-1)===q.at(-1)&&p[0][0]===q[0][0];
}
// Un instantané volontairement limité, distinct des données mises à jour en ligne.
export function recentKouameSnapshot(favorites){
 const f=favorites.find(x=>sameName(x.name,'Moïse Kouamé')&&x.sport==='Tennis');
 if(!f)return [];
 return KOUAME_MATCHES.map(([date,opponent,verdict,score,tournament,round])=>({
   id:'kouame-manual-'+date+'-'+normalized(opponent),
   favorite:f.name,type:'tennis-history',date:date+'T12:00:00Z',
   title:verdict==='V'?f.name+' — '+opponent:opponent+' — '+f.name,
   score,competition:tournament,round,
   outcome:verdict==='V'?'Victoire':'Défaite',
   source:'Résultats vérifiés (relevé du 12 nov. 2026)',
   sourceUrl:TENNIS_LATEST_SOURCE,approxDate:false,
   snapshot:true
 }));
}
// Parseur CSV compatible guillemets, séparateurs et lignes de retour, sans librairie.
export function parseCsv(csv){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<csv.length;i++){
   const c=csv[i];
   if(c==='"'){
     if(quoted&&csv[i+1]==='"'){field+='"';i++;}
     else quoted=!quoted;
   } else if(c===','&&!quoted){row.push(field);field='';}
   else if((c==='\n'||c==='\r')&&!quoted){
     if(c==='\r'&&csv[i+1]==='\n')i++;
     row.push(field);if(row.some(Boolean))rows.push(row);
     row=[];field='';
   }else field+=c;
 }
 if(field.length||row.length){row.push(field);rows.push(row);}
 return rows;
}
const rounds={RR:'Poules',R128:'1er tour',R64:'2e tour',R32:'1/16',R16:'1/8',QF:'Quart de finale',SF:'Demi-finale',F:'Finale',Q1:'Qualification 1',Q2:'Qualification 2',Q3:'Qualification 3'};
function dateOfWeek(raw){
 const s=String(raw||'');
 if(!/^\d{8}$/.test(s))return null;
 return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8)+'T12:00:00Z';
}
export function extractArchive(csv,source,favorites){
 const lines=parseCsv(csv);
 if(lines.length<2)return [];
 const headers=lines.shift(),ix=k=>headers.indexOf(k);
 const needed=['winner_name','loser_name','tourney_date','tourney_name','score','round','tourney_id','match_num'];
 if(needed.some(k=>ix(k)<0))throw Error('En-tête CSV incomplet');
 const items=[];
 for(const cells of lines){
   const win=cells[ix('winner_name')],lose=cells[ix('loser_name')];
   const selected=favorites.filter(f=>f.type==='sportif'&&f.sport==='Tennis'&&
      (sameName(f.name,win)||sameName(f.name,lose)));
   if(!selected.length)continue;
   const week=dateOfWeek(cells[ix('tourney_date')]);
   if(!week)continue;
   for(const f of selected){
     const won=sameName(f.name,win);
     items.push({
       id:'archive-'+source+'-'+cells[ix('tourney_id')]+'-'+cells[ix('match_num')]+'-'+normalized(f.name),
       type:'tennis-history',favorite:f.name,
       date:week,title:win+' — '+lose,
       competition:cells[ix('tourney_name')],round:rounds[cells[ix('round')]]||cells[ix('round')]||'',
       score:cells[ix('score')]||'Score indisponible',outcome:won?'Victoire':'Défaite',
       source:'Archives Jeff Sackmann · '+source,sourceUrl:TENNIS_HISTORY_SOURCE,
       approxDate:true,snapshot:false
     });
   }
 }
 return items;
}
const uniqueMatches=list=>{
 const seen=new Set();
 return list.filter(m=>{
   const k=m.id;
   if(seen.has(k))return false;
   seen.add(k);
   return true;
 }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
};
export async function loadArchiveTennis(favorites,year=2026){
 if(![2025,2026].includes(year))throw Error('Année non prise en charge');
 const players=favorites.filter(f=>f.sport==='Tennis'&&f.type==='sportif');
 if(!players.length)return {events:[],notes:[]};
 const key=CACHE_PREFIX+year+':'+players.map(f=>normalized(f.name)).sort().join('|');
 try{
   const cached=JSON.parse(localStorage.getItem(key)||'null');
   if(cached&&Date.now()-cached.saved<24*3600*1000&&Array.isArray(cached.events))return cached;
 }catch{}
 const sources=filesForYear(year).filter(([,category])=>{
   const female=category.startsWith('WTA')||category.startsWith('ITF féminin');
   const hasWomen=players.some(p=>/andreeva|swiatek|sabalenka|gauff|rybakina|paolini|raducanu|osaka|pegula|jabeur|sakkari|kasatkina|badosa|fernandez|siegemund|krejcikova|samsonova|svitolina|vondrousova|mertens|mirra|wta/i.test(normalized(p.name)));
   // Inclure au moins les joueuses connues parmi les favoris; éviter un gros fichier WTA si inutile.
   return !female||hasWomen;
 });
 const results=await Promise.allSettled(sources.map(async ([filename,category])=>{
   const response=await fetch(MIRROR+filename,{signal:AbortSignal.timeout(25000),cache:'force-cache'});
   if(!response.ok)throw Error('HTTP '+response.status);
   return extractArchive(await response.text(),category,players);
 }));
 const events=uniqueMatches(results.flatMap(r=>r.status==='fulfilled'?r.value:[]));
 const fails=results.filter(r=>r.status==='rejected');
 const notes=[
   'Archive '+year+' : copie historique du 25 juin 2026. Les jours affichés sont les semaines de tournoi, pas forcément les dates exactes.',
   'Source : Jeff Sackmann (CC BY-NC-SA 4.0) via miroir public Aneeshers. Usage personnel non commercial.'
 ];
 if(fails.length)notes.push(fails.length+' fichier(s) historiques indisponible(s) : couverture incomplète.');
 const answer={events,notes,saved:Date.now()};
 if(events.length)try{localStorage.setItem(key,JSON.stringify(answer));}catch{}
 return answer;
}
export function historyIsCurrentAsOf(){return SNAPSHOT_DATE;}
