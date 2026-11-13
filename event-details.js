// Mon Sport V9 — données détaillées disponibles dans les résumés ESPN.
// Aucune statistique inventée : seule la donnée de la feuille est montrée.
// API publique non officielle et couverture variable selon les sports.
const BASE='https://site.api.espn.com/apis/site/v2/sports/';
const cache=new Map();
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
 football:[
  ['Tirs','shots','totalShots','totalShotsOnGoal','totalShotsAttempted'],
  ['Tirs cadrés','shotsOnTarget','shotsOnGoal','shotsOnGoalTotal'],
  ['Possession','possessionPct','possession','possessionPercentage'],
  ['Buts attendus (xG)','expectedGoals','xg'],
  ['Corners','cornerKicks','corners'],['Fautes','fouls','foulsCommitted'],
  ['Hors-jeu','offsides','offsidesCommitted'],['Cartons jaunes','yellowCards','totalYellowCard'],
  ['Cartons rouges','redCards','totalRedCard'],['Arrêts gardien','saves','goalkeeperSaves']
 ],
 basketball:[
  ['Points','points','totalPoints'],['Adresse tirs','fieldGoalPct','fieldGoalPercentage'],
  ['Adresse 3 pts','threePointFieldGoalPct','threePointPct'],
  ['Lancers francs','freeThrowPct','freeThrowPercentage'],['Rebonds','totalRebounds','rebounds'],
  ['Passes décisives','assists'],['Interceptions','steals'],['Contres','blocks'],
  ['Balles perdues','turnovers'],['Rebonds offensifs','offensiveRebounds']
 ],
 tennis:[
  ['Aces','aces'],['Doubles fautes','doubleFaults','doublefault'],
  ['Premières balles','firstServePct','firstServePercentage'],
  ['Points gagnés sur 1re','firstServePointsWonPct','firstServePointsWon'],
  ['Points gagnés sur 2e','secondServePointsWonPct','secondServePointsWon'],
  ['Balles de break sauvées','breakPointsSaved','breakPointsSavedPct'],
  ['Balles de break converties','breakPointsConverted','breakPointsWon','breakPointsConvertedPct'],
  ['Jeux de service gagnés','serviceGamesWon'],['Points totaux','totalPointsWon','totalPoints']
 ],
 rugby:[
  ['Essais','tries'],['Transformations','conversions'],['Pénalités','penalties','penaltyGoals'],
  ['Plaquages','tackles'],['Mètres gagnés','metresGained','metersGained'],
  ['Possession','possessionPct','possession'],['Touches gagnées','lineoutsWon','lineouts'],
  ['Mêlées gagnées','scrumsWon'],['Turnovers','turnovers']
 ]
};
function family(item){
 const path=String(item.origin?.leaguePath||item.leaguePath||'');
 if(path.startsWith('soccer/'))return 'football';
 if(path.startsWith('basketball/'))return 'basketball';
 if(path.startsWith('tennis/'))return 'tennis';
 if(path.startsWith('rugby/'))return 'rugby';
 if(item.type==='tennis'||/tennis/i.test(item.type||''))return 'tennis';
 if(item.type==='nba')return 'basketball';
 if(/ping|tennis de table/i.test(item.type||''))return 'ping';
 if(/swim|natation/i.test(item.type||''))return 'natation';
 if(/cycling|cyclisme/i.test(item.type||''))return 'cyclisme';
 return 'autre';
}
function valueOf(x){const v=x?.displayValue??x?.value??x?.stat??x;if(v===null||v===undefined||typeof v==='object')return '';return String(v).trim();}
function statsOf(team){
 const result=[];
 const list=Array.isArray(team?.statistics)?team.statistics:[];
 for(const s of list){
  if(!s||typeof s!=='object')continue;
  const key=s.name||s.abbreviation||s.label||s.key||s.type||s.displayName;
  if(key&&valueOf(s))result.push({key:String(key),value:valueOf(s)});
 }
 return result;
}
function pick(stats,candidates){
 for(const label of candidates){
  const key=norm(label);
  const value=stats.find(s=>norm(s.key)===key);
  if(value)return value.value;
 }
 return null;
}
function teamName(t){return t?.team?.displayName||t?.team?.name||t?.team?.shortDisplayName||t?.displayName||'';}
function parseTeamData(box,familyKey){
 const sets=aliases[familyKey]||[];
 return (box?.teams||[]).slice(0,2).map(entry=>{
  const available=statsOf(entry);
  const named=sets.map(([label,...names])=>({label,value:pick(available,names)}))
   .filter(x=>x.value!==null);
  return {name:teamName(entry),metrics:named};
 }).filter(x=>x.name&&x.metrics.length);
}
function parseScorers(body){
 const output=[],seen=new Set();
 const sources=[
  ...(Array.isArray(body?.scoringPlays)?body.scoringPlays:[]),
  ...(Array.isArray(body?.details)?body.details:[]),
  ...(Array.isArray(body?.header?.competitions?.[0]?.details)?body.header.competitions[0].details:[]),
  ...(Array.isArray(body?.keyEvents)?body.keyEvents:[])
 ];
 for(const play of sources){
  const type=String(play.type?.text||play.scoringType?.name||play.scoringType?.displayName||play.type?.name||'');
  const text=String(play.text||play.description||play.shortText||'').trim();
  if(!text)continue;
  const markedGoal=/goal|but|score|try|essai|touchdown|penalty|pénalty/i.test(type);
  if(!markedGoal&&!/(\d+['’]\s*goal|goal\s*\d+)/i.test(text))continue;
  if(seen.has(text))continue;
  seen.add(text);
  output.push({text:text.slice(0,230),clock:String(play.clock?.displayValue||play.clock?.displayValue||'')});
 }
 return output.slice(0,12);
}
function parsePlayerStats(box,kind,favorite,strict=false){
 const output=[];
 for(const group of box?.players||[]){
  for(const cat of group.statistics||[]){
   const labels=cat.labels||cat.names||[];
   for(const athlete of cat.athletes||[]){
    const name=athlete.athlete?.displayName||athlete.athlete?.fullName||'';
    if(!name||!Array.isArray(athlete.stats))continue;
    const values=athlete.stats.map((v,i)=>({key:labels[i]||String(i),value:String(v||'')}));
    const find=(...keys)=>pick(values,keys);
    let metrics=[];
    if(kind==='basketball'){
     metrics=[['Points',find('PTS')],['Rebonds',find('REB')],['Passes',find('AST')],
      ['Interceptions',find('STL')],['Contres',find('BLK')],['Adresse aux tirs',find('FG%','FG')],['Minutes',find('MIN')]];
    }else if(kind==='tennis'){
     metrics=(aliases.tennis||[]).map(([label,...names])=>[label,find(...names)]);
    }else if(kind==='football'){
     metrics=[['Buts',find('G','GLS','GOALS')],['Passes',find('AST','ASSISTS')],['Tirs',find('SH','SHOTS')],['Minutes',find('MIN')]];
    }
    metrics=metrics.filter(([,v])=>v!==null&&v!=='');
    if(metrics.length)output.push({name,metrics:metrics.map(([label,value])=>({label,value}))});
   }
  }
 }
 // Limiter aux joueurs suivis quand la source possède de nombreux joueurs.
 const wanted=norm(favorite);
 const selected=output.filter(p=>norm(p.name).includes(wanted)||wanted.includes(norm(p.name)));
 return (selected.length?selected:strict?[]:output).slice(0,kind==='basketball'?5:4);
}
// ESPN peut publier un article de match distinct de la simple boxscore.
export function recapArticleFromESPN(body){
 const candidates=[body?.article,...(body?.news?.articles||[]),...(body?.articles||[])].filter(Boolean);
 for(const a of candidates){
  const title=a.headline||a.title||'';
  const link=a.links?.web?.href||a.links?.mobile?.href||a.link||a.url||'';
  if(title&&/^https:\/\/(?:www\.)?espn\.(?:com|co\.uk)\//i.test(link)){
   const excerpt=String(a.description||a.summary||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
   return {title,link,excerpt,source:'ESPN'};
  }
 }
 // Les liens dédiés au match (recap) peuvent être présents sans article.
 const competition=body?.header?.competitions?.[0]||{};
 for(const l of competition.links||[]){
  const rel=String(l.rel?.join(' ')||l.text||'');
  const url=l.href||l.url||'';
  if(/recap|article|report|compte rendu/i.test(rel)&&/^https:\/\/(?:www\.)?espn\.(?:com|co\.uk)\//i.test(url))
   return {title:'Compte rendu du match (ESPN)',link:url,excerpt:'',source:'ESPN'};
 }
 return null;
}
function dataFromEvent(event){
 const original=event.origin||{};
 const sport=family(event);
 const embedded=original.stats&&typeof original.stats==='object'
  ?Object.entries(original.stats).filter(([,v])=>v!==null&&v!=='')
     .map(([key,value])=>({label:({pts:'Points',reb:'Rebonds',ast:'Passes',blk:'Contres',stl:'Interceptions',min:'Minutes'})[key]||key,value:String(value)}))
  :[];
 const extra=[];
 const put=(label,value)=>{if(value!==null&&value!==undefined&&String(value).trim())extra.push({label,value:String(value)});};
 if(sport==='natation'){
  put('Épreuve',original.opponent||event.title);
  put('Chrono',event.score);
  put('Compétition',event.competition);
  put('Performance',original.round||'');
 }else if(sport==='cyclisme'){
  put('Épreuve',event.title);
  put('Classement ou résultat',event.score);
  put('Course / étape',event.competition);
 }else if(sport==='ping'){
  put('Score de la rencontre',event.score);
  const raw=String(event.score||''),m=raw.match(/^(\d+)\s*[-–:]\s*(\d+)$/);
  if(m){put('Manches gagnées (dans cet ordre)',m[1]);put('Manches adverses',m[2]);}
 }else if(sport==='tennis'){
  put('Score en sets / jeux',event.score);
  put('Tour',event.round);
 }
 return {sport,teamStats:[],players:embedded.length?[{name:original.wembanyamaName||event.favorite,metrics:embedded}]:[],scorers:[],extra};
}
export async function loadEventDetails(event,{fetchFn=fetch}={}){
 const data=dataFromEvent(event);
 const origin=event.origin||{};
 const path=origin.leaguePath||origin.espnLeague||'';
 const id=origin.espnEventId||event.espnEventId;
 if(!/^((soccer|basketball|rugby|tennis)\/[a-zA-Z0-9_.]+)$/.test(path)||!/^[a-zA-Z0-9_-]{1,60}$/.test(String(id||''))){
  return {...data,note:'Aucune feuille de statistiques détaillées n’est associée à ce résultat dans les sources gratuites.'};
 }
 const cacheKey=path+':'+id;
 const cacheEntry=cache.get(cacheKey);
 if(cacheEntry&&Date.now()-cacheEntry.at<15*60*1000)return cacheEntry.value;
 let result;
 try{
  const url=BASE+path+'/summary?event='+encodeURIComponent(id);
  const r=await fetchFn(url,{signal:AbortSignal.timeout(12000),cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const body=await r.json();
  const athleteName=origin.wembanyamaName||
   (event.favorites||[]).find(name=>/wemban[yi]ama/i.test(name))||'';
  const parsed={
   ...data,article:recapArticleFromESPN(body),teamStats:parseTeamData(body.boxscore,data.sport),
   players:parsePlayerStats(body.boxscore,data.sport,athleteName||event.favorite,!!athleteName),
   scorers:parseScorers(body),
   note:'ESPN · statistiques de la feuille de match disponibles selon la compétition.',
   sourceUrl:'https://www.espn.com/'
  };
  if(!parsed.players.length&&data.players.length)parsed.players=data.players;
  if(!parsed.teamStats.length&&!parsed.players.length&&!parsed.scorers.length)
   parsed.note='ESPN ne publie pas de statistiques détaillées pour ce match. Seul son score est disponible.';
  result=parsed;
 }catch(e){result={...data,note:'Feuille détaillée indisponible : '+String(e.message||e)};}
 cache.set(cacheKey,{at:Date.now(),value:result});
 return result;
}
export function renderEventDetails(info,esc){
 const sportNames={football:'⚽ Football',basketball:'🏀 Basket',tennis:'🎾 Tennis',rugby:'🏉 Rugby',
  ping:'🏓 Tennis de table',natation:'🏊 Natation',cyclisme:'🚴 Cyclisme'};
 const title='<div class="detail-sport-heading">'+esc(sportNames[info.sport]||'📊 Compte rendu sportif')+'</div>';
 const extras=info.extra?.length?'<div class="detail-player"><h5>Indicateurs disponibles</h5><div class="detail-metrics">'+info.extra.map(m=>
   '<div class="detail-metric"><span>'+esc(m.label)+'</span><b>'+esc(m.value)+'</b></div>').join('')+'</div></div>':'';
 const scores=info.teamStats.length?'<div class="detail-teams">'+info.teamStats.map(team=>
  '<div class="detail-team"><h5>'+esc(team.name)+'</h5><div class="detail-metrics">'+team.metrics.map(s=>
  '<div class="detail-metric"><span>'+esc(s.label)+'</span><b>'+esc(s.value)+'</b></div>').join('')+'</div></div>').join('')+'</div>':'';
 const scorers=info.scorers.length?'<h5 class="detail-head">Buteurs et moments décisifs</h5><ul class="detail-plays">'
  +info.scorers.map(p=>'<li>'+esc(p.clock?p.clock+' · '+p.text:p.text)+'</li>').join('')+'</ul>':'';
 const players=info.players.length?'<h5 class="detail-head">Statistiques des sportifs</h5>'
  +info.players.map(p=>'<div class="detail-player"><b>'+esc(p.name)+'</b><div class="detail-metrics">'+p.metrics.map(m=>
    '<div class="detail-metric"><span>'+esc(m.label)+'</span><b>'+esc(m.value)+'</b></div>').join('')+'</div></div>').join(''):'';
 const article=info.article?.link?'<div class="event-editorial"><h5>📰 Article de match</h5>'
  +'<b>'+esc(info.article.title)+'</b>'
  +(info.article.excerpt?'<p>'+esc(info.article.excerpt)+'</p>':'')
  +'<a href="'+esc(info.article.link)+'" target="_blank" rel="noopener noreferrer">Lire le compte rendu ESPN ↗</a></div>':'';
 return title+article+extras+scores+scorers+players+'<p class="agenda-recap-note">'+esc(info.note||'Couverture partielle.')+'</p>';
}
