// Mon Sport V5 — Archives gratuites ATP, Challenger, ITF et WTA.
// Source : Jeff Sackmann, miroir Aneeshers/tennis-sackmann-archive.
// Licence des DONNÉES : CC BY-NC-SA 4.0 (usage personnel et non commercial).
// Le miroir a été mis à jour le 25 juin 2026 : il ne donne PAS les derniers matchs.
export const TENNIS_HISTORY_SOURCE =
  'https://github.com/Aneeshers/tennis-sackmann-archive';
export const TENNIS_LATEST_SOURCE =
  'https://www.tennisexplorer.com/player/kouame-d4969/';
const MIRROR='https://raw.githubusercontent.com/Aneeshers/tennis-sackmann-archive/main/';
const CSV_FILES=[
 ['atp/atp_matches_2026.csv','ATP'],
 ['atp/atp_matches_qual_chall_2026.csv','ATP / Challenger / qualifications'],
 ['atp/atp_matches_futures_2026.csv','ITF masculin'],
 ['wta/wta_matches_2026.csv','WTA'],
 ['wta/wta_matches_qual_itf_2026.csv','ITF féminin / qualifications']
];
const CACHE_PREFIX='mon-sport-history-v5:';
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
 ['2026-10-19','Lorenzo Sonego','V','7-6(2) 6-4','Lyon ATP 250','Premier tour']
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
export async function loadArchiveTennis(favorites){
 const players=favorites.filter(f=>f.sport==='Tennis'&&f.type==='sportif');
 if(!players.length)return {events:[],notes:[]};
 const key=CACHE_PREFIX+players.map(f=>normalized(f.name)).sort().join('|');
 try{
   const cached=JSON.parse(localStorage.getItem(key)||'null');
   if(cached&&Date.now()-cached.saved<24*3600*1000&&Array.isArray(cached.events))return cached;
 }catch{}
 const sources=CSV_FILES.filter(([,category])=>{
   const female=category.startsWith('WTA')||category.startsWith('ITF féminin');
   const hasWomen=players.some(p=>normalized(p.name).includes('andreeva'));
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
   'Archive historique : copie datée du 25 juin 2026. Les jours affichés pour ces matchs sont les semaines de tournoi, pas les dates exactes.',
   'Source : Jeff Sackmann (CC BY-NC-SA 4.0) via miroir public Aneeshers. Usage personnel non commercial.'
 ];
 if(fails.length)notes.push(fails.length+' fichier(s) historiques indisponible(s) : couverture incomplète.');
 const answer={events,notes,saved:Date.now()};
 if(events.length)try{localStorage.setItem(key,JSON.stringify(answer));}catch{}
 return answer;
}
export function historyIsCurrentAsOf(){return SNAPSHOT_DATE;}
