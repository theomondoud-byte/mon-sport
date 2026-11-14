import {recentKouameSnapshot,recentSinnerSnapshot,tennisSnapshot2026,loadArchiveTennis,TENNIS_HISTORY_SOURCE,TENNIS_LATEST_SOURCE,SINNER_MATCH_SOURCE} from './tennis-history.js?v=17.4.0';
import {createOnceLoader} from './session-loader.js?v=17.4.0';
import {makeAgenda,mergeSpursAndWembanyama} from './agenda-model.js?v=17.4.0';
import {renderAgendaView} from './agenda-ui.js?v=17.4.0';
import {RANKINGS,renderRankingsView,fetchRankings,rankingForFavorite} from './rankings-view.js?v=17.4.0';
import {fetchFFLNews,fetchJeuSetMathsNews,readAvailableJeuSetMathsNews,findMatchArticles} from './sports-articles.js?v=17.4.0';
import {fetchAgendaFavorite} from './agenda-fetch.js?v=17.4.0';
import {loadFavoritePhotos,clearPhotoCache,photoInitials} from './photos.js?v=17.4.0';
import {extraProgramFor} from './verified-program.js?v=17.4.0';
import {verifiedExtraFor} from './verified-extra-v11.js?v=17.4.0';
import {coverageFor} from './coverage-v11.js?v=17.4.0';
import {renderNewsView,newsLastWeek,fetchSportsNews,renderArticleBody,renderBlocks,matchSummaryArticle,articleKey} from './news-view.js?v=17.4.0';
import {loadEventDetails,renderEventDetails,hasEspnSheet} from './event-details.js?v=17.4.0';
import {verified2026For} from './audit-2026.js?v=17.4.0';
import {renderAudit2026} from './audit-ui.js?v=17.4.0';
import {auditEspn2026} from './audit-espn-2026.js?v=17.4.0';
import {APP_LABEL,APP_VERSION} from './version.js?v=17.4.0';
const DEFAULTS = [
 ['Real Madrid','Football','équipe','Real Madrid'],['FC Barcelone','Football','équipe','FC Barcelona'],['PSG','Football','équipe','Paris Saint Germain'],['San Antonio Spurs','Basketball','équipe','San Antonio Spurs'],
 ['Victor Wembanyama','Basketball','sportif'],['Léon Marchand','Natation','sportif'],['Sauveur Cristofini','Natation','sportif'],['Félix Lebrun','Tennis de table','sportif'],['Alexis Lebrun','Tennis de table','sportif'],['Flavien Coton','Tennis de table','sportif'],['Paul Seixas','Cyclisme','sportif'],['Kylian Mbappé','Football','sportif'],['Équipe de France de football','Football','équipe','France'],['XV de France','Rugby','équipe','France Rugby'],['Arthur Fils','Tennis','sportif'],['Jannik Sinner','Tennis','sportif'],['Carlos Alcaraz','Tennis','sportif'],['Rafael Jódar','Tennis','sportif'],['Moïse Kouamé','Tennis','sportif'],['Mirra Andreeva','Tennis','sportif']
].map(([name,sport,type,apiName])=>({id:crypto.randomUUID(),name,sport,type,apiName:apiName||name}));
const KEY='monsport-favorites-v1', URL_KEY='monsport-worker-url-v1';
// Relais Cloudflare de l'application : utilisé sur tout appareil où aucune
// autre adresse n'a été saisie dans Réglages.
const DEFAULT_WORKER_URL='https://mon-sport-api.theomondoud.workers.dev';
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
let favorites=load(), workerUrl=(()=>{try{return localStorage.getItem(URL_KEY)||DEFAULT_WORKER_URL}catch{return DEFAULT_WORKER_URL}})(),relayStatus=null,active='semaine',sportFilter='Tous',search='',loading=false,news=[],matches=[],individualResults=[],individualNotes=[],errors=[],scoreNotes=[],historyResults=tennisSnapshot2026(favorites),historyNotes=[],historyLoading=false,historyFilter=favorites.some(f=>f.name==='Moïse Kouamé')?'Moïse Kouamé':'Tous',historyAll=false,historyYear='2026',historyRequest=0,auditSelected='Moïse Kouamé',yearAudit=null,yearLoading=false,yearMessage='',weekPhase='past',favoritePhase='past',agendaFavorite=favorites.some(f=>f.name==='Moïse Kouamé')?'Moïse Kouamé':favorites[0]?.name||'',agendaExtended=[],agendaExtendedFor='',agendaExtendedPhase='',agendaExtendedLoading=false,agendaExtendedMessage='',agendaRequest=0,agendaCache=new Map(),photoMap={},photoRequest=0,rankingSelected='atp',rankingsData={},rankingsLoading=false,rankAgeMax='',rankCountry='',newsSelectedSources=[],newsShowAll=false,eventMedia=new Map(),newsReadView='unread',newsKeep=new Set(),tweetMedia=new Map();
// Articles lus : mémorisés sur l'appareil 21 jours (le fil couvre 7 jours).
const READ_KEY='monsport-read-v1',READ_TTL=21*86400000;
let readArticles=(()=>{try{const v=JSON.parse(localStorage.getItem(READ_KEY)||'{}');const now=Date.now();return Object.fromEntries(Object.entries(v).filter(([,t])=>Number.isFinite(t)&&now-t<READ_TTL));}catch{return {}}})();
const saveRead=()=>{try{localStorage.setItem(READ_KEY,JSON.stringify(readArticles));}catch{}};
function setRead(key,read){if(!key)return;if(read)readArticles[key]=Date.now();else delete readArticles[key];saveRead();}
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
 // Article ouvert ou vidéo affichée : l'écran n'est pas recréé sous les yeux du lecteur.
 if(document.querySelector('#content .news-fulltext:not([hidden]), #content .result-video-slot>*, #content .result-recap-full:not([hidden]), #content details.agenda-event[open]')){pendingRender=true;return;}
 pendingRender=false;render();
}
document.addEventListener('focusout',()=>{if(pendingRender)setTimeout(()=>{if(pendingRender)softRender();},0);});
function softRenderIfPending(){if(pendingRender)setTimeout(()=>{if(pendingRender)softRender();},0);}
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
// Sélections nationales (football) : noms affichés en français.
const NATIONS_FR={'Italy':'Italie','Türkiye':'Turquie','Turkey':'Turquie','Germany':'Allemagne','Spain':'Espagne','England':'Angleterre','Belgium':'Belgique','Netherlands':'Pays-Bas','Croatia':'Croatie','Switzerland':'Suisse','Denmark':'Danemark','Poland':'Pologne','Austria':'Autriche','Scotland':'Écosse','Wales':'Pays de Galles','Ireland':'Irlande','Republic of Ireland':'Irlande','Northern Ireland':'Irlande du Nord','Sweden':'Suède','Norway':'Norvège','Greece':'Grèce','Hungary':'Hongrie','Czechia':'Tchéquie','Czech Republic':'Tchéquie','Serbia':'Serbie','Slovakia':'Slovaquie','Slovenia':'Slovénie','Romania':'Roumanie','Iceland':'Islande','Finland':'Finlande','Israel':'Israël','Morocco':'Maroc','Brazil':'Brésil','Argentina':'Argentine','United States':'États-Unis','USA':'États-Unis','Mexico':'Mexique','Japan':'Japon','South Korea':'Corée du Sud','Senegal':'Sénégal','Algeria':'Algérie','Tunisia':'Tunisie','Cameroon':'Cameroun','Ivory Coast':'Côte d’Ivoire','Egypt':'Égypte','Colombia':'Colombie','Chile':'Chili','Australia':'Australie','Canada':'Canada','Ukraine':'Ukraine','Azerbaijan':'Azerbaïdjan','Luxembourg':'Luxembourg','Gibraltar':'Gibraltar','Albania':'Albanie','Georgia':'Géorgie','Kazakhstan':'Kazakhstan','Bosnia and Herzegovina':'Bosnie-Herzégovine','North Macedonia':'Macédoine du Nord','Montenegro':'Monténégro','Bulgaria':'Bulgarie'};
const nationName=(league,name)=>/^soccer\/(?:fifa\.|uefa\.nations|uefa\.euro)/.test(league.url)?(NATIONS_FR[name]||name):name;
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
    result.push({id:'espn-'+event.id,home:nationName(league,espnName(home)),away:nationName(league,espnName(away)),
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
      espnNote:String(c.notes?.find(n=>n?.type==='event')?.text||c.notes?.[0]?.text||''),venueName:String(c.venue?.fullName||''),timeUnknown:c.timeValid===false&&!started,
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
function newsHtml(){return renderNewsView({news:[...news,...jeuSetMathsPosts],loading,hasWorker:!!workerUrl,photos:photoMap,esc,safeUrl,now:new Date(),selectedSources:newsSelectedSources,showAllRelated:newsShowAll,readKeys:new Set(Object.keys(readArticles)),readView:newsReadView,keepVisible:newsKeep,tweets:tweetMedia,matches:agendaItems().filter(i=>i.finished||i.live).map(i=>({title:i.title,date:i.date,favorites:i.favorites})),favorites});}
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
 const items=makeAgenda({
  teams:matches,individuals:individualResults,history:historyResults,
  verified:[...favorites.flatMap(f=>verified2026For(f.name)),...verified.past,...extra.past,...(verified.pending||[]),...(extra.pending||[])],
  expanded:[...expanded,...verified.future,...extra.future]
 });
 // Joueur de football suivi : ajouté aux matchs où la feuille ESPN confirme
 // qu'il a joué ; un rattachement non confirmé n'apparaît que sur sa fiche.
 for(const item of items){
  const played=Object.entries(eventMedia.get(item.key)?.appearances||{});
  for(const [name,a] of played){
   if(a.played&&favorites.some(f=>f.name===name)&&!item.favorites.includes(name))item.favorites=[...item.favorites,name];
   if(item.uncertainNames?.includes(name)){
    item.uncertainNames=item.uncertainNames.filter(n=>n!==name);
    if(!a.played)item.favorites=item.favorites.filter(n=>n!==name);
   }
  }
  if(item.uncertainNames?.length&&!(active==='favori'&&item.uncertainNames.includes(agendaFavorite)))
   item.favorites=item.favorites.filter(n=>!item.uncertainNames.includes(n)||n===item.favorite);
 }
 return items.filter(item=>item.favorites.length);
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
  mediaFor:item=>{const media=eventMedia.get(item.key)||{};return {...media,facts:[...localFacts(item),...(media.facts||[])]};}
 });
}
// Faits disponibles sans appel réseau (tennis : têtes de série, pays, lieu).
function localFacts(item){
 const origin=item.origin||{},facts=[];
 const m=String(origin.espnNote||'').match(/^(?:\((\d+)\)\s*)?(.+?)\s*\(([A-Z]{3})\)\s+bt\s+(?:\((\d+)\)\s*)?(.+?)\s*\(([A-Z]{3})\)\s+(.+)$/);
 if(m){
  const side=(seed,name,country)=>name+' ('+(seed?'tête de série n°'+seed+', ':'')+country+')';
  facts.push({label:'Résultat',text:side(m[1],m[2],m[3])+' bat '+side(m[4],m[5],m[6])+' '+m[7]});
 }
 if(origin.venueName)facts.push({label:'Lieu',text:origin.venueName});
 return facts;
}
// Infos de match (essentiel, compte rendu, vidéo) : chargées en arrière-plan,
// affichées au fur et à mesure et mémorisées 10 jours sur l'appareil pour
// réapparaître immédiatement à l'ouverture suivante.
const MEDIA_KEY='monsport-media-v2',MEDIA_TTL=10*86400000;
(()=>{try{
 const saved=JSON.parse(localStorage.getItem(MEDIA_KEY)||'{}'),now=Date.now();
 for(const [key,entry] of Object.entries(saved))if(entry&&now-entry.saved<MEDIA_TTL)eventMedia.set(key,entry);
}catch{}})();
let mediaSaveTimer=null;
function saveEventMedia(){
 clearTimeout(mediaSaveTimer);
 mediaSaveTimer=setTimeout(()=>{try{localStorage.setItem(MEDIA_KEY,JSON.stringify(Object.fromEntries([...eventMedia].slice(-60))));}catch{}},400);
}
// Un match sans vidéo ou sans compte rendu est réessayé (toutes les 2 h le
// premier jour, puis toutes les 12 h) : les résumés paraissent souvent plus tard.
function mediaIsStale(item,media){
 if(!media)return true;
 const complete=(media.videos||[]).some(v=>v.src)||media.youtube?.id;
 const hasText=!hasEspnSheet(item)||media.recap||(media.facts||[]).length;
 if(complete&&hasText)return false;
 const age=Date.now()-(media.saved||0),sinceMatch=Date.now()-Date.parse(item.date);
 return age>(sinceMatch<36*3600000?2:12)*3600000;
}
const trackedFootballers=()=>favorites.filter(f=>f.type==='sportif'&&f.sport==='Football').map(f=>f.name);
let mediaLoading=false;
async function prefetchEventMedia(){
 if(mediaLoading||!navigator.onLine)return;
 const since=Date.now()-8*86400000;
 const todo=agendaItems().filter(item=>item.finished&&!item.pendingResult&&!item.isCompetition&&Date.parse(item.date)>=since
  &&mediaIsStale(item,eventMedia.get(item.key))).slice(0,24);
 if(!todo.length)return;
 mediaLoading=true;
 let lastPaint=0;
 const paint=()=>{if(Date.now()-lastPaint>1500&&(active==='semaine'||active==='favori')){lastPaint=Date.now();softRender();}};
 const one=async item=>{
  const previous=eventMedia.get(item.key);
  const media={saved:Date.now(),recap:previous?.recap||null,videos:previous?.videos||[],youtube:previous?.youtube||null,external:previous?.external||null,facts:previous?.facts||[],appearances:previous?.appearances||{},eventId:String(item.origin?.espnEventId||'')};
  if(hasEspnSheet(item)){
   try{
    const details=await loadEventDetails(item,{athletes:trackedFootballers()});
    if(details.article)media.recap=details.article;
    if(details.videos?.length)media.videos=details.videos;
    if(details.facts?.length)media.facts=details.facts;
    if(details.appearances)media.appearances=details.appearances;
   }catch{}
   eventMedia.set(item.key,media);paint();
  }
  const sides=String(item.title||'').split(/\s+[—–-]\s+/).map(x=>x.trim()).filter(Boolean);
  if(!media.videos.some(v=>v.src)&&workerUrl&&sides.length===2){
   const tennis=/tennis/i.test(String(item.type||'')+' '+String(item.origin?.leaguePath||''))&&!/table/i.test(String(item.type||''));
   try{const data=await request('/api/highlight',{q:sides.join(' ')+(tennis?' highlights':' résumé'),teams:sides.join('|'),c:String(item.competition||'').split(' · ')[0].slice(0,60)});if(data.video)media.youtube=data.video;media.external=data.video?null:(data.external||null);}catch{}
  }
  eventMedia.set(item.key,media);saveEventMedia();paint();
 };
 try{
  // Les plus récents d'abord, 5 à la fois.
  const queue=todo.sort((x,y)=>Date.parse(y.date)-Date.parse(x.date));
  await Promise.all(Array.from({length:5},async()=>{while(queue.length)await one(queue.shift());}));
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
    getTennisMatches,espnName,espnScore,nationName
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
  active=el.dataset.tab;search='';sportFilter='Tous';newsKeep.clear();render();
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
 bindReadState();
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>{applyTheme(b.dataset.themeChoice);render();});
 document.querySelectorAll('[data-read-article]').forEach(button=>button.onclick=async()=>{
  const link=button.dataset.readArticle,slot=document.querySelector('[data-article-content="'+CSS.escape(link)+'"]');
  if(!slot)return;
  const key=button.closest('[data-article-key]')?.dataset.articleKey;
  if(key&&newsReadView!=='read'&&!readArticles[key]){newsKeep.add(key);setRead(key,true);}
  if(button.dataset.localText==='1')slot.dataset.loaded='1';
  if(slot.dataset.loaded==='1'){slot.hidden=!slot.hidden;button.textContent=slot.hidden?'Lire dans Mon Sport':'Masquer le texte';if(!slot.hidden)hydrateTweets(slot);return;}
  if(!workerUrl){slot.hidden=false;slot.innerHTML='<p class="news-reader-note">Configure le Worker Cloudflare dans Réglages pour lire les articles ici.</p>';return;}
  button.disabled=true;button.textContent='Chargement…';slot.hidden=false;slot.innerHTML='<p class="news-reader-note">Récupération du contenu public…</p>';
  try{
   const data=await request('/api/article',{url:link});
   const body=data.blocks?.length?renderBlocks(data.blocks,esc,tweetMedia):renderArticleBody(data.text,esc);
   slot.innerHTML=body?body+(data.truncated?'<p class="news-reader-note">Texte tronqué : la suite est disponible chez l’éditeur.</p>':''):'<p class="news-reader-note">Le contenu intégral n’est pas publiquement accessible. Tu peux consulter la source originale.</p>';
   slot.dataset.loaded='1';button.textContent='Masquer le texte';hydrateTweets(slot);
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
return `<section class="panel"><h2>⚙️ Paramétrage des données</h2><p>Le relais Cloudflare fournit les articles (FFL complet, médias, images), les résumés vidéo et le rugby en direct. Il est configuré par défaut ; laisse le champ vide pour l'utiliser.</p><form id="settingsform"><input id="workerUrl" style="grid-column:1/-1" type="url" placeholder="${esc(DEFAULT_WORKER_URL)}" value="${esc(workerUrl===DEFAULT_WORKER_URL?'':workerUrl)}"/><button class="button" type="submit">Enregistrer et actualiser</button></form>${relayDiagnostic()}<p class="sub">Adresse https uniquement. Aucune donnée personnelle n'est envoyée à notre serveur : seules les recherches sur tes favoris sont transmises aux services sportifs et d'actualités.</p></section><section class="panel"><h2>📦 Exporter / importer mes favoris</h2><div class="actions"><button id="export" class="button ghost">Exporter JSON</button><label class="button ghost" style="cursor:pointer">Importer JSON <input id="import" type="file" accept="application/json" hidden/></label><button id="reset" class="button ghost danger">Réinitialiser</button></div><p class="sub">Tes favoris sont stockés uniquement dans ce navigateur. Un export permet de les sauvegarder.</p></section><section class="panel"><h2>🎨 Apparence</h2><p class="sub">Thème de l’application sur cet appareil.</p><div class="theme-choice" role="group" aria-label="Thème"><button type="button" class="button ${currentTheme()==='light'?'':'ghost'}" data-theme-choice="light" aria-pressed="${currentTheme()==='light'}">☀️ Clair</button><button type="button" class="button ${currentTheme()==='dark'?'':'ghost'}" data-theme-choice="dark" aria-pressed="${currentTheme()==='dark'}">🌙 Sombre</button></div></section><section class="panel"><h2>🔄 Mises à jour</h2><p class="sub">Version ${APP_LABEL}. Vidéos vérifiées avant affichage, infos de match mémorisées, résultats de Mbappé, tri des articles affiné.</p><button type="button" class="button" id="checkUpdates">Vérifier et recharger</button><p class="sub" id="updateStatus" role="status"></p></section><section class="panel"><h2>🖼️ Photos et blasons</h2><p class="sub">Une image peut manquer si Wikimedia ou ESPN ne la propose pas. Relancer la recherche ne supprime aucun favori.</p><button type="button" class="button ghost" id="refreshPhotos">Rechercher les photos manquantes</button><p class="sub" id="photoStatus" role="status"></p></section>`}
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
// Photos et vidéos des tweets intégrés à un article, chargées à l'ouverture.
async function hydrateTweets(slot){
 const holders=[...slot.querySelectorAll('.news-tweet-media[data-tweet-id]:empty')];
 const ids=[...new Set(holders.map(h=>h.dataset.tweetId))].filter(id=>!tweetMedia.has(id)).slice(0,12);
 if(ids.length&&workerUrl){
  try{const data=await request('/api/tweets',{ids:ids.join(',')});for(const id of ids){const t=data.tweets?.[id];tweetMedia.set(id,{media:Array.isArray(t)?t:Array.isArray(t?.media)?t.media:[],name:t?.name||'',handle:t?.handle||''});}}catch{}
 }
 for(const holder of holders){
  const known=tweetMedia.get(holder.dataset.tweetId);
  if(known&&holder.isConnected)holder.outerHTML=renderBlocks(known.media,esc);
 }
}
// Image qui ne charge pas (anti-hotlink, réseau) : un second essai passe par
// le relais pour les hôtes connus ; sinon l'emplacement se replie proprement.
const PROXY_HOSTS=['static.fflose.com','fflose.com','pbs.twimg.com','i.ytimg.com'];
document.addEventListener('error',event=>{
 const image=event.target;
 if(!(image instanceof HTMLImageElement)||!image.matches('.article-thumb-image,.news-body-image,.result-hero-image'))return;
 let host='';try{host=new URL(image.currentSrc||image.src).hostname;}catch{}
 if(!image.dataset.retried&&workerUrl&&PROXY_HOSTS.includes(host)){
  image.dataset.retried='1';
  image.src=workerUrl+'/api/image?url='+encodeURIComponent(image.src);
  return;
 }
 if(image.matches('.article-thumb-image'))image.closest('.article-visual')?.classList.add('image-failed');
 else if(image.matches('.news-body-image'))image.closest('figure')?.remove();
 else image.closest('.result-hero')?.classList.add('no-image');
},true);
// État du relais après la dernière actualisation, affiché dans Réglages.
function relayDiagnostic(){
 const lines=['Version '+APP_VERSION,'Relais : '+(workerUrl===DEFAULT_WORKER_URL?'par défaut':workerUrl)];
 if(relayStatus){
  lines.push(relayStatus.articles?'Articles reçus du relais : '+relayStatus.articles:'⚠️ Aucun article reçu du relais à la dernière actualisation');
  lines.push('FFL : '+relayStatus.ffl+' article'+(relayStatus.ffl>1?'s':'')+' '+(relayStatus.fflSource==='relais'?'via le relais (texte complet, tweets, images)':relayStatus.fflSource==='direct'?'⚠️ en récupération directe (sans tweets ni images)':'— aucun'));
 }else lines.push('Actualisation en attente');
 return '<p class="sub relay-diagnostic" role="status">'+lines.map(esc).join('<br>')+'</p>';
}
window.addEventListener('message',event=>{
 if(!/^https:\/\/www\.youtube(?:-nocookie)?\.com$/.test(event.origin))return;
 let data;try{data=typeof event.data==='string'?JSON.parse(event.data):event.data;}catch{return;}
 if(data?.event!=='onError'&&!(data?.event==='infoDelivery'&&data.info?.error))return;
 for(const frame of document.querySelectorAll('iframe.result-youtube'))if(frame.contentWindow===event.source)frame.youtubeFailed?.();
});
// --- Thème clair (par défaut) ou sombre -------------------------------------
const THEME_KEY='monsport-theme-v1';
function currentTheme(){try{return localStorage.getItem(THEME_KEY)==='dark'?'dark':'light';}catch{return 'light';}}
function applyTheme(theme){
 try{localStorage.setItem(THEME_KEY,theme);}catch{}
 const link=document.getElementById('themeCss');
 if(link)link.href=(theme==='dark'?'./style.css':'./style-light.css')+'?v='+APP_VERSION;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101e36':'#eef3f7');
}
// --- Articles lus / à lire ---------------------------------------------------
function moveArticle(wrapper,toRead){
 const key=wrapper?.dataset.articleKey;if(!key)return;
 setRead(key,toRead);newsKeep.delete(key);
 wrapper.classList.add('news-swipe-out');
 setTimeout(()=>render(),220);
}
function bindReadState(){
 document.querySelectorAll('[data-news-view]').forEach(b=>b.onclick=()=>{newsReadView=b.dataset.newsView;newsKeep.clear();newsSelectedSources=[];render();window.scrollTo({top:0});});
 const all=document.querySelector('#newsMarkAll');
 if(all)all.onclick=()=>{
  const keys=[...document.querySelectorAll('.news-swipe[data-article-key]')].map(w=>w.dataset.articleKey);
  if(!keys.length||!confirm('Marquer '+keys.length+' article'+(keys.length>1?'s':'')+' comme lu'+(keys.length>1?'s':'')+' ?'))return;
  keys.forEach(k=>{readArticles[k]=Date.now();newsKeep.delete(k);});saveRead();render();
 };
 document.querySelectorAll('[data-mark-read]').forEach(b=>b.onclick=e=>{e.stopPropagation();moveArticle(b.closest('.news-swipe'),newsReadView!=='read');});
 document.querySelectorAll('.news-swipe a.news-tap,.news-swipe .jsm-native-footer a').forEach(a=>a.addEventListener('click',()=>{
  const key=a.closest('.news-swipe')?.dataset.articleKey;
  if(key&&newsReadView!=='read'){newsKeep.add(key);setRead(key,true);}
 }));
 document.querySelectorAll('.news-swipe').forEach(bindSwipe);
}
// Glissement vers la gauche (doigt ou souris) : au-delà de 35 % de la largeur
// ou d'un geste rapide, l'article change de catégorie. Le défilement vertical
// reste libre (touch-action: pan-y).
function bindSwipe(wrapper){
 const card=wrapper.querySelector('.news-card');if(!card)return;
 let startX=0,startY=0,dx=0,tracking=false,decided=false,horizontal=false,startT=0;
 wrapper.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(e.target.closest('a,button,video,iframe,input,select'))return;
  tracking=true;decided=false;horizontal=false;dx=0;startX=e.clientX;startY=e.clientY;startT=Date.now();
 });
 wrapper.addEventListener('pointermove',e=>{
  if(!tracking)return;
  const mx=e.clientX-startX,my=e.clientY-startY;
  if(!decided&&(Math.abs(mx)>8||Math.abs(my)>8)){decided=true;horizontal=Math.abs(mx)>Math.abs(my)*1.2&&mx<0;if(horizontal){wrapper.setPointerCapture?.(e.pointerId);wrapper.classList.add('swiping');}}
  if(!horizontal)return;
  dx=Math.min(0,mx);card.style.transform='translateX('+dx+'px)';
  wrapper.style.setProperty('--swipe',Math.min(1,-dx/(wrapper.offsetWidth*.35)).toFixed(2));
 });
 const end=()=>{
  if(!tracking)return;tracking=false;
  if(!horizontal)return;
  wrapper.classList.remove('swiping');
  const fast=-dx/(Date.now()-startT)>0.6&&dx<-40;
  if(dx<-wrapper.offsetWidth*.35||fast){card.style.transform='translateX(-110%)';moveArticle(wrapper,newsReadView!=='read');}
  else{card.style.transform='';wrapper.style.removeProperty('--swipe');}
 };
 wrapper.addEventListener('pointerup',end);wrapper.addEventListener('pointercancel',end);
 // Un glissement ne doit pas déclencher de clic sur la carte.
 wrapper.addEventListener('click',e=>{if(horizontal&&Math.abs(dx)>8){e.preventDefault();e.stopPropagation();}},true);
}
function bindContent(){
 // Chaque carte développe son résumé local ; la feuille ESPN détaillée
 // n'est téléchargée qu'au moment du premier clic.
 document.querySelectorAll('[data-event-detail]').forEach(card=>{
  card.addEventListener('toggle',async()=>{
   if(!card.open){softRenderIfPending();return;}
   if(card.dataset.detailLoaded==='1')return;
   card.dataset.detailLoaded='1';
   const item=agendaItems().find(x=>x.key===card.dataset.eventDetail);
   const slot=card.querySelector('.detail-live-slot');
   if(!item||!slot)return;
   slot.textContent='Chargement…';
   try{
    const details=await loadEventDetails(item);
    if(card.isConnected&&card.open){
     const near=findMatchArticles(item,news);
     const reports=near.length?'<div class="event-editorial">'
       +near.map(n=>'<a href="'+esc(safeUrl(n.link))+'" target="_blank" rel="noopener noreferrer">'+esc(n.title)+' · '+esc(n.source||'Éditeur')+' ↗</a>').join('')+'</div>':'';
     slot.innerHTML=renderEventDetails(details,esc)+reports;
    }
   }catch(e){
    if(card.isConnected)slot.textContent='Données détaillées indisponibles : '+String(e.message||e);
   }
  });
 });
 document.querySelectorAll('[data-stop]').forEach(el=>el.addEventListener('click',event=>event.stopPropagation()));
 // Résumé vidéo : lancé depuis la grande photo (qui laisse place au lecteur)
 // ou depuis le bouton ; un second appui ou « Fermer » revient à l'état initial.
 const showPlayer=(button,player)=>{
  const hero=button.closest('.result-hero'),slot=button.parentElement.querySelector('.result-video-slot');
  if(!slot)return;
  const close=()=>{slot.replaceChildren();hero?.classList.remove('playing');if(!hero)button.textContent='▶ Résumé vidéo';softRenderIfPending();};
  if(slot.firstChild){close();return;}
  const shut=document.createElement('button');
  shut.type='button';shut.className='result-video-close';shut.textContent='✕ Fermer la vidéo';
  shut.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close();});
  player.addEventListener('click',e=>e.stopPropagation());
  slot.replaceChildren(player,...(hero?[shut]:[]));
  if(hero)hero.classList.add('playing');else button.textContent='✕ Fermer la vidéo';
 };
 document.querySelectorAll('[data-play-video]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  const video=document.createElement('video');
  video.className='result-video';video.controls=true;video.playsInline=true;video.preload='metadata';
  if(button.dataset.poster)video.poster=button.dataset.poster;
  video.src=button.dataset.playVideo;
  video.addEventListener('error',()=>{
   const page=button.dataset.videoPage,slot=button.parentElement.querySelector('.result-video-slot');
   if(slot)slot.innerHTML=page&&page!=='#'?'<a class="result-replay ghost" href="'+esc(page)+'" target="_blank" rel="noopener noreferrer">▶ Ouvrir la vidéo sur ESPN ↗</a>':'<p class="news-reader-note">Vidéo indisponible sur cet appareil.</p>';
  },{once:true});
  showPlayer(button,video);
  video.play?.().catch(()=>{});
 }));
 document.querySelectorAll('[data-toggle-recap]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  const full=button.closest('.result-recap')?.querySelector('.result-recap-full');
  if(!full)return;
  full.hidden=!full.hidden;
  button.querySelector('span').textContent=full.hidden?'Lire le compte rendu complet (en anglais)':'Masquer le compte rendu';
 }));
 document.querySelectorAll('[data-youtube-id]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  // Vidéo principale puis vidéos de remplacement : si YouTube signale une
  // erreur de lecture (vidéo retirée, intégration refusée), on passe à la suivante.
  const ids=[button.dataset.youtubeId,...String(button.dataset.youtubeAlt||'').split(',')].filter(id=>/^[\w-]{6,20}$/.test(id));
  if(!ids.length)return;
  const frame=document.createElement('iframe');
  frame.className='result-youtube';
  frame.title='Résumé vidéo';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
  // YouTube exige un référent pour les vidéos intégrées (la page est en no-referrer).
  frame.referrerPolicy='strict-origin-when-cross-origin';
  let index=0;
  const load=()=>{frame.dataset.videoId=ids[index];frame.src='https://www.youtube-nocookie.com/embed/'+ids[index]+'?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin='+encodeURIComponent(location.origin);};
  frame.addEventListener('load',()=>{try{frame.contentWindow.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'https://www.youtube-nocookie.com');}catch{}});
  frame.youtubeFailed=()=>{
   if(++index<ids.length){load();return;}
   const slot=frame.parentElement;
   if(slot)slot.innerHTML='<p class="news-reader-note result-video-error">Cette vidéo ne peut pas être lue ici. <a href="https://www.youtube.com/watch?v='+esc(ids[0])+'" target="_blank" rel="noopener noreferrer">Ouvrir sur YouTube ↗</a></p>';
  };
  load();
  showPlayer(button,frame);
 }));
 // Image d'article indisponible : afficher uniquement le pictogramme sportif.
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
 const auditChoice=document.querySelector('#auditChoice');if(auditChoice)auditChoice.onchange=()=>{auditSelected=auditChoice.value;render()};const auditButton=document.querySelector('#auditRun');if(auditButton)auditButton.onclick=runYearAudit;const sinnerButton=document.querySelector('#goSinnerHistory');if(sinnerButton)sinnerButton.onclick=()=>{active='resultats';historyFilter=favorites.find(f=>f.sport==='Tennis'&&/sinner/i.test(f.name))?.name||'Tous';historyYear='2026';historyAll=true;refreshHistory();document.querySelector('#historyFilter')?.scrollIntoView({behavior:'smooth'});};const ys=document.querySelector('#historyYear');if(ys)ys.onchange=()=>{historyYear=ys.value;historyAll=false;refreshHistory()};const go=document.querySelector('#goKouameHistory');if(go)go.onclick=()=>{active='resultats';historyFilter=favorites.find(f=>f.sport==='Tennis'&&/kouam/i.test(f.name))?.name||'Tous';historyYear='2026';historyAll=true;refreshHistory();document.querySelector('#historyFilter')?.scrollIntoView({behavior:'smooth'});};const hFilter=document.querySelector('#historyFilter');if(hFilter)hFilter.onchange=()=>{historyFilter=hFilter.value;historyAll=false;render()};const hToggle=document.querySelector('#historyToggle');if(hToggle)hToggle.onclick=()=>{historyAll=!historyAll;render()};const updateButton=document.querySelector('#checkUpdates');if(updateButton)updateButton.onclick=forceUpdate;const photoButton=document.querySelector('#refreshPhotos');if(photoButton)photoButton.onclick=async()=>{photoButton.disabled=true;const status=document.querySelector('#photoStatus');if(status)status.textContent='Recherche des portraits…';try{await reloadPhotos(true);}catch(e){if(status)status.textContent='Recherche indisponible : '+String(e.message||e);}finally{if(photoButton.isConnected)photoButton.disabled=false;}};document.querySelectorAll('[data-goto]').forEach(e=>e.onclick=()=>{active=e.dataset.goto;render()});document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()});const add=document.querySelector('#addform');if(add)add.onsubmit=e=>{e.preventDefault();const data=new FormData(add),name=String(data.get('name')).trim();if(!name)return;favorites.push({id:crypto.randomUUID(),name,sport:data.get('sport'),type:data.get('type'),apiName:String(data.get('apiName')).trim()||name});save();render()};const sf=document.querySelector('#sportFilter');if(sf)sf.onchange=()=>{sportFilter=sf.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const input=document.querySelector('#search');if(input)input.oninput=()=>{search=input.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const settings=document.querySelector('#settingsform');if(settings)settings.onsubmit=e=>{e.preventDefault();const val=document.querySelector('#workerUrl').value.trim().replace(/\/$/,'');if(val&&!/^https:\/\/[^\s]+$/.test(val)){alert('Une URL HTTPS valide est nécessaire.');return}workerUrl=val||DEFAULT_WORKER_URL;try{if(val)localStorage.setItem(URL_KEY,val);else localStorage.removeItem(URL_KEY);}catch{}active='semaine';news=[];matches=[];individualResults=[];render();refresh()};const ex=document.querySelector('#export');if(ex)ex.onclick=()=>{const blob=new Blob([JSON.stringify(favorites,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mes-favoris-sport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};const imp=document.querySelector('#import');if(imp)imp.onchange=async()=>{try{const data=JSON.parse(await imp.files[0].text());if(!Array.isArray(data)||data.some(f=>typeof f.name!=='string'||typeof f.sport!=='string'||!['équipe','sportif'].includes(f.type)))throw Error('Format invalide');favorites=data.slice(0,200).map(f=>({id:crypto.randomUUID(),name:f.name.slice(0,100),sport:f.sport.slice(0,50),type:f.type,apiName:String(f.apiName||f.name).slice(0,100)}));save();render()}catch(e){alert('Import impossible : '+e.message)}};const reset=document.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('Réinitialiser tous les favoris ?')){favorites=DEFAULTS.map(f=>({...f,id:crypto.randomUUID()}));save();render()}}}
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

// Rugby international (Championnat des Nations, tests…) : World Rugby via le
// relais, score en direct. ESPN ne couvre pas ces compétitions.
const RUGBY_FR={'South Africa':'Afrique du Sud','New Zealand':'Nouvelle-Zélande','Australia':'Australie','Argentina':'Argentine','Ireland':'Irlande','England':'Angleterre','Scotland':'Écosse','Wales':'Pays de Galles','Italy':'Italie','Fiji':'Fidji','Japan':'Japon','Georgia':'Géorgie','USA':'États-Unis','Spain':'Espagne','Portugal':'Portugal','Uruguay':'Uruguay','Chile':'Chili','Romania':'Roumanie','Canada':'Canada','Samoa':'Samoa','Tonga':'Tonga'};
async function rugbyResults(){
 const fav=favorites.find(f=>f.name==='XV de France');
 if(!fav||!workerUrl)return {events:[],notes:[]};
 const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Paris'});
 try{
  const data=await request('/api/rugby-live',{date:today});
  const events=(data.matches||[]).filter(m=>m.teams.some(t=>t.name==='France')&&!/women|féminin|u20|sevens|7s/i.test(m.competition)).map(m=>{
   const [home,away]=m.teams.map(t=>RUGBY_FR[t.name]||t.name);
   const status=/^C/.test(m.status)?'Terminé':/^(L|HT)/.test(m.status)?'En cours':'À venir';
   const started=status!=='À venir';
   return {id:'wr-'+m.id,home,away,homeScore:started?String(m.scores[0]??''):null,awayScore:started?String(m.scores[1]??''):null,
    date:m.start,status,favorite:fav.name,competition:String(m.competition).replace(/Nations Championship/,'Championnat des Nations'),
    round:status==='En cours'&&m.clock&&m.clock!=='00:00'?String(m.clock):'',source:'World Rugby (direct)',sourceUrl:'https://www.world.rugby/fixtures'};
  });
  return {events,notes:[]};
 }catch(e){return {events:[],notes:['Rugby international en direct indisponible : '+String(e.message||e)]};}
}
async function refresh(){
 if(loading)return;
 if(!navigator.onLine){errors=['Hors connexion : les dernières données disponibles restent affichées.'];render();return;}
 loading=true;errors=[];softRender();
 try{
  // Google Actualités refuse les requêtes du relais Cloudflare (HTTP 503) :
  // les médias passent par /api/sports-news, FFL directement ou par le relais.
  const [espn,tennis,extraNews,fflNews,rugby]=await Promise.all([
   espnResults(),
   tennisResults(),
   fetchSportsNews(favorites,new Date(),workerUrl).catch(()=>[]),
   fetchFFLNews().catch(()=>[]),
   rugbyResults(),
  ]);
  scoreNotes=[...espn.notes,...rugby.notes];individualNotes=[];
  const seen=new Set();
  matches=[...espn.events,...rugby.events].filter(m=>m.home&&m.away).filter(m=>{
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
  const relayHasFfl=extraNews.some(a=>a.source==='FFL');
  relayStatus={articles:extraNews.filter(a=>a.source!=='ESPN').length,ffl:relayHasFfl?extraNews.filter(a=>a.source==='FFL').length:fflNews.length,fflSource:relayHasFfl?'relais':fflNews.length?'direct':'aucun'};
  news=newsLastWeek([...extraNews,...(relayHasFfl?[]:fflNews)],new Date());
  if(!workerUrl&&!news.length&&!jeuSetMathsPosts.length)errors.push('Aucun article reçu de FFL, ESPN ou Jeu, set et maths. Le relais Cloudflare est facultatif.');
  else if(!news.length&&!jeuSetMathsPosts.length)errors.push('Aucune actualité reçue du relais.');
  if(!matches.length&&!scoreNotes.length)scoreNotes.push('Aucune rencontre disponible pour PSG, Real Madrid ou Spurs sur la période consultée.');
  lastUpdated=Date.now();writeSnapshot();
  prefetchEventMedia().catch(()=>{});
 }catch(e){errors.push('Actualisation impossible : '+String(e.message||e));}
 finally{loading=false;softRender();scheduleLiveRefresh();}
}
// Match d'un favori en cours : nouvelle actualisation dans 60 s, tant que
// l'appli est visible. Aucun rechargement en dehors des matchs en direct.
let liveTimer=null;
function scheduleLiveRefresh(){
 clearTimeout(liveTimer);
 if(!agendaItems().some(item=>item.live))return;
 liveTimer=setTimeout(()=>{if(!document.hidden&&navigator.onLine)refresh();else scheduleLiveRefresh();},60000);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&agendaItems().some(item=>item.live))refresh();});
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
