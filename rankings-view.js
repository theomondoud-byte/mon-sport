// Mon Sport V13 · Classements officiels/sources et liens croisés vers les favoris.
// Tennis / WTT : relevés datés du 9 novembre 2026, NON « live ».
// Football/NBA : accès direct aux tableaux ESPN, en cache pour 20 min.
const ESPN='https://site.api.espn.com/apis/v2/sports/';
export const RANKING_DATE='2026-11-09';
export const RANKINGS=[
 {id:'atp',title:'ATP',sport:'Tennis',url:'https://www.atptour.com/en/rankings/singles',source:'TennisDB · ATP',mode:'snapshot'},
 {id:'wta',title:'WTA',sport:'Tennis',url:'https://www.wtatennis.com/rankings/singles',source:'WTA',mode:'snapshot'},
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
export const SNAPSHOTS={atp:ATP,wta:WTA,atprace:ATPRACE,wtarace:WTA,nextgen:NEXTGEN,wtt:WTT};
const cache=new Map();
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
  const displayed=Number.isFinite(rank)&&rank>0?rank:out.length+1;
  const points=west?displayStat(stats,['wins','W'])+' V · '+displayStat(stats,['losses','L'])+' D'
   :displayStat(stats,['points','PTS','totalPoints']);
  const played=displayStat(stats,['gamesPlayed','GP','played']);
  const wins=displayStat(stats,['wins','W','win']);
  const draws=displayStat(stats,['ties','draws','D','draw']);
  const losses=displayStat(stats,['losses','L','loss']);
  const goalsFor=displayStat(stats,['pointsFor','goalsFor','goals','GF']);
  const goalsAgainst=displayStat(stats,['pointsAgainst','goalsAgainst','GA']);
  const diff=displayStat(stats,['pointDifferential','goalDifference','goalDifferential','goalDiff','GD']);
  out.push({name,rank:displayed,points:points.trim(),played,wins,draws,losses,goalsFor,goalsAgainst,diff,
   detail:[played?played+' matchs':'',diff?'Diff. '+diff:''].filter(Boolean).join(' · '),
   source:'ESPN'});
 }
 return out.sort((a,b)=>a.rank-b.rank);
}
export async function fetchRankings({fetchFn=fetch,force=false}={}){
 const result={};
 await Promise.all(RANKINGS.filter(x=>x.mode==='espn').map(async spec=>{
  const saved=cache.get(spec.id);
  if(!force&&saved&&Date.now()-saved.at<20*60000){result[spec.id]=saved.result;return;}
  try{
   const res=await fetchFn(ESPN+spec.path+'/standings',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!res.ok)throw Error('ESPN '+res.status);
   const data=parseESPNStandings(await res.json(),{west:!!spec.west});
   if(!data.length)throw Error('Tableau vide');
   const value={rows:data,asOf:new Date().toISOString(),live:true};
   cache.set(spec.id,{result:value,at:Date.now()});result[spec.id]=value;
  }catch(e){result[spec.id]={rows:[],error:'Classement indisponible depuis ESPN.',live:false};}
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
 const label=spec.mode==='snapshot'?'Relevé du 9 novembre 2026 · pas en direct'
  :live[spec.id]?.live?'Classement ESPN consulté récemment':'Classement non disponible en direct';
 const nav='<div class="rank-tabs" role="group" aria-label="Types de classements">'+RANKINGS.map(r=>
  '<button type="button" data-rank-select="'+esc(r.id)+'" class="'+(r.id===spec.id?'selected':'')+'" aria-pressed="'+(r.id===spec.id?'true':'false')+'">'+esc(r.title)+'</button>').join('')+'</div>';
 const cards=rows.map(r=>{
  const fav=matchRankingFavorite(r.name,favorites);
  const clickable=!!fav;
  const attrs=clickable?' data-rank-favorite="'+esc(fav)+'" title="Ouvrir '+esc(fav)+' dans Un favori"':'';
  const name=clickable?'<button type="button" class="rank-favorite-link"'+attrs+'>'+esc(r.name)+' <span aria-hidden="true">↗</span></button>':'<span>'+esc(r.name)+'</span>';
  const number=Number.isFinite(Number(r.rank))?String(r.rank):'—';
  const football=spec.sport==='Football';
  const extra=football?'<span class="rank-football-stats" aria-label="Bilan"><span>MJ '+esc(r.played||'—')+'</span><span>V '+esc(r.wins||'—')+'</span><span>N '+esc(r.draws||'—')+'</span><span>D '+esc(r.losses||'—')+'</span><span>BP '+esc(r.goalsFor||'—')+'</span><span>BC '+esc(r.goalsAgainst||'—')+'</span><span>Diff '+esc(r.diff||'—')+'</span></span>':'';
  return '<div class="rank-row '+(clickable?'rank-tracked':'')+'"><span class="rank-place">'+esc(number)+'</span>'
   +'<span class="rank-person">'+name+(football?extra:(r.detail?'<small>'+esc(r.detail)+'</small>':''))+'</span>'
   +'<b class="rank-points">'+esc(r.points||'—')+'</b></div>';
 }).join('');
 const tracked=spec.mode==='snapshot'?favorites.map(f=>({name:f.name,entry:rankingEntry(spec.id,f.name)}))
  .filter(x=>x.entry&&!rows.some(r=>norm(r.name)===norm(x.name))):[];
 return '<section class="rankings-shell"><div class="rankings-heading"><h2>🏆 Classements</h2>'
  +'<p>Ouvre directement la fiche d’un de tes favoris en touchant son nom.</p></div>'
  +nav+'<div class="rankings-source"><span>'+esc(label)+'</span>'
  +'<a href="'+esc(safeUrl(spec.url))+'" target="_blank" rel="noopener noreferrer">Voir le classement complet ↗</a></div>'
  +(loading?'<p class="agenda-progress">Actualisation des classements…</p>':'')
  +(cards?'<div class="rank-table"><div class="rank-table-head"><span>#</span><span>Club / joueur</span><span>'+esc(spec.west?'Bilan':'Points')+'</span></div>'+cards+'</div>'
  :'<div class="agenda-empty"><h3>Source non accessible</h3><p>Consulte le tableau officiel avec le lien ci-dessus. Aucun rang fictif n’est affiché.</p></div>')
  +'<p class="agenda-footnote">'+(spec.sport==='Tennis'?'Top 150 : les relevés locaux ne contiennent pas encore 150 joueurs. Le lien officiel donne accès au classement complet. Les points live, points à défendre et projections ne sont pas fournis par cette source et ne sont pas inventés.':'')+'</p>'
  +'<p class="agenda-footnote">Les tableaux ATP/WTA/Race/Next Gen/WTT sont des relevés datés, directement issus des publications citées. Les ligues et la NBA sont chargées depuis ESPN quand le réseau le permet.</p></section>';
}
