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
const plainName=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function storyParagraphs(html){
 return String(html||'').replace(/<(script|style|aside|figure|photo\d*|video\d*|inline\d*|alsosee)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<(?:br|\/p|\/h[1-6]|\/li)\b[^>]*>/gi,'\n').replace(/<[^>]+>/g,'')
  .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;|&rsquo;/g,'’').replace(/&mdash;/g,'—').replace(/&[a-z]+;/g,' ')
  .split(/\n+/).map(p=>p.replace(/\s+/g,' ').replace(/ +([,.)])/g,'$1').trim().replace(/^[A-Z .,']{3,40} -- (?:[—–-]\s*)?/,''))
  .filter(p=>p.length>40).slice(0,14);
}
export function recapArticleFromESPN(body,eventId=''){
 // Seul le compte rendu de CE match compte : les « news » d'une feuille ESPN
 // sont souvent des articles génériques de la ligue ou du tournoi.
 const sides=(body?.header?.competitions?.[0]?.competitors||[]).map(c=>[c.team?.displayName,c.team?.shortDisplayName,c.team?.name,c.team?.abbreviation,c.athlete?.displayName,c.athlete?.shortName].filter(Boolean).map(plainName));
 const mentionsBoth=text=>{const h=plainName(text);return sides.length>=2&&sides.every(names=>names.some(t=>t.length>=3&&h.includes(t)));};
 const own=a=>a&&((eventId&&String(a.gameId||'')===String(eventId))||mentionsBoth((a.headline||a.title||'')+' '+(a.description||'')));
 const candidates=[body?.article,...(body?.news?.articles||[])].filter(a=>a&&(a===body?.article?own(a):mentionsBoth(a.headline||a.title)));
 for(const a of candidates){
  const title=a.headline||a.title||'';
  const link=String(a.links?.web?.href||a.links?.mobile?.href||a.link||a.url||'').replace(/^http:\/\//,'https://');
  if(title&&/^https:\/\/(?:www\.)?espn\.(?:com|co\.uk)\//i.test(link)){
   const excerpt=String(a.description||a.summary||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().replace(/^[—–-]\s*/,'').slice(0,400);
   const image=(a.images||[]).map(i=>String(i?.url||'')).find(u=>/^https:\/\//.test(u))||'';
   return {title,link,excerpt,source:'ESPN',image,paragraphs:storyParagraphs(a.story)};
  }
 }
 return null;
}
// L'essentiel du match en français, construit uniquement à partir de la
// feuille ESPN : buteurs, statistiques clés, meilleurs marqueurs.
const stat=(team,...names)=>{for(const n of names){const s=(team?.statistics||[]).find(x=>x.name===n);if(s&&s.displayValue!==undefined&&s.displayValue!=='')return String(s.displayValue);}return null;};
export function keyFactsFromESPN(body,sport,favoriteAthlete=''){
 const facts=[];
 const competitors=body?.header?.competitions?.[0]?.competitors||[];
 const home=competitors.find(c=>c.homeAway==='home')||competitors[0],away=competitors.find(c=>c.homeAway==='away')||competitors[1];
 const teams=body?.boxscore?.teams||[];
 const boxOf=c=>teams.find(t=>String(t.team?.id)===String(c?.team?.id));
 if(sport==='football'){
  const byTeam=new Map();let reds=[];
  for(const k of body?.keyEvents||[]){
   const type=String(k.type?.text||''),who=k.participants?.[0]?.athlete?.displayName||'',minute=String(k.clock?.displayValue||'');
   if(/red card/i.test(type)&&who)reds.push(who+' '+minute+' ('+(k.team?.displayName||'')+')');
   if(!k.scoringPlay||!who)continue;
   const team=k.team?.displayName||'';
   const mark=minute+(/penalty/i.test(type)?' (pen.)':/own goal/i.test(type)?' (csc)':'');
   if(!byTeam.has(team))byTeam.set(team,new Map());
   const scorers=byTeam.get(team);scorers.set(who,[...(scorers.get(who)||[]),mark]);
  }
  for(const c of [home,away]){
   const name=c?.team?.displayName||'';const scorers=byTeam.get(name);
   if(scorers)facts.push({label:'Buts '+name,text:[...scorers].map(([who,marks])=>who+' '+marks.join(', ')).join(' · ')});
  }
  if(reds.length)facts.push({label:'Cartons rouges',text:reds.join(' · ')});
  const h=boxOf(home),a=boxOf(away);
  const pair=(label,...names)=>{const x=stat(h,...names),y=stat(a,...names);return x!==null&&y!==null?label+' '+x+' – '+y:null;};
  const poss=stat(h,'possessionPct'),poss2=stat(a,'possessionPct');
  const line=[poss!==null&&poss2!==null?'Possession '+Math.round(+poss)+' % – '+Math.round(+poss2)+' %':null,pair('Tirs','totalShots'),pair('cadrés','shotsOnTarget'),pair('Corners','wonCorners')].filter(Boolean);
  if(line.length)facts.push({label:'Statistiques',text:line.join(' · ')});
 }else if(sport==='basketball'){
  const rows=[];
  for(const group of body?.boxscore?.players||[]){
   const cat=group.statistics?.[0];if(!cat)continue;
   const labels=cat.labels||cat.names||[],idx=n=>labels.indexOf(n);
   for(const ath of cat.athletes||[]){
    if(!Array.isArray(ath.stats)||!ath.stats.length)continue;
    const v=n=>idx(n)>=0?ath.stats[idx(n)]:'';
    rows.push({team:String(group.team?.id||''),name:ath.athlete?.displayName||'',pts:+v('PTS')||0,reb:v('REB'),ast:v('AST'),blk:v('BLK'),stl:v('STL'),fg:v('FG'),min:v('MIN')});
   }
  }
  const wanted=plainName(favoriteAthlete).replace(/[^a-z]/g,'');
  const star=wanted?rows.find(r=>plainName(r.name).replace(/[^a-z]/g,'').includes(wanted)||wanted.includes(plainName(r.name).replace(/[^a-z]/g,''))):null;
  if(star)facts.push({label:star.name,text:[star.pts+' pts',star.reb+' reb',star.ast+' pd',star.blk+' ctr',star.stl+' int',star.fg?star.fg+' aux tirs':'',star.min?star.min+' min':''].filter(x=>x&&!/^ /.test(x)).join(' · ')});
  for(const c of [home,away]){
   const short=c?.team?.shortDisplayName||c?.team?.displayName||'';
   const best=rows.filter(r=>r.team===String(c?.team?.id||'')).sort((x,y)=>y.pts-x.pts).slice(0,3);
   if(best.length)facts.push({label:'Marqueurs '+short,text:best.map(r=>r.name+' '+r.pts).join(' · ')});
  }
  const quarters=[home,away].map(c=>(c?.linescores||[]).map(l=>l.displayValue??l.value));
  if(quarters[0].length>=4&&quarters[1].length===quarters[0].length)facts.push({label:'Par quart-temps',text:quarters[0].map((q,i)=>q+'-'+quarters[1][i]).join(' · ')});
 }
 const venue=body?.gameInfo?.venue;
 if(venue?.fullName)facts.push({label:'Lieu',text:venue.fullName+(venue.address?.city?' ('+venue.address.city+')':'')+(body.gameInfo.attendance?' · '+Number(body.gameInfo.attendance).toLocaleString('fr-FR')+' spectateurs':'')});
 return facts.slice(0,7);
}
// Résumés vidéo publiés par ESPN pour la rencontre (MP4 lisible dans la page).
export function videosFromESPN(body){
 const list=[...(Array.isArray(body?.videos)?body.videos:[]),...(Array.isArray(body?.highlights)?body.highlights:[])];
 const out=[];
 for(const v of list){
  const src=v?.links?.source?.HD?.href||v?.links?.source?.href||v?.links?.source?.full?.href||'';
  const page=v?.links?.web?.href||v?.links?.mobile?.href||'';
  if(!/^https:\/\//.test(src)&&!/^https:\/\//.test(page))continue;
  out.push({title:String(v.headline||v.title||'Résumé vidéo').slice(0,160),src:/^https:\/\/[^\s]+\.mp4(?:\?|$)/i.test(src)?src:'',
   page:/^https:\/\//.test(page)?page:'',poster:/^https:\/\//.test(v.thumbnail||'')?v.thumbnail:'',duration:+v.duration||0});
 }
 const score=v=>(v.src?2:0)+(/highlight|r[ée]sum[ée]|recap|extended/i.test(v.title)?3:0);
 return out.sort((a,b)=>score(b)-score(a)).slice(0,3);
}
export function hasEspnSheet(event){
 const origin=event.origin||{};
 const path=origin.leaguePath||origin.espnLeague||'';
 const id=origin.espnEventId||event.espnEventId;
 return /^((soccer|basketball|rugby|tennis)\/[a-zA-Z0-9_.]+)$/.test(path)&&/^[a-zA-Z0-9_-]{1,60}$/.test(String(id||''));
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
   ...data,article:recapArticleFromESPN(body,id),facts:keyFactsFromESPN(body,data.sport,athleteName),videos:videosFromESPN(body),teamStats:parseTeamData(body.boxscore,data.sport),
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
 // Tennis : score et tour sont déjà dans la carte.
 const extraList=info.sport==='tennis'?[]:(info.extra||[]);
 const extras=extraList.length?'<div class="detail-player"><div class="detail-metrics">'+extraList.map(m=>
   '<div class="detail-metric"><span>'+esc(m.label)+'</span><b>'+esc(m.value)+'</b></div>').join('')+'</div></div>':'';
 const scores=info.teamStats.length?'<div class="detail-teams">'+info.teamStats.map(team=>
  '<div class="detail-team"><h5>'+esc(team.name)+'</h5><div class="detail-metrics">'+team.metrics.map(s=>
  '<div class="detail-metric"><span>'+esc(s.label)+'</span><b>'+esc(s.value)+'</b></div>').join('')+'</div></div>').join('')+'</div>':'';
 const players=info.players.length?info.players.map(p=>'<div class="detail-player"><b>'+esc(p.name)+'</b><div class="detail-metrics">'+p.metrics.map(m=>
    '<div class="detail-metric"><span>'+esc(m.label)+'</span><b>'+esc(m.value)+'</b></div>').join('')+'</div></div>').join(''):'';
 const body=extras+scores+players;
 return body||'<p class="agenda-recap-note">Pas de statistiques détaillées pour cette rencontre.</p>';
}
