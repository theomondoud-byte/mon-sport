import {recentKouameSnapshot,recentSinnerSnapshot,tennisSnapshot2026,loadArchiveTennis,TENNIS_HISTORY_SOURCE,TENNIS_LATEST_SOURCE,SINNER_MATCH_SOURCE} from './tennis-history.js?v=16.8.0';
import {createOnceLoader} from './session-loader.js?v=16.8.0';
import {makeAgenda,mergeSpursAndWembanyama} from './agenda-model.js?v=16.8.0';
import {renderAgendaView} from './agenda-ui.js?v=16.8.0';
import {RANKINGS,renderRankingsView,fetchRankings,rankingForFavorite} from './rankings-view.js?v=16.8.0';
import {fetchFFLNews,fetchJeuSetMathsNews,readAvailableJeuSetMathsNews,findMatchArticles} from './sports-articles.js?v=16.8.0';
import {fetchAgendaFavorite} from './agenda-fetch.js?v=16.8.0';
import {loadFavoritePhotos,clearPhotoCache,photoInitials} from './photos.js?v=16.8.0';
import {extraProgramFor} from './verified-program.js?v=16.8.0';
import {verifiedExtraFor} from './verified-extra-v11.js?v=16.8.0';
import {coverageFor} from './coverage-v11.js?v=16.8.0';
import {renderNewsView,newsLastWeek,fetchSportsNews,renderArticleBody,renderBlocks,matchSummaryArticle} from './news-view.js?v=16.8.0';
import {loadEventDetails,renderEventDetails,hasEspnSheet} from './event-details.js?v=16.8.0';
import {verified2026For} from './audit-2026.js?v=16.8.0';
import {renderAudit2026} from './audit-ui.js?v=16.8.0';
import {auditEspn2026} from './audit-espn-2026.js?v=16.8.0';
import {APP_LABEL} from './version.js?v=16.8.0';
const DEFAULTS = [
 ['Real Madrid','Football','équipe','Real Madrid'],['FC Barcelone','Football','équipe','FC Barcelona'],['PSG','Football','équipe','Paris Saint Germain'],['San Antonio Spurs','Basketball','équipe','San Antonio Spurs'],
 ['Victor Wembanyama','Basketball','sportif'],['Léon Marchand','Natation','sportif'],['Sauveur Cristofini','Natation','sportif'],['Félix Lebrun','Tennis de table','sportif'],['Alexis Lebrun','Tennis de table','sportif'],['Flavien Coton','Tennis de table','sportif'],['Paul Seixas','Cyclisme','sportif'],['Kylian Mbappé','Football','sportif'],['Équipe de France de football','Football','équipe','France'],['XV de France','Rugby','équipe','France Rugby'],['Arthur Fils','Tennis','sportif'],['Jannik Sinner','Tennis','sportif'],['Carlos Alcaraz','Tennis','sportif'],['Rafael Jódar','Tennis','sportif'],['Moïse Kouamé','Tennis','sportif'],['Mirra Andreeva','Tennis','sportif']
].map(([name,sport,type,apiName])=>({id:crypto.randomUUID(),name,sport,type,apiName:apiName||name}));
const KEY='monsport-favorites-v1', URL_KEY='monsport-worker-url-v1';
const ADDED_V11=['FC Barcelone','Sauveur Cristofini'];
const MIGRATION_V11='monsport-added-v11';
const load=()=>{
 try{
  const saved=JSON.parse(localStorage.getItem(KEY));
  if(!Array.isArray(saved)){localStorage.setItem(MIGRATION_V11,'1');return DEFAULTS;}
  const valid=saved.filter(f=>f&&typeof f.name==='string'&&f.name.trim()&&typeof f.sport==='string'&&['équipe','sportif'].includes(f.type)).slice(0,200).map(f=>({id:typeof f.id==='string'&&f.id?f.id:crypto.randomUUID(),name:f.name.slice(0,100),sport:f.sport.slice(0,50),type:f.type,apiName:String(f.apiName||f.name).slice(0,100)}));
  if(localStorage.getItem(MIGRATION_V11)==='1')return valid.length?valid:DEFAULTS;
  const result=[...valid];
  for(const name of ADDED_V11){
   if(!result.some(f=>f.name===name)){
    const item=DEFAULTS.find(f=>f.name===name);
    if(item)result.push(item);
   }
  }
  localStorage.setItem(KEY,JSON.stringify(result));
  localStorage.setItem(MIGRATION_V11,'1');
  return result;
 }catch{return DEFAULTS;}
};
let favorites=load(), workerUrl=(()=>{try{return localStorage.getItem(URL_KEY)||''}catch{return ''}})(),active='semaine',sportFilter='Tous',search='',loading=false,news=[],matches=[],individualResults=[],individualNotes=[],errors=[],scoreNotes=[],historyResults=tennisSnapshot2026(favorites),historyNotes=[],historyLoading=false,historyFilter=favorites.some(f=>f.name==='Moïse Kouamé')?'Moïse Kouamé':'Tous',historyAll=false,historyYear='2026',historyRequest=0,auditSelected='Moïse Kouamé',yearAudit=null,yearLoading=false,yearMessage='',weekPhase='past',favoritePhase='past',agendaFavorite=favorites.some(f=>f.name==='Moïse Kouamé')?'Moïse Kouamé':favorites[0]?.name||'',agendaExtended=[],agendaExtendedFor='',agendaExtendedPhase='',agendaExtendedLoading=false,agendaExtendedMessage='',agendaRequest=0,agendaCache=new Map(),photoMap={},photoRequest=0,rankingSelected='atp',rankingsData={},rankingsLoading=false,rankAgeMax='',rankCountry='',newsSelectedSources=[],newsShowAll=false,eventMedia=new Map();
let jeuSetMathsPosts=readAvailableJeuSetMathsNews(),jeuSetMathsPending=null;
let starting=true;
// Dernières données affichées, réutilisées à l'ouverture suivante pour un affichage immédiat.
const SNAPSHOT_KEY='monsport-snapshot-v1',SNAPSHOT_MAX_AGE=3*86400000;
let lastUpdated=0,pendingRender=false;
function readSnapshot(){
 try{
  const data=JSON.parse(localStorage.getItem(SNAPSHOT_KEY));
  if(!data||!Number.isFinite(data.saved)||Date.now()-data.saved>SNAPSHOT_MAX_AGE)return null;
  if(![data.matches,data.individualResults,data.news].every(Array.isArray))return null;
  return data;
 }catch{return null;}
}
function writeSnapshot(){
 try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify({saved:lastUpdated,matches,individualResults,news,scoreNotes,individualNotes}));}catch{}
}
const snapshot=readSnapshot();
if(snapshot){
 ({matches,individualResults,news}=snapshot);
 scoreNotes=Array.isArray(snapshot.scoreNotes)?snapshot.scoreNotes:[];
 individualNotes=Array.isArray(snapshot.individualNotes)?snapshot.individualNotes:[];
 lastUpdated=snapshot.saved;
 starting=false;
}
function ago(time){
 const minutes=Math.round((Date.now()-time)/60000);
 if(minutes<1)return 'à l’instant';
 if(minutes<60)return 'il y a '+minutes+' min';
 const hours=Math.round(minutes/60);
 return hours<24?'il y a '+hours+' h':'il y a '+Math.round(hours/24)+' j';
}
// Rafraîchissement en arrière-plan : jamais pendant une saisie, pour ne pas effacer le champ.
function softRender(){
 if(starting)return;
 const focused=document.activeElement;
 if(focused&&focused.closest?.('#content')&&/^(INPUT|SELECT|TEXTAREA)$/.test(focused.tagName)){pendingRender=true;return;}
 pendingRender=false;render();
}
document.addEventListener('focusout',()=>{if(pendingRender)setTimeout(()=>{if(pendingRender)softRender();},0);});
const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(favorites));return true;}catch{alert('Stockage local indisponible : les changements de favoris ne seront pas conservés.');return false;}};
const date=s=>{if(!s)return '';const d=new Date(s);return Number.isNaN(d.valueOf())?s:d.toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})};
const filtered=()=>favorites.filter(f=>(sportFilter==='Tous'||f.sport===sportFilter)&&f.name.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
const tabs=[['semaine','📅 Résultats'],['favori','👤 Favoris'],['classements','🏆 Classements'],['actualites','📰 Articles'],['favoris','⭐ Gérer mes suivis'],['parametres','⚙️ Réglages']];
function resultHtml(){
 if(loading&&!matches.length)return '<p class="muted">Récupération des résultats…</p>';
 const notes=scoreNotes.length?`<div class="notice"><strong>Couverture des résultats :</strong><br>${scoreNotes.map(esc).join('<br>')}</div>`:'';
 const cards=matches.length?matches.map(m=>`<div class="card"><div class="row"><span class="tag">${esc(m.favorite)}</span><small>${esc(m.status)}</small></div><h3>${esc(m.home)} — ${esc(m.away)}</h3><div class="row"><span class="score">${m.homeScore!==null&&m.awayScore!==null?esc(m.homeScore)+' – '+esc(m.awayScore):'Match à venir'}</span><small>${esc(date(m.date))}</small></div><small>Source : ${esc(m.source||'TheSportsDB')} · couverture partielle</small></div>`).join(''):'<p class="muted">Aucun événement récupéré actuellement. Vérifie les indications de couverture ci-dessous.</p>';
 return `${errors.length?`<div class="notice">${esc(errors.join(' • '))}</div>`:''}${cards}${notes}`;
}
// ESPN : accès public non officiel, sans clé. Le paramètre dates=YYYYMMDD-YYYYMMDD
// renvoie HTTP 400 depuis septembre 2026 ; on utilise dates=YYYYMM (un mois).
// Pour chaque mois indisponible, repli sur un petit groupe de jours individuels.
const ESPN_LEAGUES=[
 {url:'soccer/esp.1',name:'LaLiga',teams:[['Real Madrid',/\breal madrid\b/i],['FC Barcelone',/\b(fc barcelona|barcelona)\b/i]]},
 {url:'soccer/fra.1',name:'Ligue 1',teams:[['PSG',/\b(paris saint[ -]?germain|paris sg|psg)\b/i]]},
 {url:'basketball/nba',name:'NBA',teams:[['San Antonio Spurs',/\bsan antonio spurs\b/i]]},
 {url:'soccer/uefa.champions',name:'Ligue des champions',optional:true,teams:[['Real Madrid',/\breal madrid\b/i],['FC Barcelone',/\b(fc barcelona|barcelona)\b/i],['PSG',/\b(paris saint[ -]?germain|paris sg|psg)\b/i]]},
 {url:'soccer/esp.copa_del_rey',name:'Coupe du Roi',optional:true,teams:[['Real Madrid',/\breal madrid\b/i],['FC Barcelone',/\b(fc barcelona|barcelona)\b/i]]},
 {url:'soccer/fra.coupe_de_france',name:'Coupe de France',optional:true,teams:[['PSG',/\b(paris saint[ -]?germain|paris sg|psg)\b/i]]},
 {url:'soccer/fifa.friendly',name:'Amicaux internationaux',optional:true,teams:[['Équipe de France de football',/^france$/i]]},
 {url:'soccer/fifa.world',name:'Coupe du monde',optional:true,teams:[['Équipe de France de football',/^france$/i]]},
 {url:'soccer/uefa.nations',name:'Ligue des nations',optional:true,teams:[['Équipe de France de football',/^france$/i]]},
 {url:'rugby/180659',name:'Tournoi des Six Nations',optional:true,teams:[['XV de France',/^france$/i]]}
];
const ESPN_BASE='https://site.api.espn.com/apis/site/v2/sports/';
const DAY_MS=86400000;
const monthKey=d=>d.toISOString().slice(0,7).replace('-','');
const dayKey=d=>d.toISOString().slice(0,10).replaceAll('-','');
const espnName=c=>c?.team?.displayName||c?.team?.name||'';
function espnScore(c){
 const v=c?.score;
 const n=typeof v==='object'&&v!==null?(v.displayValue??v.value):v;
 return n===undefined||n===null||n===''?null:String(n);
}
function monthsInRange(start,end){
 const result=[];
 for(let d=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1));d<=end;d.setUTCMonth(d.getUTCMonth()+1))result.push(monthKey(d));
 return result;
}
async function espnFetch(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('HTTP '+response.status);
 const body=await response.json();
 if(!Array.isArray(body.events))throw Error('Réponse inattendue (events absent)');
 return body.events;
}
async function espnMonth(url,month){
 // Certains sports rejettent le paramètre limit. Réessayer sans ce paramètre.
 try{return await espnFetch(url+'?dates='+month+'&limit=500');}
 catch(e){if(String(e.message).includes('HTTP 400'))return espnFetch(url+'?dates='+month);throw e;}
}
async function espnDailyFallback(url,start,end){
 // Repli borné pour éviter des dizaines de requêtes à chaque ouverture.
 // 7 derniers jours + 7 prochains, en plus du jour courant.
 const today=new Date(),days=[];
 for(let offset=-7;offset<=7;offset++){
  const d=new Date(today.getTime()+offset*DAY_MS);
  if(d>=start&&d<=end)days.push(dayKey(d));
 }
 const settled=await Promise.allSettled(days.map(d=>espnFetch(url+'?dates='+d)));
 const events=settled.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 return {events,failed:!events.length&&settled.some(r=>r.status==='rejected')};
}
async function espnResults(){
 const result=[],notes=[],now=new Date();
 const start=new Date(now.getTime()-21*DAY_MS),end=new Date(now.getTime()+21*DAY_MS);
 const from=start.getTime(),to=end.getTime();
 const months=monthsInRange(start,end);
 const targets=ESPN_LEAGUES.filter(l=>l.teams.some(([name])=>favorites.some(f=>f.name===name)));
 await Promise.all(targets.map(async league=>{
  const url=ESPN_BASE+league.url+'/scoreboard',found=[],issues=[];
  for(const month of months){
   try{found.push(...await espnMonth(url,month));}
   catch(e){
    issues.push(month+' : '+String(e.message||e));
    // Ne pas interroger 15 jours × 3 ligues quand une URL est en panne.
    // Ce repli ne tente qu'une fenêtre courte, dédupliquée ensuite.
    const fallback=await espnDailyFallback(url,start,end);
    found.push(...fallback.events);
   }
  }
  const seen=new Set();let count=0;
  for(const event of found){
   if(!event?.id||seen.has(event.id))continue;
   seen.add(event.id);
   const dt=Date.parse(event.date||event.competitions?.[0]?.date||'');
   if(!Number.isFinite(dt)||dt<from||dt>to)continue;
   const c=event.competitions?.[0];if(!c?.competitors?.length)continue;
   const home=c.competitors.find(x=>x.homeAway==='home')||c.competitors[0];
   const away=c.competitors.find(x=>x.homeAway==='away')||c.competitors[1];
   if(!away)continue;
   const names=[espnName(home),espnName(away)];
   for(const [favorite,regexp] of league.teams){
    if(!favorites.some(f=>f.name===favorite)||!names.some(n=>regexp.test(n)))continue;
    const status=c.status?.type||event.status?.type||{};
    const completed=status.completed===true||status.state==='post';
    const started=completed||status.state==='in';
    result.push({id:'espn-'+event.id,home:espnName(home),away:espnName(away),
     homeScore:started?espnScore(home):null,awayScore:started?espnScore(away):null,
     date:event.date||c.date,status:completed?'Terminé':(started?'En cours':'À venir'),favorite,
     competition:league.name,leaguePath:league.url,espnEventId:String(event.id),source:'ESPN ('+league.name+')',
     sourceUrl:league.url.startsWith('basketball/')?'https://www.espn.com/nba/scoreboard':'https://www.espn.com/soccer/scoreboard'});
    count++;
   }
  }
  if(!count&&!league.optional){
   notes.push(issues.length
    ?'ESPN '+league.name+' : données indisponibles ('+issues.join(' ; ')+').'
    :'Aucun match de tes favoris en '+league.name+' sur les 21 derniers et 21 prochains jours.');
  }else if(count&&issues.length){notes.push(league.name+' : couverture partielle, certains mois indisponibles.');}
 }));
 return {events:result,notes};
}
// V4 — Tennis ATP/WTA et statistiques individuelles NBA.
// ESPN n'est pas une API officielle garantie : uniquement des données réellement retournées.
const cleanName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function samePlayer(favorite,actual){
 const a=cleanName(favorite),b=cleanName(actual);
 if(!a||!b)return false;
 if(a===b||b.startsWith(a+' ')||a.startsWith(b+' '))return true;
 const f=a.split(' '),p=b.split(' ');
 // ESPN affiche parfois « J. Sinner » ; ne jamais matcher sur le nom seul.
 return f.length>1&&p.length>1&&f[f.length-1]===p[p.length-1]&&f[0][0]===p[0][0];
}
function tennisSetScore(c){
 const rows=Array.isArray(c?.linescores)?c.linescores:[];
 return rows.map(x=>{
  const s=x?.displayValue??x?.value;
  return s===null||s===undefined||s===''?'':String(s);
 });
}
function tennisSingles(competition,group){
 const label=cleanName(group?.grouping?.displayName||group?.displayName||'');
 return !label||label.includes('single');
}
function tennisCompetitionDate(comp,event){return comp.date||comp.startDate||event.date||null;}
function getTennisMatches(events,league,start,end,tennisFavorites){
 const items=[],seen=new Set();
 for(const tournament of events){
  const groupings=Array.isArray(tournament.groupings)?tournament.groupings:[];
  // Certains événements exposent directement les compétitions.
  const groups=groupings.length?groupings:[{competitions:tournament.competitions||[]}];
  for(const group of groups){
   if(!tennisSingles(null,group))continue;
   for(const c of group.competitions||[]){
    if(!Array.isArray(c.competitors)||c.competitors.length!==2)continue;
    const names=c.competitors.map(x=>x.athlete?.displayName||x.athlete?.fullName||x.displayName||'');
    if(names.some(n=>!n||cleanName(n)==='tbd'))continue;
    const matchDate=tennisCompetitionDate(c,tournament),timestamp=Date.parse(matchDate||'');
    if(!Number.isFinite(timestamp)||timestamp<start||timestamp>end)continue;
    const status=c.status?.type||c.status||{};
    const completed=status.completed===true||status.state==='post';
    const started=completed||status.state==='in';
    const sets=c.competitors.map(tennisSetScore);
    const score=started&&sets.some(s=>s.length)?Array.from({length:Math.max(sets[0].length,sets[1].length)},(_,idx)=>{
     const a=sets[0][idx],b=sets[1][idx];return a&&b?`${a}–${b}`:'';
    }).filter(Boolean).join('  '):'';
    const round=c.round?.displayName||'';
    const statusText=completed?'Terminé':started?'En cours':'À venir';
    for(const favorite of tennisFavorites){
     if(!names.some(n=>samePlayer(favorite.name,n)))continue;
     const row=c.competitors.find((entry,index)=>samePlayer(favorite.name,names[index]));
     const outcome=completed&&typeof row?.winner==='boolean'?(row.winner?'Victoire':'Défaite'):null;
     const key=[league,c.id||c.uid||names.join(':'),favorite.name].join('|');
     if(seen.has(key))continue;seen.add(key);
     items.push({id:key,type:'tennis',favorite:favorite.name,sport:'Tennis',date:matchDate,
      title:`${names[0]} — ${names[1]}`,competition:tournament.name||'Tennis',round,
      score:score||(completed?'Score par set indisponible':started?'Match en cours':'Match à venir'),
      status:statusText,outcome,leaguePath:'tennis/'+league,espnEventId:String(c.id||tournament.id||''),source:`ESPN ${league.toUpperCase()}`,
      sourceUrl:'https://www.espn.com/tennis/scoreboard'});
    }
   }
  }
 }
 return items;
}
async function tennisResults(){
 const favored=favorites.filter(f=>f.sport==='Tennis'&&f.type==='sportif');
 if(!favored.length)return {events:[],notes:[]};
 const now=new Date(),first=new Date(now.getTime()-21*DAY_MS),last=new Date(now.getTime()+14*DAY_MS);
 const months=monthsInRange(first,last),notes=[],events=[];
 await Promise.all(['atp','wta'].map(async league=>{
  let tournaments=[],failed=0,firstFailure='';
  // Limiter volontairement les appels à 3 mois max par tour, sans scraping des sites ATP/WTA.
  await Promise.all(months.slice(0,3).map(async month=>{
   try{
    const url=ESPN_BASE+'tennis/'+league+'/scoreboard?dates='+month;
    const list=await espnFetch(url);
    tournaments.push(...list);
   }catch(e){
    failed++;firstFailure=String(e.message||e);
   }
  }));
  if(!tournaments.length&&failed){
   // Repli : une journée, si le format mois n'est pas accepté.
   try{tournaments=await espnFetch(ESPN_BASE+'tennis/'+league+'/scoreboard?dates='+dayKey(now));}
   catch(e){notes.push(`ESPN tennis ${league.toUpperCase()} indisponible : ${String(e.message||e)}`);return;}
  }else if(failed)notes.push(`Tennis ${league.toUpperCase()} : certaines périodes indisponibles (${firstFailure}).`);
  events.push(...getTennisMatches(tournaments,league,first.getTime(),last.getTime(),favored));
 }));
 const unique=new Map(events.map(x=>[x.id,x]));
 const all=[...unique.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 for(const player of favored){
  if(!all.some(x=>x.favorite===player.name))notes.push(`${player.name} : aucun match ATP/WTA trouvé sur les 21 derniers et 14 prochains jours (Challenger et ITF parfois absents).`);
 }
 return {events:all.slice(0,35),notes};
}
function nbaPlayerStats(box,playerName){
 for(const team of box?.boxscore?.players||[]){
  for(const category of team.statistics||[]){
   const labels=category.labels||category.names||[];
   for(const row of category.athletes||[]){
    if(!samePlayer(playerName,row.athlete?.displayName||row.athlete?.fullName||''))continue;
    if(row.didNotPlay)return {didNotPlay:true};
    if(!Array.isArray(row.stats)||!row.stats.length)continue;
    const val=label=>{
     const i=labels.findIndex(x=>String(x).toUpperCase()===label);
     return i>=0&&row.stats[i]!==undefined&&row.stats[i]!==''?String(row.stats[i]):null;
    };
    const pts=val('PTS'),reb=val('REB'),ast=val('AST'),blk=val('BLK');
    if([pts,reb,ast,blk].every(x=>x===null))continue;
    return {pts,reb,ast,blk};
   }
  }
 }
 return null;
}
async function wembanyamaResults(teamEvents){
 const wembyFav=favorites.find(f=>f.type==='sportif'&&f.sport==='Basketball'&&/wemban[yi]ama/i.test(cleanName(f.name)));
 if(!wembyFav)return {events:[],notes:[]};
 const completed=teamEvents.filter(m=>m.favorite==='San Antonio Spurs'&&m.status==='Terminé'&&m.id.startsWith('espn-')).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,3);
 if(!completed.length)return {events:[],notes:['Victor Wembanyama : aucun match NBA terminé des Spurs sur la période recherchée.']};
 const events=[],issues=[];
 // Trois feuilles de match maximum par rafraîchissement pour limiter les requêtes.
 for(const match of completed){
  try{
   const url=ESPN_BASE+'basketball/nba/summary?event='+encodeURIComponent(match.id.slice(5));
   const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   const stats=nbaPlayerStats(data,'Victor Wembanyama');
   if(stats?.didNotPlay){issues.push(`${date(match.date)} : Victor Wembanyama n'a pas joué.`);continue;}
   if(!stats)continue;
   events.push({type:'nba',id:'wemby-'+match.id,favorite:wembyFav.name,sport:'Basketball',
    date:match.date,title:`${match.home} — ${match.away}`,competition:'NBA',status:'Terminé',
    stats,leaguePath:'basketball/nba',espnEventId:match.id.slice(5),source:'ESPN NBA'});
  }catch(e){issues.push(`Statistiques NBA indisponibles (${String(e.message||e)}).`);}
 }
 if(!events.length&&!issues.length)issues.push('Victor Wembanyama : statistiques individuelles absentes des feuilles de match disponibles.');
 return {events,notes:issues};
}
function individualCard(m){
 const nba=m.type==='nba';
 const lines=nba?['pts','reb','ast','blk'].map((k,i)=>m.stats[k]===null?'':`<div class="stat-mini"><b>${esc(m.stats[k])}</b><small>${['PTS','REB','PD','CTR'][i]}</small></div>`).filter(Boolean).join(''):'';
 return `<article class="card individual"><div class="row wraprow"><span class="tag">${esc(m.favorite)}</span><small>${esc(date(m.date))}</small></div><h3>${esc(m.title)}</h3>${nba?`<div class="statline">${lines}</div>`:`<div class="tennis-score">${esc(m.score)}</div>`}<small>${esc([m.competition,m.round,m.status,m.source].filter(Boolean).join(' · '))}</small></article>`;
}
function individualHtml(limit=99){
 if(loading&&!individualResults.length)return '<p class="muted">Récupération des résultats individuels…</p>';
 const cards=individualResults.slice(0,limit).map(individualCard).join('');
 const notes=individualNotes.length?`<details class="notice diagnostic"><summary>Couverture des sportifs (${individualNotes.length} indication${individualNotes.length>1?'s':''})</summary><div class="notice-text">${individualNotes.map(esc).join('<br>')}</div></details>`:'';
 return (cards||'<p class="muted">Aucun résultat individuel récupéré actuellement.</p>')+(limit===99?notes:'');
}



