// Mon Sport V14 · Top 150 ESPN ATP/WTA, mouvement hebdomadaire et détails complets par équipe.
// Tennis / WTT : relevés datés du 9 novembre 2026, NON « live ».
// Football/NBA : accès direct aux tableaux ESPN, en cache pour 20 min.
const ESPN='https://site.api.espn.com/apis/v2/sports/';
export const RANKING_DATE='2026-11-09';
export const RANKINGS=[
 {id:'atp',title:'ATP',sport:'Tennis',url:'https://www.atptour.com/en/rankings/singles/live',source:'ESPN · classement ATP publié',mode:'tennis-espn',tour:'atp'},
 {id:'wta',title:'WTA',sport:'Tennis',url:'https://www.wtatennis.com/rankings/singles',source:'ESPN · classement WTA publié',mode:'tennis-espn',tour:'wta'},
 {id:'atprace',title:'Race ATP',sport:'Tennis',url:'https://www.atptour.com/en/rankings/singles-race-to-turin',source:'ATP · Race Turin',mode:'snapshot'},
 {id:'wtarace',title:'Race WTA',sport:'Tennis',url:'https://www.wtatennis.com/rankings/race-singles',source:'WTA · Race Finals',mode:'snapshot'},
 {id:'nextgen',title:'Next Gen',sport:'Tennis',url:'https://www.atptour.com/en/rankings/next-gen-race',source:'ATP · Next Gen',mode:'snapshot'},
 {id:'ligue1',title:'Ligue 1',sport:'Football',url:'https://www.espn.com/soccer/standings/_/league/fra.1',source:'ESPN',mode:'espn',path:'soccer/fra.1'},
 {id:'liga',title:'Liga',sport:'Football',url:'https://www.espn.com/soccer/standings/_/league/esp.1',source:'ESPN',mode:'espn',path:'soccer/esp.1'},
 {id:'ucl',title:'Ligue des champions',sport:'Football',url:'https://www.uefa.com/uefachampionsleague/standings/',source:'ESPN · UEFA',mode:'espn',path:'soccer/uefa.champions'},
 {id:'wtt',title:'WTT / ITTF',sport:'Tennis de table',url:'https://www.ittf.com/ittf-table-tennis-world-ranking/',source:'ITTF · semaine 46',mode:'snapshot'},
 {id:'nbaouest',title:'NBA Ouest',sport:'Basketball',url:'https://www.nba.com/standings',source:'ESPN · NBA',mode:'espn',path:'basketball/nba',west:true}
];
const fromTuple=(list)=>list.map(([name,rank,points])=>({name,rank,points:points==null?'':String(points)}));
const ATP=fromTuple([
 ['Alexander Zverev',1,9550],['Jannik Sinner',2,9450],['Carlos Alcaraz',3,7100],
 ['Ben Shelton',4,5170],['Daniil Medvedev',5,3820],['Flavio Cobolli',6,3680],
 ['Arthur Fils',7,3625],['Frances Tiafoe',8,3390],['Alex de Minaur',9,3370],['Taylor Fritz',10,3285]
]);
const ATPRACE=fromTuple([
 ['Alexander Zverev',1,9350],['Jannik Sinner',2,7950],['Carlos Alcaraz',3,6100],
 ['Ben Shelton',4,5170],['Daniil Medvedev',5,3820],['Flavio Cobolli',6,3670],
 ['Arthur Fils',7,3625],['Frances Tiafoe',8,3390],['Rafael Jódar',9,3234],['Alex de Minaur',10,3170]
]);
const NEXTGEN=fromTuple([
 ['Rafael Jódar',1,3234],['João Fonseca',2,1200],['Martin Landaluce',3,822],
 ['Moïse Kouamé',4,419],['Federico Cinà',5,415],['Rei Sakamoto',6,405],
 ['Darwin Blanch',7,380],['Jan Kumstat',8,341],['Joel Schwaerzler',9,334],
 ['Felix Balshaw',10,322],['Nicolai Budkov Kjaer',11,321]
]);
const WTA=fromTuple([
 ['Elena Rybakina',1,8099],['Aryna Sabalenka',2,6485],['Mirra Andreeva',3,6306],
 ['Coco Gauff',4,5763],['Jessica Pegula',5,5760],['Elina Svitolina',6,5121],
 ['Karolína Muchová',7,4665],['Linda Nosková',8,4343]
]);
const WTT=fromTuple([
 ['Sora Matsushima',1,7598],['Tomokazu Harimoto',2,6963],['Félix Lebrun',3,6859],
 ['Wang Chuqin',4,6297],['Lin Yun-Ju',5,5870],['Truls Möregårdh',6,5630],
 ['Hugo Calderano',7,4830],['Jang Woojin',8,4236],['Alexis Lebrun',9,3750],
 ['Lin Shidong',10,3686],['Flavien Coton',23,1864]
]);
export const SNAPSHOTS={atprace:ATPRACE,wtarace:WTA,nextgen:NEXTGEN,wtt:WTT};
const TENNIS_API='https://site.api.espn.com/apis/site/v2/sports/tennis/';
const cache=new Map();
// Le classement consulté peut être relu hors connexion, toujours accompagné de sa date.
function savedRanking(id){
 try{
  const v=JSON.parse(localStorage.getItem('monsport-ranking-v14-'+id)||'null');
  return v&&Array.isArray(v.rows)&&v.rows.length&&Number.isFinite(Date.parse(v.asOf))?v:null;
 }catch{return null;}
}
function storeRanking(id,value){
 try{localStorage.setItem('monsport-ranking-v14-'+id,JSON.stringify(value));}catch{}
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ');
const knownTeams={
 'FC Barcelone':['barcelona','barca','fc barcelona'],PSG:['psg','paris saint germain','paris sg'],
 'Real Madrid':['real madrid'],'San Antonio Spurs':['san antonio spurs','spurs']
};
export function matchRankingFavorite(name,favorites=[]){
 const key=norm(name);
 for(const f of favorites){
  const aliases=[norm(f.name),...(knownTeams[f.name]||[])];
  if(aliases.some(a=>a===key))return f.name;
 }
 return null;
}
export function rankingForFavorite(favorite){
 const name=typeof favorite==='string'?favorite:favorite?.name||'';
 const sport=typeof favorite==='string'?'':favorite?.sport||'';
 if(name==='Mirra Andreeva')return 'wta';
 if(['Rafael Jódar','Moïse Kouamé'].includes(name))return 'nextgen';
 if(sport==='Tennis'||['Arthur Fils','Jannik Sinner','Carlos Alcaraz'].includes(name))return 'atp';
 if(['Félix Lebrun','Alexis Lebrun','Flavien Coton'].includes(name)||sport==='Tennis de table')return 'wtt';
 if(name==='San Antonio Spurs'||name==='Victor Wembanyama')return 'nbaouest';
 if(name==='PSG')return 'ligue1';
 if(name==='FC Barcelone'||name==='Real Madrid'||name==='Kylian Mbappé')return 'liga';
 return null;
}
export function rankingsForFavorite(favorite){
 const name=typeof favorite==='string'?favorite:favorite?.name;
 if(name==='Mirra Andreeva')return ['wta','wtarace'];
 if(name==='Rafael Jódar'||name==='Moïse Kouamé')return ['atp','atprace','nextgen'];
 if(['Arthur Fils','Jannik Sinner','Carlos Alcaraz'].includes(name))return ['atp','atprace'];
 if(['Félix Lebrun','Alexis Lebrun','Flavien Coton'].includes(name))return ['wtt'];
 if(name==='PSG')return ['ligue1','ucl'];
 if(name==='FC Barcelone'||name==='Real Madrid')return ['liga','ucl'];
 if(name==='San Antonio Spurs'||name==='Victor Wembanyama')return ['nbaouest'];
 if(name==='Kylian Mbappé')return ['liga','ucl'];
 return [];
}
const displayStat=(list,keys)=>{
 for(const key of keys){
  const k=norm(key);
  const row=(list||[]).find(s=>[s.name,s.abbreviation,s.displayName,s.shortDisplayName,s.label].some(q=>norm(q)===k));
  const v=row?.displayValue??row?.value;
  if(v!==undefined&&v!==null)return String(v);
 }
 return '';
};
function extractGroups(node,out=[],seen=new Set(),parent=''){
 if(!node||typeof node!=='object')return out;
 if(seen.has(node))return out;seen.add(node);
 const name=node.name||node.displayName||node.abbreviation||parent;
 const standings=node.standings;
 const rows=Array.isArray(standings?.entries)?standings.entries:Array.isArray(node.entries)?node.entries:[];
 if(rows.length)out.push({name,rows});
 for(const child of [...(node.children||[]),...(node.groups||[])])extractGroups(child,out,seen,name);
 return out;
}
// ESPN classements hebdomadaires : 150 entrées dans les flux ATP/WTA.
export function parseESPNTennisRankings(body){
 const entries=(body?.rankings||[]).flatMap(group=>Array.isArray(group?.ranks)?group.ranks:[]);
 const used=new Set();
 return entries.map(row=>{
  const athlete=row.athlete||{},rank=Number(row.current),previous=Number(row.previous);
  const points=Number(row.points);
  const name=athlete.displayName||[athlete.firstName,athlete.lastName].filter(Boolean).join(' ');
  if(!name||!Number.isFinite(rank)||rank<1||rank>150||!Number.isFinite(points)||used.has(norm(name)))return null;
  used.add(norm(name));
  return {
   name,rank,points:String(points),previousRank:Number.isFinite(previous)&&previous>0?previous:null,
   movement:Number.isFinite(previous)&&previous>0?previous-rank:null,
   age:Number.isFinite(Number(athlete.age))&&athlete.age!=null?Number(athlete.age):null,
   country:String(athlete.citizenshipCountry||''),flag:String(athlete.flag||''),
   image:String(athlete.headshot||''),source:'ESPN · classement publié',
   officialPoints:points,livePoints:null,nextPoints:null,maxPoints:null,tournament:'',
   earnedPoints:null,droppingPoints:null
  };
 }).filter(Boolean).sort((a,b)=>a.rank-b.rank).slice(0,150);
}
export function parseESPNStandings(body,{west=false}={}){
 const groups=extractGroups(body);
 const picked=west?groups.filter(g=>/western|(?:^|\b)west(?:ern)?(?:\b|$)/i.test(String(g.name))):groups;
 if(west&&!picked.length)return [];
 const raw=(picked.length?picked:groups).flatMap(g=>g.rows);
 const used=new Set(),out=[];
 for(const item of raw){
  const team=item.team||item.athlete||{};
  const name=team.displayName||team.name||item.displayName||'';
  if(!name||used.has(norm(name)))continue;used.add(norm(name));
  const stats=item.stats||item.statistics||[];
  const rank=Number(displayStat(stats,['rank','playoffSeed','seed'])||item.rank||item.rankDisplayValue||'');
  // Ne jamais inventer un rang quand ESPN ne le fournit pas.
  const displayed=Number.isFinite(rank)&&rank>0?rank:null;
  const wins=displayStat(stats,['wins','W','win']),draws=displayStat(stats,['ties','draws','draw','D']),
  losses=displayStat(stats,['losses','L','loss']);
  const points=west?(wins&&losses?wins+' V · '+losses+' D':'')
   :displayStat(stats,['points','PTS','totalPoints']);
  const played=displayStat(stats,['gamesPlayed','GP','played','matchesPlayed','MP']);
  const goalsFor=displayStat(stats,['pointsFor','goalsFor','GF','goalsScored']);
  const goalsAgainst=displayStat(stats,['pointsAgainst','goalsAgainst','GA','goalsConceded']);
  const diff=displayStat(stats,['pointDifferential','goalDifference','goalDifferential','goalDiff','GD']);
  out.push({name,rank:displayed,points:points.trim(),played,diff,wins,draws,losses,goalsFor,goalsAgainst,
   detail:(west?[played?played+' MJ':'']:[
    played?played+' J':'',wins!==''?wins+' V':'',draws!==''?draws+' N':'',losses!==''?losses+' D':'',
    goalsFor!==''?'BP '+goalsFor:'',goalsAgainst!==''?'BC '+goalsAgainst:'',diff?'Diff. '+diff:''
   ]).filter(Boolean).join(' · '),
   source:'ESPN'});
 }
 return out.sort((a,b)=>(a.rank??Infinity)-(b.rank??Infinity));
}
export async function fetchRankings({fetchFn=fetch,force=false}={}){
 const result={};
 await Promise.all(RANKINGS.filter(x=>x.mode==='espn'||x.mode==='tennis-espn').map(async spec=>{
  const saved=cache.get(spec.id);
  if(!force&&saved&&Date.now()-saved.at<20*60000){result[spec.id]=saved.result;return;}
  try{
   const url=spec.mode==='tennis-espn'?TENNIS_API+spec.tour+'/rankings':ESPN+spec.path+'/standings';
   const res=await fetchFn(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!res.ok)throw Error('ESPN '+res.status);
   const body=await res.json();
   const data=spec.mode==='tennis-espn'?parseESPNTennisRankings(body):parseESPNStandings(body,{west:!!spec.west});
   if(!data.length)throw Error('Tableau vide');
   const value={rows:data,asOf:new Date().toISOString(),live:true,
    kind:spec.mode==='tennis-espn'?'published':'standings'};
   cache.set(spec.id,{result:value,at:Date.now()});storeRanking(spec.id,value);result[spec.id]=value;
  }catch(e){
   const saved=savedRanking(spec.id);
   result[spec.id]=saved?{...saved,live:false,stale:true,error:'Dernière copie enregistrée · mise à jour indisponible'}
    :{rows:[],error:'Classement indisponible depuis ESPN.',live:false};
  }
 }));
 return result;
}
export function rankingRows(id,live={}){
 const data=live?.[id];
 if(data?.rows?.length)return data.rows;
 return SNAPSHOTS[id]||[];
}
export function rankingEntry(id,name,live={}){
 return rankingRows(id,live).find(x=>norm(x.name)===norm(name)||
  (knownTeams[name]||[]).some(alias=>norm(x.name)===norm(alias)))||null;
}
export function renderRankingsView({selected='atp',live={},favorites=[],loading=false,esc,safeUrl}){
 const spec=RANKINGS.find(r=>r.id===selected)||RANKINGS[0];
 const rows=rankingRows(spec.id,live);
 const saved=live[spec.id];
 const asOf=saved?.asOf?new Date(saved.asOf).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
 const label=spec.mode==='snapshot'?'Relevé du 9 novembre 2026 · pas en direct'
  :saved?.stale?'Copie enregistrée le '+asOf+' · peut être périmée'
  :saved?.live?(spec.mode==='tennis-espn'?'Classement ATP/WTA ESPN consulté le '+asOf+' · pas un calcul live':'Classement ESPN consulté le '+asOf)
  :'Classement non disponible depuis la source';
 const nav='<div class="rank-tabs" role="group" aria-label="Types de classements">'+RANKINGS.map(r=>
  '<button type="button" data-rank-select="'+esc(r.id)+'" class="'+(r.id===spec.id?'selected':'')+'" aria-pressed="'+(r.id===spec.id?'true':'false')+'">'+esc(r.title)+'</button>').join('')+'</div>';
 const cards=rows.map(r=>{
  const fav=matchRankingFavorite(r.name,favorites);
  const clickable=!!fav;
  const attrs=clickable?' data-rank-favorite="'+esc(fav)+'" title="Ouvrir '+esc(fav)+' dans Un favori"':'';
  const name=clickable?'<button type="button" class="rank-favorite-link"'+attrs+'>'+esc(r.name)+' <span aria-hidden="true">↗</span></button>':'<span>'+esc(r.name)+'</span>';
  const number=r.rank!==null&&r.rank!==undefined&&Number.isFinite(Number(r.rank))?String(r.rank):'—';
  const movement=typeof r.movement==='number'
   ?'<span class="rank-movement '+(r.movement>0?'up':r.movement<0?'down':'flat')+'" aria-label="'+
    esc(r.movement>0?r.movement+' places gagnées':r.movement<0?Math.abs(r.movement)+' places perdues':'Classement stable')+'">'+
    (r.movement>0?'▲ '+r.movement:r.movement<0?'▼ '+Math.abs(r.movement):'▬')+'</span>':'';
  const isTennis=spec.mode==='tennis-espn';
  const tennisDetail=isTennis?'<span class="rank-extras">'
   +(r.country?'<span>'+esc(r.country)+'</span>':'')
   +(r.age!=null?'<span>'+esc(r.age)+' ans</span>':'')
   +(r.previousRank?'<span>Rang préc. : '+esc(r.previousRank)+'</span>':'')
   +'</span>':'';
  const liveDetail=isTennis?'<details class="rank-live-details"><summary>Détails des points et du tournoi</summary>'
   +'<div>Points officiels : <b>'+esc(r.points)+'</b></div>'
   +'<div>Points live : <b>'+(r.livePoints??'Non disponible')+'</b></div>'
   +'<div>Points gagnés cette semaine : <b>'+(r.earnedPoints??'Non disponible')+'</b></div>'
   +'<div>Points à défendre : <b>'+(r.droppingPoints??'Non disponible')+'</b></div>'
   +'<div>Tournoi en cours : <b>'+esc(r.tournament||'Non communiqué')+'</b></div>'
   +'<div>Points après prochaine victoire : <b>'+(r.nextPoints??'Non disponible')+'</b></div>'
   +'<div>Maximum possible : <b>'+(r.maxPoints??'Non disponible')+'</b></div>'
   +'<p>Les projections de tournoi nécessitent un flux ATP live distinct : aucune valeur n’est estimée.</p></details>':'';
  return '<div class="rank-row '+(clickable?'rank-tracked':'')+'"><span class="rank-place">'+esc(number)+'</span>'
   +'<span class="rank-person">'+name+movement+(r.detail?'<small>'+esc(r.detail)+'</small>':'')+tennisDetail+liveDetail+'</span>'
   +'<b class="rank-points">'+esc(r.points||'—')+'</b></div>';
 }).join('');
 const tracked=spec.mode==='snapshot'?favorites.map(f=>({name:f.name,entry:rankingEntry(spec.id,f.name)}))
  .filter(x=>x.entry&&!rows.some(r=>norm(r.name)===norm(x.name))):[];
 return '<section class="rankings-shell"><div class="rankings-heading"><h2>🏆 Classements</h2>'
  +'<p>Ouvre la fiche d’un favori par son nom. Déplie un joueur pour connaître les points vérifiables et les données live disponibles.</p></div>'
  +nav+'<div class="rankings-source"><span>'+esc(label)+'</span>'
  +'<a href="'+esc(safeUrl(spec.url))+'" target="_blank" rel="noopener noreferrer">Voir le classement complet ↗</a></div>'
  +(loading?'<p class="agenda-progress">Actualisation des classements…</p>':'')
  +(cards?'<div class="rank-table"><div class="rank-table-head"><span>#</span><span>Club / joueur</span><span>'+esc(spec.west?'Bilan':'Points')+'</span></div>'+cards+'</div>'
  :'<div class="agenda-empty"><h3>Source non accessible</h3><p>Consulte le tableau officiel avec le lien ci-dessus. Aucun rang fictif n’est affiché.</p></div>')
  +'<p class="agenda-footnote">ATP et WTA : top 150 du dernier classement publié reçu depuis ESPN, avec points et évolution hebdomadaire (pas un rang live). Les colonnes ATP tournoi/points projetés restent indisponibles sans source live vérifiable. Race/Next Gen/WTT : relevés datés et non exhaustifs. Football : J, V, N, D, BP, BC selon les données transmises par ESPN.</p></section>';
}