function latestKouameHtml(){
 const first=recentKouameSnapshot(favorites).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
 if(!first)return '';
 return '<section class="panel" id="dernierKouame">'
  +'<div class="row wraprow"><h2>🎾 Moïse Kouamé — dernier match connu</h2><span class="tag">11 nov. 2026</span></div>'
  +'<p class="sub">Challenger de Monastir · Huitième de finale</p>'
  +'<article class="card individual"><h3>'+esc(first.title)+'</h3>'
  +'<div class="tennis-score">'+esc(first.score)+'</div><strong>'+esc(first.outcome)+'</strong></article>'
  +'<p class="sub">Relevé manuel vérifié au 12 novembre 2026, pas une mise à jour automatique.</p>'
  +'<div class="actions"><a class="button ghost" href="'+esc(safeUrl(TENNIS_LATEST_SOURCE))+'" target="_blank" rel="noopener noreferrer">Voir les résultats actualisés ↗</a>'
  +'<button type="button" id="goKouameHistory" class="button ghost">Tous les matchs disponibles</button></div></section>';
}

function latestSinnerHtml(){
 const last=recentSinnerSnapshot(favorites)[0];
 if(!last)return '';
 return '<section class="panel" id="dernierSinner">'
  +'<div class="row wraprow"><h2>🎾 Jannik Sinner — dernier match officiel</h2><span class="tag">12 juil. 2026</span></div>'
  +'<p class="sub">Wimbledon · Finale contre Alexander Zverev</p>'
  +'<article class="card individual"><h3>'+esc(last.title)+'</h3>'
  +'<div class="tennis-score">'+esc(last.score)+'</div><strong>Victoire · titre à Wimbledon</strong></article>'
  +'<p class="sub">Dernier match officiel de Sinner en 2026. Il a interrompu sa saison pour soigner son genou.</p>'
  +'<p class="sub">Les 7 matchs de Wimbledon ont été ajoutés au relevé historique (non actualisé automatiquement). '
  +'<a href="https://www.channelnewsasia.com/sport/sinner-miss-rest-2026-recover-knee-injury-6435866" target="_blank" rel="noopener noreferrer">Information sur son absence ↗</a></p>'
  +'<div class="actions"><a class="button ghost" href="'+esc(safeUrl(SINNER_MATCH_SOURCE))+'" target="_blank" rel="noopener noreferrer">Résultats détaillés ↗</a>'
  +'<button type="button" id="goSinnerHistory" class="button ghost">Voir ses matchs dans Mon Sport</button></div></section>';
}
function historyHtml(){
 const people=[...new Set(favorites.filter(f=>f.type==='sportif'&&f.sport==='Tennis').map(f=>f.name))];
 const chosen=historyFilter==='Tous'?historyResults:historyResults.filter(r=>r.favorite===historyFilter);
 const list=historyAll?chosen:chosen.slice(0,12);
 const items=list.map(m=>{
   const dt=m.approxDate?'Semaine du '+date(m.date):date(m.date);
   const ref=m.sourceUrl?'<a href="'+esc(safeUrl(m.sourceUrl))+'" rel="noopener noreferrer" target="_blank">Fiche source ↗</a>':'';
   return '<article class="card individual"><div class="row wraprow"><span class="tag">'+esc(m.favorite)+'</span><small>'+esc(dt)+'</small></div>'
     +'<h3>'+esc(m.title)+'</h3><div class="tennis-score">'+esc(m.outcome)+' · '+esc(m.score)+'</div>'
     +'<small>'+esc([m.competition,m.round,m.source].filter(Boolean).join(' · '))+'</small>'
     +(ref?'<div class="sub">'+ref+'</div>':'')+'</article>';
 }).join('');
 const yearSelector='<p class="sub">Année suivie : 2026 uniquement (aucune archive antérieure).</p>';
 const select='<label for="historyFilter">Sportif</label> <select id="historyFilter" class="history-select">'
   +['Tous',...people].map(name=>'<option value="'+esc(name)+'" '+(historyFilter===name?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select>';
 const message=historyLoading?'<p class="muted">Chargement des archives tennis…</p>':'';
 const notes='<details class="notice diagnostic"><summary>Sources, limites et dates de couverture</summary><div class="notice-text">'
   +'Les 62 matchs 2026 recensés de Moïse Kouamé sont un relevé MANUEL arrêté au 12 novembre 2026, pas un flux en temps réel. '
   +'Les 7 matchs de Wimbledon 2026 de Jannik Sinner ont été ajoutés séparément avec leurs dates exactes. Sa saison s’est arrêtée après le 12 juillet. '
   +'ATP/WTA : source hebdomadaire (9 nov. 2026 au dernier contrôle) si disponible. Challenger/ITF : archive de juin. Les dates des archives peuvent être des semaines de tournoi.<br>'
   +historyNotes.map(esc).join('<br>')+'<br>'
   +'<a href="'+esc(TENNIS_HISTORY_SOURCE)+'" target="_blank" rel="noopener noreferrer">Archives Jeff Sackmann ↗</a> · '
   +'<a href="'+esc(TENNIS_LATEST_SOURCE)+'" target="_blank" rel="noopener noreferrer">Résultats récents de Moïse ↗</a>'
   +'</div></details>';
 return yearSelector+select+'<p class="sub">'+chosen.length+' match(s) trouvé(s) · saison '+historyYear+' · résultats terminés uniquement.</p>'
   +message+(items||'<p class="muted">Aucun résultat historique disponible.</p>')
   +(chosen.length>12?'<button id="historyToggle" class="button ghost">'+(historyAll?'Réduire la liste':'Afficher tous les '+chosen.length+' matchs')+'</button>':'')
   +notes;
}
async function refreshHistory(){
 const id=++historyRequest;
 const year=Number(historyYear);
 historyLoading=true;
 historyResults=year===2026?tennisSnapshot2026(favorites):[];
 render();
 try{
   const extra=await loadArchiveTennis(favorites,year);
   if(id!==historyRequest)return;
   const snapshot=year===2026?tennisSnapshot2026(favorites):[];
   // Doublons 2026 évités : la date précise du relevé Kouamé prime
   // sur la date de semaine fournie par les fichiers historiques.
   const archive=year===2026?extra.events.filter(m=>!/kouam/i.test(m.favorite)&&!(/sinner/i.test(m.favorite)&&/wimbledon/i.test(m.competition))):extra.events;
   historyResults=[...snapshot,...archive].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
   historyNotes=extra.notes;
 }catch(e){
   if(id!==historyRequest)return;
   historyResults=year===2026?tennisSnapshot2026(favorites):[];
   historyNotes=['Archives indisponibles : '+String(e.message||e)];
 }finally{if(id===historyRequest){historyLoading=false;softRender();}}
}

// Les classements sont récupérés au démarrage, partagés par Classements et les fiches Stats.
const loadRankingsOnce=createOnceLoader(async(force)=>{
 rankingsLoading=true;if(active==='classements')softRender();
 try{
  const retrieved=await fetchRankings({force});
  rankingsData={...rankingsData,...retrieved};
 }catch(e){console.warn('Classements indisponibles',e);}
 finally{
  rankingsLoading=false;
  if(active==='classements'||(active==='favori'&&favoritePhase==='stats'))softRender();
 }
});
function refreshRankings(force=false){return loadRankingsOnce(force);}
function newsHtml(){return renderNewsView({news:[...news,...jeuSetMathsPosts],loading,hasWorker:!!workerUrl,photos:photoMap,esc,safeUrl,now:new Date(),selectedSources:newsSelectedSources,showAllRelated:newsShowAll,favorites});}
function loadJeuSetMathsPosts(){
 if(jeuSetMathsPending)return jeuSetMathsPending;
 // Le fil de tennis se charge indépendamment des API scores : l'attente
 // d'un résultat ESPN ne doit plus masquer les publications sur téléphone.
 jeuSetMathsPending=fetchJeuSetMathsNews().then(posts=>{
  if(posts.length){
   jeuSetMathsPosts=posts;
   if(active==='actualites'||active==='accueil')softRender();
  }
  return posts;
 }).catch(()=>[]).finally(()=>{jeuSetMathsPending=null;});
 return jeuSetMathsPending;
}
function linkHtml(f){const q=encodeURIComponent(f.name);return `<div class="fav"><div class="details"><b>${esc(f.name)}</b><br><small>${esc(f.sport)} · ${esc(f.type)}</small></div><a target="_blank" rel="noopener noreferrer" href="https://news.google.com/search?q=${q}&hl=fr&gl=FR&ceid=FR%3Afr">Actualités ↗</a></div>`}

function agendaItems(){
 const verified=extraProgramFor(favorites,new Date());
 const extra=verifiedExtraFor(favorites,new Date());
 const expanded=agendaExtendedFor===agendaFavorite&&agendaExtendedPhase===(favoritePhase==='future'?'future':'past')
  ?agendaExtended:[];
 return makeAgenda({
  teams:matches,individuals:individualResults,history:historyResults,
  verified:[...favorites.flatMap(f=>verified2026For(f.name)),...verified.past,...extra.past,...(verified.pending||[]),...(extra.pending||[])],
  expanded:[...expanded,...verified.future,...extra.future]
 });
}
function agendaPage(){
 return renderAgendaView({
  view:active==='favori'?'favori':'semaine',
  phase:active==='favori'?favoritePhase:weekPhase,
  favorite:agendaFavorite,favorites,items:agendaItems(),rankings:rankingsData,
  loading,extendedLoading:active==='favori'&&agendaExtendedLoading,
  extendedError:active==='favori'?agendaExtendedMessage:'',
  notes:[...scoreNotes,...individualNotes,...historyNotes],photos:photoMap,
  esc,safeUrl,now:new Date(),
  summaryFor:item=>matchSummaryArticle(item,[...news],favorites),
  mediaFor:item=>eventMedia.get(item.key)
 });
}
// Résumé ESPN et vidéo des matchs terminés récents, chargés en arrière-plan
// (15 au plus) pour être visibles sans ouvrir la carte.
let mediaLoading=false;
async function prefetchEventMedia(){
 if(mediaLoading||!navigator.onLine)return;
 const since=Date.now()-10*86400000;
 const todo=agendaItems().filter(item=>item.finished&&!item.pendingResult&&Date.parse(item.date)>=since
  &&hasEspnSheet(item)&&!eventMedia.has(item.key)).slice(0,15);
 if(!todo.length)return;
 mediaLoading=true;
 try{
  await Promise.allSettled(todo.map(async item=>{
   const details=await loadEventDetails(item);
   eventMedia.set(item.key,{recap:details.article||null,videos:details.videos||[]});
  }));
 }finally{mediaLoading=false;}
 if(active==='semaine'||active==='favori')softRender();
}
async function loadAgendaExpanded(force=false,preload=false){
 if(preload&&(!agendaFavorite||!favorites.some(f=>f.name===agendaFavorite)))return;
 if(active!=='favori'&&!preload)return;
 const selected=favorites.find(f=>f.name===agendaFavorite);
 if(!selected){agendaExtended=[];agendaExtendedFor='';return;}
 const mode=favoritePhase==='future'?'future':'past';
 const day=new Date().toISOString().slice(0,10);
 const cacheKey=selected.name+'|'+mode+'|'+day,local=agendaCache.get(cacheKey);
 if(!force&&local){
  agendaExtended=local.events;agendaExtendedFor=selected.name;agendaExtendedPhase=mode;
  agendaExtendedMessage=local.message;agendaExtendedLoading=false;if(!preload)render();return;
 }
 const token=++agendaRequest;
 agendaExtended=[];agendaExtendedFor=selected.name;agendaExtendedPhase=mode;
 agendaExtendedLoading=true;agendaExtendedMessage='';
 if(!preload)render();
 try{
  const fetches=[
   fetchAgendaFavorite(selected,{
    leagues:ESPN_LEAGUES,monthsInRange,base:ESPN_BASE,espnMonth,espnFetch,
    getTennisMatches,espnName,espnScore
   },(done,total)=>{
    if(token!==agendaRequest)return;
    const status=document.querySelector('.agenda-progress');
    if(status)status.textContent='Recherche des calendriers : '+done+'/'+total+' périodes';
   },new Date(),mode)
  ];
  // Le début des 12 derniers mois se situe actuellement fin 2025 :
  // récupérer également les résultats ATP/Challenger/ITF de cette année.
  // Les scores historiques restent des faits recoupés, pas du direct.
  const getPastTennis=mode==='past'&&selected.sport==='Tennis'&&selected.type==='sportif'
   &&new Date().getFullYear()===2026;
  if(getPastTennis)fetches.push(loadArchiveTennis([selected],2025));
  const results=await Promise.allSettled(fetches);
  if(token!==agendaRequest)return;
  const events=[],warnings=[];
  const main=results[0];
  if(main.status==='fulfilled'){
   events.push(...main.value.events);
   if(main.value.failures.length)warnings.push(main.value.failures.length+' période(s) ESPN indisponible(s) sur '+main.value.total+'.');
   if(main.value.total===0&&!getPastTennis)warnings.push('Pas de calendrier individuel complet connecté pour ce sport. Les résultats vérifiés restent disponibles.');
  }else warnings.push('Calendrier ESPN indisponible : '+String(main.reason?.message||main.reason));
  if(getPastTennis){
   const archive=results[1];
   if(archive?.status==='fulfilled'){
    events.push(...archive.value.events);
    warnings.push('Résultats 2025 issus des archives tennis (dates parfois approximatives).');
    const unavailable=archive.value.coverage?.some(c=>c.mode!=='weekly');
    if(unavailable)warnings.push('Certaines archives 2025 sont incomplètes ou indisponibles.');
   }else warnings.push('L’archive tennis de fin 2025 n’a pas pu être chargée.');
  }
  agendaExtended=events;
  agendaExtendedMessage=warnings.join(' ');
  agendaCache.set(cacheKey,{events,message:agendaExtendedMessage,saved:Date.now()});
 }catch(e){
  if(token!==agendaRequest)return;
  agendaExtendedMessage='Calendrier étendu indisponible : '+String(e.message||e);
 }finally{
  if(token===agendaRequest){agendaExtendedLoading=false;if(preload)softRender();else render();}
 }
}

function render(){
 if(starting){
  app.innerHTML='<main class="wrap startup-shell" role="status" aria-live="polite">'
   +'<h1>⚡ Mon Sport</h1><div class="startup-spinner" aria-hidden="true"></div>'
   +'<h2>Chargement des données sportives</h2>'
   +'<p>Résultats, actualités et classements chargés une seule fois pour cette session.</p>'
   +'</main>';
  return;
 }
 const sports=['Tous',...new Set(favorites.map(f=>f.sport))];
 app.innerHTML='<main class="wrap">'
  +'<header class="app-header app-header-v11"><h1>⚡ Mon Sport</h1>'
  +'<div class="header-actions"><span class="header-count">'+favorites.length+' favoris'
  +(loading?'<small class="header-updated">Actualisation…</small>':lastUpdated?'<small class="header-updated">Mis à jour '+ago(lastUpdated)+'</small>':'')+'</span>'
  +'<button id="refresh" class="button refresh-btn" '+(loading?'disabled':'')+' aria-label="Actualiser les résultats">'+(loading?'…':'↻')+'</button></div></header>'
  +(!navigator.onLine?'<div class="connection-notice" role="status">📴 Hors connexion : données conservées disponibles, actualisation suspendue.</div>':'')
  +'<nav class="tabs" aria-label="Navigation principale">'+tabs.map(([id,label])=>
    '<button type="button" data-tab="'+id+'" aria-current="'+(id===active?'page':'false')+'" class="'+(id===active?'active':'')+'">'+label+'</button>').join('')+'</nav>'
  +'<div id="content">'+content()+'</div>'
  +'<footer class="muted app-footer">Mon Sport '+APP_LABEL+' · Fil chronologique et lecture intégrée</footer></main>';
 document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{
  active=el.dataset.tab;search='';sportFilter='Tous';render();
  if(active==='favori'&&favoritePhase!=='stats')loadAgendaExpanded();
  // Tableau déjà en mémoire : aucun rechargement au changement d'onglet.
 });
 document.querySelector('#refresh').onclick=()=>{loadJeuSetMathsPosts();refresh();if(active==='favori'&&favoritePhase!=='stats')loadAgendaExpanded(true);if(active==='classements'||(active==='favori'&&favoritePhase==='stats'))refreshRankings(true);};
 const postsRefresh=document.querySelector('#jsmRefresh');
 if(postsRefresh)postsRefresh.onclick=()=>{
  postsRefresh.disabled=true;
  postsRefresh.textContent='Actualisation…';
  loadJeuSetMathsPosts().finally(()=>{
   if(postsRefresh.isConnected){postsRefresh.disabled=false;postsRefresh.textContent='↻ Posts';}
  });
 };
 document.querySelectorAll('[data-news-source]').forEach(button=>button.onclick=()=>{
  const name=button.dataset.newsSource;
  newsSelectedSources=newsSelectedSources.includes(name)?newsSelectedSources.filter(x=>x!==name):[...newsSelectedSources,name];render();
 });
 const allSources=document.querySelector('#newsSourcesAll');if(allSources)allSources.onclick=()=>{newsSelectedSources=[];render();};
 const showAll=document.querySelector('#newsShowAll');if(showAll)showAll.onclick=()=>{newsShowAll=!newsShowAll;render();};
 document.querySelectorAll('[data-read-article]').forEach(button=>button.onclick=async()=>{
  const link=button.dataset.readArticle,slot=document.querySelector('[data-article-content="'+CSS.escape(link)+'"]');
  if(!slot)return;
  if(button.dataset.localText==='1')slot.dataset.loaded='1';
  if(slot.dataset.loaded==='1'){slot.hidden=!slot.hidden;button.textContent=slot.hidden?'Lire dans Mon Sport':'Masquer le texte';return;}
  if(!workerUrl){slot.hidden=false;slot.innerHTML='<p class="news-reader-note">Configure le Worker Cloudflare dans Réglages pour lire les articles ici.</p>';return;}
  button.disabled=true;button.textContent='Chargement…';slot.hidden=false;slot.innerHTML='<p class="news-reader-note">Récupération du contenu public…</p>';
  try{
   const data=await request('/api/article',{url:link});
   const body=data.blocks?.length?renderBlocks(data.blocks,esc):renderArticleBody(data.text,esc);
   slot.innerHTML=body?body+(data.truncated?'<p class="news-reader-note">Texte tronqué : la suite est disponible chez l’éditeur.</p>':''):'<p class="news-reader-note">Le contenu intégral n’est pas publiquement accessible. Tu peux consulter la source originale.</p>';
   slot.dataset.loaded='1';button.textContent='Masquer le texte';
  }catch(e){slot.innerHTML='<p class="news-reader-note">Lecture intégrée indisponible : '+esc(String(e.message||e))+'</p>';button.textContent='Réessayer';}
  finally{button.disabled=false;}
 });
 bindContent();
}
function content(){const sports=['Tous',...new Set(favorites.map(f=>f.sport))];if(active==='semaine'||active==='favori')return agendaPage();
if(active==='classements')return renderRankingsView({selected:rankingSelected,live:rankingsData,favorites,loading:rankingsLoading,ageMax:rankAgeMax,country:rankCountry,esc,safeUrl});
if(active==='accueil')return `${latestKouameHtml()}${latestSinnerHtml()}<section class="panel"><div class="row"><h2>🏆 Derniers résultats disponibles</h2><button class="button ghost" data-goto="resultats">Voir tout</button></div>${resultHtml()}</section><section class="panel"><div class="row"><h2>🎾🏀 Résultats individuels</h2><button class="button ghost" data-goto="resultats">Voir tout</button></div>${individualHtml(6)}</section><section class="panel"><div class="row"><h2>📰 Actualités récentes</h2><button class="button ghost" data-goto="actualites">Voir tout</button></div>${newsHtml()}</section><section class="panel"><h2>⭐ Accès rapide aux favoris</h2>${favorites.slice(0,6).map(linkHtml).join('')}</section>`;
if(active==='resultats')return `${latestKouameHtml()}${latestSinnerHtml()}<section class="panel"><h2>🏆 Résultats et prochains matchs</h2><p class="sub">Scores ESPN pour PSG, Real Madrid et Spurs, avec tentative de couverture des coupes, des Bleus en football et du XV de France aux Six Nations. Les statistiques de Wembanyama apparaissent dans le détail des matchs des Spurs. Données non officielles et non exhaustives.</p>${resultHtml()}</section><section class="panel"><h2>🎾 Tennis ATP / WTA et 🏀 détail NBA dans les matchs des Spurs</h2><p class="sub">Matchs des sportifs suivis au tennis (21 derniers et 14 prochains jours) et statistiques de Victor Wembanyama sur les derniers matchs des Spurs. ESPN : source publique non officielle, couverture partielle.</p>${individualHtml()}</section><section class="panel"><h2>🎾 Historique des matchs — ATP, Challenger et ITF</h2><p class="sub">Moïse Kouamé et tes autres joueurs suivis : résultats historiques, scores et tournois. Les données sont partielles et les relevés manuels sont identifiés.</p>${historyHtml()}</section><section class="panel"><h2>🔎 Rechercher un résultat sur le web</h2>${favorites.map(f=>`<div class="fav"><span class="details">${esc(f.name)}</span><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?q=${encodeURIComponent(f.name+' dernier résultat sportif')}">Voir ↗</a></div>`).join('')}</section>`;
if(active==='bilan')return renderAudit2026({favorites,historyResults,yearAudit,yearLoading,yearMessage,auditSelected,esc,safeUrl,date});
if(active==='actualites')return newsHtml();
if(active==='favoris')return `<section class="panel"><h2>➕ Ajouter un favori</h2><form id="addform"><input name="name" placeholder="Nom de l'équipe ou du sportif" maxlength="100" required/><select name="sport">${['Football','Tennis','Rugby','Basketball','Cyclisme','Natation','Tennis de table','Autre'].map(s=>`<option>${s}</option>`).join('')}</select><select name="type"><option value="sportif">Sportif</option><option value="équipe">Équipe</option></select><input name="apiName" placeholder="Nom API (facultatif)" maxlength="100"/><button class="button" type="submit">Ajouter aux favoris</button></form></section><section class="panel"><h2>⭐ Mes favoris (${favorites.length})</h2><select id="sportFilter">${sports.map(s=>`<option ${sportFilter===s?'selected':''}>${esc(s)}</option>`).join('')}</select><input class="search" id="search" value="${esc(search)}" placeholder="Rechercher un favori"/><div id="favoriteList">${favoriteRows()}</div></section>`;
return `<section class="panel"><h2>⚙️ Paramétrage des données</h2><p>Renseigne l'URL publique de ton Cloudflare Worker pour activer les articles. Les scores ESPN (équipes et sportifs) sont récupérés directement depuis le téléphone ; ils ne nécessitent pas le Worker.</p><form id="settingsform"><input id="workerUrl" style="grid-column:1/-1" type="url" placeholder="https://mon-sport-api.nom.workers.dev" value="${esc(workerUrl)}"/><button class="button" type="submit">Enregistrer et actualiser</button></form><p class="sub">Adresse https uniquement. Aucune donnée personnelle n'est envoyée à notre serveur : seules les recherches sur tes favoris sont transmises aux services sportifs et d'actualités.</p></section><section class="panel"><h2>📦 Exporter / importer mes favoris</h2><div class="actions"><button id="export" class="button ghost">Exporter JSON</button><label class="button ghost" style="cursor:pointer">Importer JSON <input id="import" type="file" accept="application/json" hidden/></label><button id="reset" class="button ghost danger">Réinitialiser</button></div><p class="sub">Tes favoris sont stockés uniquement dans ce navigateur. Un export permet de les sauvegarder.</p></section><section class="panel"><h2>🔄 Mises à jour</h2><p class="sub">Version ${APP_LABEL}. Icônes des sources, vraies images FFL, résultats avec résumé et vidéo.</p><button type="button" class="button" id="checkUpdates">Vérifier et recharger</button><p class="sub" id="updateStatus" role="status"></p></section><section class="panel"><h2>🖼️ Photos et blasons</h2><p class="sub">Une image peut manquer si Wikimedia ou ESPN ne la propose pas. Relancer la recherche ne supprime aucun favori.</p><button type="button" class="button ghost" id="refreshPhotos">Rechercher les photos manquantes</button><p class="sub" id="photoStatus" role="status"></p></section>`}
function favoriteRows(){
 return filtered().map(f=>{
  const img=photoMap[f.name]?.src;
  const thumb=img?'<span class="fav-thumb" data-photo-owner="'+esc(f.name)+'"><img class="athlete-photo" data-photo-name="'+esc(f.name)+'" loading="lazy" src="'+esc(safeUrl(img))+'" alt="Photo ou logo de '+esc(f.name)+'"/><span class="portrait-error-initials">'+esc(photoInitials(f.name))+'</span></span>'
   :'<span class="fav-thumb portrait-placeholder" data-photo-owner="'+esc(f.name)+'">'+esc(photoInitials(f.name))+'</span>';
  return '<div class="fav">'+thumb+'<div class="details"><b>'+esc(f.name)+'</b><small>'+esc(f.sport)+'</small></div>'
   +'<button class="button ghost danger" data-remove="'+esc(f.id)+'" aria-label="Supprimer '+esc(f.name)+'">✕</button></div>';
 }).join('')||'<div class="empty">Aucun favori</div>';
}
// Mise à jour ciblée du portrait : évite d'interrompre les chargements
// en remplaçant le DOM de toute l'application à chaque nouvelle photo.
function handlePhotoError(img){
 const name=img.dataset.photoName||'';
 const backup=safeUrl(photoMap[name]?.fallbackSrc);
 if(backup!=='#'&&!img.dataset.backupTried&&img.src!==backup){
  img.dataset.backupTried='1';img.src=backup;return;
 }
 img.closest('[data-photo-owner]')?.classList.add('photo-failed');
 if(name)clearPhotoCache([name]); // image cassée : retester au prochain essai
}
function syncPhoto(name,photo){
 photoMap[name]=photo;
 const src=safeUrl(photo?.src);
 if(src==='#')return;
 document.querySelectorAll('[data-photo-owner]').forEach(node=>{
  if(node.dataset.photoOwner!==name)return;
  const image=document.createElement('img');
  image.className='athlete-photo';image.dataset.photoName=name;
  image.alt='Photo ou logo de '+name;image.loading='lazy';image.decoding='async';
  image.addEventListener('error',()=>handlePhotoError(image));
  const fallback=document.createElement('span');
  fallback.className='portrait-error-initials';fallback.textContent=photoInitials(name);
  node.classList.remove('portrait-placeholder','photo-failed');
  node.removeAttribute('aria-hidden');
  if(!node.classList.contains('fav-thumb'))node.classList.add('portrait-wrap');
  node.replaceChildren(image,fallback);
  image.src=src;
 });
 if(active==='favori'&&name===agendaFavorite&&photo.creditUrl){
  const host=document.querySelector('.favorite-profile-name');
  if(host){
   let credit=host.querySelector('a');
   if(!credit){credit=document.createElement('a');host.append(credit);}
   credit.href=safeUrl(photo.creditUrl);credit.target='_blank';credit.rel='noopener noreferrer';
   credit.textContent='Image · crédit ↗';
  }
 }
 const status=document.querySelector('#photoStatus');
 if(status)status.textContent=Object.keys(photoMap).length+'/'+favorites.length+' images identifiées (chargement selon disponibilité).';
}
async function reloadPhotos(clear=false){
 const token=++photoRequest;
 if(clear){clearPhotoCache(favorites);photoMap={};}
 const result=await loadFavoritePhotos(favorites,(name,photo)=>{
  if(token===photoRequest)syncPhoto(name,photo);
 });
 if(token!==photoRequest)return {};
 photoMap={...photoMap,...result};
 const status=document.querySelector('#photoStatus');
 if(status)status.textContent=Object.keys(photoMap).length+'/'+favorites.length+' images identifiées ; les autres affichent des initiales.';
 return result;
}
function bindContent(){
 // Chaque carte développe son résumé local ; la feuille ESPN détaillée
 // n'est téléchargée qu'au moment du premier clic.
 document.querySelectorAll('[data-event-detail]').forEach(card=>{
  card.addEventListener('toggle',async()=>{
   if(!card.open||card.dataset.detailLoaded==='1')return;
   card.dataset.detailLoaded='1';
   const item=agendaItems().find(x=>x.key===card.dataset.eventDetail);
   const slot=card.querySelector('.detail-live-slot');
   if(!item||!slot)return;
   slot.textContent='Recherche des statistiques de cette rencontre…';
   try{
    const details=await loadEventDetails(item);
    if(card.isConnected&&card.open){
     const near=findMatchArticles(item,news);
     const reports=near.length?'<div class="event-editorial"><h5>📰 Articles sur cette rencontre</h5>'
       +near.map(n=>'<a href="'+esc(safeUrl(n.link))+'" target="_blank" rel="noopener noreferrer">'+esc(n.title)+' · '+esc(n.source||'Éditeur')+' ↗</a>').join('')+'</div>':'';
     const q=[item.title,item.competition,new Date(item.date).getFullYear(),'résumé'].filter(Boolean).join(' ');
     const search='https://news.google.com/search?q='+encodeURIComponent(q)+'&hl=fr&gl=FR&ceid=FR:fr';
     const source=item.sourceUrl&&safeUrl(item.sourceUrl)!=='#'
      ?'<a href="'+esc(safeUrl(item.sourceUrl))+'" target="_blank" rel="noopener noreferrer">Source sportive ↗</a>':'';
     slot.innerHTML='<div class="event-article-summary"><h4>Compte rendu sportif</h4><p>Résultat et statistiques issus des sources affichées ci-dessous.</p></div>'
      +renderEventDetails(details,esc)+reports
      +'<div class="event-source-links">'+source+'<a href="'+esc(search)+'" target="_blank" rel="noopener noreferrer">Chercher un article de cette rencontre ↗</a></div>';
    }
   }catch(e){
    if(card.isConnected)slot.textContent='Données détaillées indisponibles : '+String(e.message||e);
   }
  });
 });
 document.querySelectorAll('[data-stop]').forEach(el=>el.addEventListener('click',event=>event.stopPropagation()));
 document.querySelectorAll('[data-play-video]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  const slot=button.parentElement.querySelector('.result-video-slot');
  if(!slot)return;
  if(slot.firstChild){slot.replaceChildren();button.textContent='▶ Voir le résumé vidéo';return;}
  const video=document.createElement('video');
  video.className='result-video';video.controls=true;video.playsInline=true;video.preload='metadata';
  if(button.dataset.poster)video.poster=button.dataset.poster;
  video.src=button.dataset.playVideo;
  video.addEventListener('click',e=>e.stopPropagation());
  video.addEventListener('error',()=>{
   const page=button.dataset.videoPage;
   slot.innerHTML=page&&page!=='#'?'<a class="result-replay ghost" href="'+esc(page)+'" target="_blank" rel="noopener noreferrer">▶ Ouvrir la vidéo sur ESPN ↗</a>':'<p class="news-reader-note">Vidéo indisponible sur cet appareil.</p>';
  },{once:true});
  slot.replaceChildren(video);button.textContent='✕ Fermer la vidéo';
  video.play().catch(()=>{});
 }));
 // Image d'article indisponible : afficher uniquement le pictogramme sportif.
 document.querySelectorAll('img.article-thumb-image').forEach(image=>{
  image.addEventListener('error',()=>image.closest('.article-visual')?.classList.add('image-failed'),{once:true});
 });
 // Les photos d'un post s'affichent comme des médias ordinaires, sans iframe X.
 document.querySelectorAll('img.jsm-native-image').forEach(image=>{
  const fail=()=>{
   image.hidden=true;
   const label=image.closest('figure')?.querySelector('.jsm-native-image-error');
   if(label)label.hidden=false;
  };
  image.addEventListener('error',fail,{once:true});
  if(image.complete&&image.naturalWidth===0)fail();
 });
 document.querySelectorAll('video.jsm-native-video').forEach(video=>{
  video.addEventListener('error',()=>{
   video.insertAdjacentHTML('afterend','<p class="jsm-native-note">Vidéo temporairement indisponible depuis X.</p>');
   video.hidden=true;
  },{once:true});
 });
 // Si une URL Wikimedia ne charge pas, montrer immédiatement les initiales
 // plutôt qu'une image cassée.
 document.querySelectorAll('img.athlete-photo').forEach(img=>{
  img.addEventListener('error',()=>handlePhotoError(img));
 });
 document.querySelectorAll('[data-rank-select]').forEach(el=>el.onclick=()=>{
  rankingSelected=el.dataset.rankSelect;render();
 });
 const rankAge=document.querySelector('#rankAgeMax');
 if(rankAge)rankAge.onchange=()=>{rankAgeMax=rankAge.value;render();};
 const rankNation=document.querySelector('#rankCountry');
 if(rankNation)rankNation.onchange=()=>{rankCountry=rankNation.value;render();};
 const rankReset=document.querySelector('#rankFilterReset');
 if(rankReset)rankReset.onclick=()=>{rankAgeMax='';rankCountry='';render();};
 document.querySelectorAll('[data-rank-favorite]').forEach(el=>el.onclick=()=>{
  const name=el.dataset.rankFavorite;
  if(!favorites.some(f=>f.name===name))return;
  agendaFavorite=name;favoritePhase='stats';active='favori';render();
 });
 document.querySelectorAll('[data-view-ranking]').forEach(el=>el.onclick=()=>{
  rankingSelected=el.dataset.viewRanking;active='classements';render();
 });

 document.querySelectorAll('[data-agenda-phase]').forEach(button=>button.onclick=()=>{
  if(active==='favori'){
   favoritePhase=button.dataset.agendaPhase;
   agendaRequest++;agendaExtended=[];agendaExtendedFor='';agendaExtendedPhase='';
   render();if(favoritePhase!=='stats')loadAgendaExpanded();
  }else{weekPhase=button.dataset.agendaPhase;render();}
 });
 const picker=document.querySelector('#agendaFavorite');
 if(picker)picker.onchange=()=>{
  agendaFavorite=picker.value;agendaRequest++;agendaExtendedFor='';agendaExtendedPhase='';agendaExtended=[];agendaExtendedMessage='';
  render();if(favoritePhase!=='stats')loadAgendaExpanded();
 };
 const auditChoice=document.querySelector('#auditChoice');if(auditChoice)auditChoice.onchange=()=>{auditSelected=auditChoice.value;render()};const auditButton=document.querySelector('#auditRun');if(auditButton)auditButton.onclick=runYearAudit;const sinnerButton=document.querySelector('#goSinnerHistory');if(sinnerButton)sinnerButton.onclick=()=>{active='resultats';historyFilter=favorites.find(f=>f.sport==='Tennis'&&/sinner/i.test(f.name))?.name||'Tous';historyYear='2026';historyAll=true;refreshHistory();document.querySelector('#historyFilter')?.scrollIntoView({behavior:'smooth'});};const ys=document.querySelector('#historyYear');if(ys)ys.onchange=()=>{historyYear=ys.value;historyAll=false;refreshHistory()};const go=document.querySelector('#goKouameHistory');if(go)go.onclick=()=>{active='resultats';historyFilter=favorites.find(f=>f.sport==='Tennis'&&/kouam/i.test(f.name))?.name||'Tous';historyYear='2026';historyAll=true;refreshHistory();document.querySelector('#historyFilter')?.scrollIntoView({behavior:'smooth'});};const hFilter=document.querySelector('#historyFilter');if(hFilter)hFilter.onchange=()=>{historyFilter=hFilter.value;historyAll=false;render()};const hToggle=document.querySelector('#historyToggle');if(hToggle)hToggle.onclick=()=>{historyAll=!historyAll;render()};const updateButton=document.querySelector('#checkUpdates');if(updateButton)updateButton.onclick=forceUpdate;const photoButton=document.querySelector('#refreshPhotos');if(photoButton)photoButton.onclick=async()=>{photoButton.disabled=true;const status=document.querySelector('#photoStatus');if(status)status.textContent='Recherche des portraits…';try{await reloadPhotos(true);}catch(e){if(status)status.textContent='Recherche indisponible : '+String(e.message||e);}finally{if(photoButton.isConnected)photoButton.disabled=false;}};document.querySelectorAll('[data-goto]').forEach(e=>e.onclick=()=>{active=e.dataset.goto;render()});document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()});const add=document.querySelector('#addform');if(add)add.onsubmit=e=>{e.preventDefault();const data=new FormData(add),name=String(data.get('name')).trim();if(!name)return;favorites.push({id:crypto.randomUUID(),name,sport:data.get('sport'),type:data.get('type'),apiName:String(data.get('apiName')).trim()||name});save();render()};const sf=document.querySelector('#sportFilter');if(sf)sf.onchange=()=>{sportFilter=sf.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const input=document.querySelector('#search');if(input)input.oninput=()=>{search=input.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const settings=document.querySelector('#settingsform');if(settings)settings.onsubmit=e=>{e.preventDefault();const val=document.querySelector('#workerUrl').value.trim().replace(/\/$/,'');if(val&&!/^https:\/\/[^\s]+$/.test(val)){alert('Une URL HTTPS valide est nécessaire.');return}workerUrl=val;localStorage.setItem(URL_KEY,workerUrl);active='semaine';news=[];matches=[];individualResults=[];render();refresh()};const ex=document.querySelector('#export');if(ex)ex.onclick=()=>{const blob=new Blob([JSON.stringify(favorites,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mes-favoris-sport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};const imp=document.querySelector('#import');if(imp)imp.onchange=async()=>{try{const data=JSON.parse(await imp.files[0].text());if(!Array.isArray(data)||data.some(f=>typeof f.name!=='string'||typeof f.sport!=='string'||!['équipe','sportif'].includes(f.type)))throw Error('Format invalide');favorites=data.slice(0,200).map(f=>({id:crypto.randomUUID(),name:f.name.slice(0,100),sport:f.sport.slice(0,50),type:f.type,apiName:String(f.apiName||f.name).slice(0,100)}));save();render()}catch(e){alert('Import impossible : '+e.message)}};const reset=document.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('Réinitialiser tous les favoris ?')){favorites=DEFAULTS.map(f=>({...f,id:crypto.randomUUID()}));save();render()}}}
async function forceUpdate(){
 const button=document.querySelector('#checkUpdates'),status=document.querySelector('#updateStatus');
 if(button)button.disabled=true;
 if(status)status.textContent='Recherche des mises à jour…';
 try{
  if('serviceWorker' in navigator){
   const registration=await navigator.serviceWorker.getRegistration('./');
   if(registration)await registration.update();
  }
  const url=new URL('./',location.href);
  url.searchParams.set('maj',String(Date.now()));
  location.replace(url.href);
 }catch(error){
  if(status)status.textContent='Impossible de vérifier la mise à jour : '+String(error.message||error);
  if(button)button.disabled=false;
 }
}
async function runYearAudit(){
 if(yearLoading)return;
 yearLoading=true;yearMessage='Recherche annuelle en préparation…';render();
 try{
  yearAudit=await auditEspn2026(favorites,ESPN_LEAGUES,(done,total)=>{
   yearMessage='Périodes interrogées : '+done+'/'+total;
   const p=document.querySelector('#yearProgress');if(p)p.textContent=yearMessage;
  });
  yearMessage='Terminé : '+yearAudit.successfulQueries+'/'+yearAudit.totalQueries+' périodes ESPN récupérées.';
 }catch(e){yearMessage='Bilan annuel ESPN non disponible : '+String(e.message||e);}
 finally{yearLoading=false;render();}
}
function bindRemove(){document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()})}
async function request(path,params){const u=new URL(workerUrl+path);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));const response=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);return response.json()}
async function refresh(){
 if(loading)return;
 if(!navigator.onLine){errors=['Hors connexion : les dernières données disponibles restent affichées.'];render();return;}
 loading=true;errors=[];softRender();
 try{
  // Google Actualités refuse les requêtes du relais Cloudflare (HTTP 503) :
  // les médias passent par /api/sports-news, FFL directement ou par le relais.
  const [espn,tennis,extraNews,fflNews]=await Promise.all([
   espnResults(),
   tennisResults(),
   fetchSportsNews(favorites,new Date(),workerUrl).catch(()=>[]),
   fetchFFLNews().catch(()=>[]),
  ]);
  scoreNotes=[...espn.notes];individualNotes=[];
  const seen=new Set();
  matches=espn.events.filter(m=>m.home&&m.away).filter(m=>{
   const key=[m.favorite,m.id].join('|');
   if(seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,160);
  // Un échec d'une feuille de match NBA ne doit jamais bloquer les scores des clubs.
  const nba=await wembanyamaResults(matches);
  const trackedWemby=favorites.find(f=>f.type==='sportif'&&f.sport==='Basketball'&&/wemban[yi]ama/i.test(cleanName(f.name)));
  if(trackedWemby)matches=mergeSpursAndWembanyama(matches,nba.events,trackedWemby.name);
  // Les stats NBA sont attachées à la rencontre Spurs : pas de seconde carte individuelle.
  individualResults=tennis.events.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  individualNotes.push(...tennis.notes,...nba.notes);
  news=newsLastWeek([...extraNews,...fflNews],new Date());
  if(!workerUrl&&!news.length&&!jeuSetMathsPosts.length)errors.push('Aucun article reçu de FFL, ESPN ou Jeu, set et maths. Le relais Cloudflare est facultatif.');
  else if(!news.length&&!jeuSetMathsPosts.length)errors.push('Aucune actualité reçue du relais.');
  if(!matches.length&&!scoreNotes.length)scoreNotes.push('Aucune rencontre disponible pour PSG, Real Madrid ou Spurs sur la période consultée.');
  lastUpdated=Date.now();writeSnapshot();
  prefetchEventMedia().catch(()=>{});
 }catch(e){errors.push('Actualisation impossible : '+String(e.message||e));}
 finally{loading=false;softRender();}
}
// Chargement initial unique : l'utilisateur navigue ensuite dans les données en mémoire.
async function startApp(){
 render();
 const tasks=Promise.allSettled([
  refresh(),
  loadJeuSetMathsPosts(),
  refreshHistory(),
  refreshRankings(),
  loadAgendaExpanded(false,true)
 ]);
 // Une source lente ne doit pas immobiliser l'application indéfiniment.
 let deadline;
 try{
  await Promise.race([tasks,new Promise(resolve=>{
   // Premier lancement sans données mémorisées : 4 s d'attente au plus,
   // l'interface se complète ensuite au fil des réponses.
   deadline=setTimeout(resolve,starting?4000:0);
  })]);
 }finally{
  clearTimeout(deadline);
  starting=false;render();
 }
 // Les photos s'appliquent à leurs cellules sans réinitialiser l'interface.
 reloadPhotos().catch(()=>{});
 prefetchEventMedia().catch(()=>{});
}
startApp().catch(error=>{
 console.warn('Initialisation partielle',error);
 starting=false;render();
});
if('serviceWorker' in navigator){
 // Une mise à jour de la PWA ne doit JAMAIS recharger l'écran d'un favori.
 // Le seul rechargement volontaire reste le bouton « Vérifier et recharger ».
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{
  registration.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{
   if(!document.hidden)registration.update().catch(()=>{});
  });
 }).catch(()=>{});
}

// Mise à jour du bandeau réseau sans rechargement : les données locales restent consultables.
window.addEventListener('online',()=>render());
window.addEventListener('offline',()=>render());
