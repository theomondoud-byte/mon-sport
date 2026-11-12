const DEFAULTS = [
 ['Real Madrid','Football','équipe','Real Madrid'],['PSG','Football','équipe','Paris Saint Germain'],['San Antonio Spurs','Basketball','équipe','San Antonio Spurs'],
 ['Victor Wembanyama','Basketball','sportif'],['Léon Marchand','Natation','sportif'],['Félix Lebrun','Tennis de table','sportif'],['Alexis Lebrun','Tennis de table','sportif'],['Flavien Coton','Tennis de table','sportif'],['Paul Seixas','Cyclisme','sportif'],['Kylian Mbappé','Football','sportif'],['Équipe de France de football','Football','équipe','France'],['XV de France','Rugby','équipe','France Rugby'],['Arthur Fils','Tennis','sportif'],['Jannik Sinner','Tennis','sportif'],['Carlos Alcaraz','Tennis','sportif'],['Rafael Jódar','Tennis','sportif'],['Moïse Kouamé','Tennis','sportif'],['Mirra Andreeva','Tennis','sportif']
].map(([name,sport,type,apiName])=>({id:crypto.randomUUID(),name,sport,type,apiName:apiName||name}));
const KEY='monsport-favorites-v1', URL_KEY='monsport-worker-url-v1';
const load=()=>{try{let a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a:DEFAULTS}catch{return DEFAULTS}};
let favorites=load(), workerUrl=localStorage.getItem(URL_KEY)||'',active='accueil',sportFilter='Tous',search='',loading=false,news=[],matches=[],individualResults=[],individualNotes=[],errors=[],scoreNotes=[];
const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
const save=()=>localStorage.setItem(KEY,JSON.stringify(favorites));
const date=s=>{if(!s)return '';const d=new Date(s);return Number.isNaN(d.valueOf())?s:d.toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})};
const filtered=()=>favorites.filter(f=>(sportFilter==='Tous'||f.sport===sportFilter)&&f.name.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));
const tabs=[['accueil','🏠 Accueil'],['resultats','🏆 Résultats'],['actualites','📰 Actualités'],['favoris','⭐ Favoris'],['parametres','⚙️ Réglages']];
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
 {url:'soccer/esp.1',name:'LaLiga',teams:[['Real Madrid',/\breal madrid\b/i]]},
 {url:'soccer/fra.1',name:'Ligue 1',teams:[['PSG',/\b(paris saint[ -]?germain|paris sg|psg)\b/i]]},
 {url:'basketball/nba',name:'NBA',teams:[['San Antonio Spurs',/\bsan antonio spurs\b/i]]}
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
 const start=new Date(now.getTime()-10*DAY_MS),end=new Date(now.getTime()+14*DAY_MS);
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
     date:event.date||c.date,status:completed?'Terminé':(started?'En cours':'À venir'),favorite,source:'ESPN ('+league.name+')'});
    count++;
   }
  }
  if(!count){
   notes.push(issues.length
    ?'ESPN '+league.name+' : données indisponibles ('+issues.join(' ; ')+').'
    :'Aucun match de tes favoris en '+league.name+' sur les 10 derniers et 14 prochains jours.');
  }else if(issues.length){notes.push(league.name+' : couverture partielle, certains mois indisponibles.');}
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
     const key=[league,c.id||c.uid||names.join(':'),favorite.name].join('|');
     if(seen.has(key))continue;seen.add(key);
     items.push({id:key,type:'tennis',favorite:favorite.name,sport:'Tennis',date:matchDate,
      title:`${names[0]} — ${names[1]}`,competition:tournament.name||'Tennis',round,
      score:score||(completed?'Score par set indisponible':started?'Match en cours':'Match à venir'),
      status:statusText,source:`ESPN ${league.toUpperCase()}`});
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
    stats,source:'ESPN NBA'});
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

function newsHtml(){if(!workerUrl)return `<div class="notice">Configure le relais gratuit Cloudflare Worker dans Réglages pour obtenir les titres directement dans l'application. En attendant, les liens Google Actualités ci-dessous fonctionnent.</div>`;if(loading&&!news.length)return '<p class="muted">Chargement des articles…</p>';return news.length?news.map(n=>`<article class="card"><span class="tag">${esc(n.favorite)}</span><h3><a href="${esc(safeUrl(n.link))}" rel="noopener noreferrer" target="_blank">${esc(n.title)}</a></h3><small>${esc(n.source)} • ${esc(date(n.date))}</small></article>`).join(''):'<p class="muted">Aucun article récupéré pour le moment. Essaie de rafraîchir ou d’utiliser les recherches directes.</p>'}
function linkHtml(f){const q=encodeURIComponent(f.name);return `<div class="fav"><div class="details"><b>${esc(f.name)}</b><br><small>${esc(f.sport)} · ${esc(f.type)}</small></div><a target="_blank" rel="noopener noreferrer" href="https://news.google.com/search?q=${q}&hl=fr&gl=FR&ceid=FR%3Afr">Actualités ↗</a></div>`}
function render(){let sports=['Tous',...new Set(favorites.map(f=>f.sport))];app.innerHTML=`<main class="wrap"><header><div><div class="eyebrow">Ton tableau de bord personnel</div><h1>⚡ Mon Sport</h1></div><button id="refresh" class="button" ${loading?'disabled':''}>${loading?'Actualisation…':'↻ Actualiser'}</button></header><section class="hero"><h2>Bienvenue dans ton espace sportif 👋</h2><p>Retrouve tes équipes, tes sportifs, leurs résultats disponibles et l'actualité gratuite — au même endroit.</p><div class="stats"><div class="stat"><strong>${favorites.length}</strong><small>Favoris</small></div><div class="stat"><strong>${new Set(favorites.map(f=>f.sport)).size}</strong><small>Sports</small></div><div class="stat"><strong>${matches.length + individualResults.length}</strong><small>Événements</small></div></div></section><nav class="tabs">${tabs.map(([id,label])=>`<button data-tab="${id}" class="${id===active?'active':''}">${label}</button>`).join('')}</nav><div id="content">${content()}</div><footer class="muted" style="text-align:center;margin:26px 0;font-size:.8rem">Mon Sport • V4.1 • Mise à jour automatique • Scores non exhaustifs • Articles provenant de sources externes</footer></main>`;document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{active=el.dataset.tab;search='';sportFilter='Tous';render()});document.querySelector('#refresh').onclick=refresh;bindContent()}
function content(){if(active==='accueil')return `<section class="panel"><div class="row"><h2>🏆 Derniers résultats disponibles</h2><button class="button ghost" data-goto="resultats">Voir tout</button></div>${resultHtml()}</section><section class="panel"><div class="row"><h2>🎾🏀 Résultats individuels</h2><button class="button ghost" data-goto="resultats">Voir tout</button></div>${individualHtml(6)}</section><section class="panel"><div class="row"><h2>📰 Actualités récentes</h2><button class="button ghost" data-goto="actualites">Voir tout</button></div>${newsHtml()}</section><section class="panel"><h2>⭐ Accès rapide aux favoris</h2>${favorites.slice(0,6).map(linkHtml).join('')}</section>`;
if(active==='resultats')return `<section class="panel"><h2>🏆 Résultats et prochains matchs</h2><p class="sub">Scores ESPN pour le PSG (Ligue 1), le Real Madrid (LaLiga) et les Spurs (NBA). Les scores individuels de tennis et les statistiques NBA sont présentés plus bas. Données non officielles et non exhaustives.</p>${resultHtml()}</section><section class="panel"><h2>🎾 Tennis ATP / WTA et 🏀 statistiques NBA</h2><p class="sub">Matchs des sportifs suivis au tennis (21 derniers et 14 prochains jours) et statistiques de Victor Wembanyama sur les derniers matchs des Spurs. ESPN : source publique non officielle, couverture partielle.</p>${individualHtml()}</section><section class="panel"><h2>🔎 Rechercher un résultat sur le web</h2>${favorites.map(f=>`<div class="fav"><span class="details">${esc(f.name)}</span><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?q=${encodeURIComponent(f.name+' dernier résultat sportif')}">Voir ↗</a></div>`).join('')}</section>`;
if(active==='actualites')return `<section class="panel"><h2>📰 Articles liés à mes favoris</h2><p class="sub">Les liens vers les articles s'ouvrent chez leurs éditeurs. Certains médias peuvent afficher un paywall : la gratuité de chaque article n'est pas garantie.</p>${newsHtml()}</section><section class="panel"><h2>🔎 Rechercher directement dans Google Actualités</h2>${favorites.map(linkHtml).join('')}</section>`;
if(active==='favoris')return `<section class="panel"><h2>➕ Ajouter un favori</h2><form id="addform"><input name="name" placeholder="Nom de l'équipe ou du sportif" maxlength="100" required/><select name="sport">${['Football','Tennis','Rugby','Basketball','Cyclisme','Natation','Tennis de table','Autre'].map(s=>`<option>${s}</option>`).join('')}</select><select name="type"><option value="sportif">Sportif</option><option value="équipe">Équipe</option></select><input name="apiName" placeholder="Nom API (facultatif)" maxlength="100"/><button class="button" type="submit">Ajouter aux favoris</button></form></section><section class="panel"><h2>⭐ Mes favoris (${favorites.length})</h2><select id="sportFilter">${sports.map(s=>`<option ${sportFilter===s?'selected':''}>${esc(s)}</option>`).join('')}</select><input class="search" id="search" value="${esc(search)}" placeholder="Rechercher un favori"/><div id="favoriteList">${favoriteRows()}</div></section>`;
return `<section class="panel"><h2>⚙️ Paramétrage des données</h2><p>Renseigne l'URL publique de ton Cloudflare Worker pour activer les articles. Les scores ESPN (équipes et sportifs) sont récupérés directement depuis le téléphone ; ils ne nécessitent pas le Worker.</p><form id="settingsform"><input id="workerUrl" style="grid-column:1/-1" type="url" placeholder="https://mon-sport-api.nom.workers.dev" value="${esc(workerUrl)}"/><button class="button" type="submit">Enregistrer et actualiser</button></form><p class="sub">Adresse https uniquement. Aucune donnée personnelle n'est envoyée à notre serveur : seules les recherches sur tes favoris sont transmises aux services sportifs et d'actualités.</p></section><section class="panel"><h2>📦 Exporter / importer mes favoris</h2><div class="actions"><button id="export" class="button ghost">Exporter JSON</button><label class="button ghost" style="cursor:pointer">Importer JSON <input id="import" type="file" accept="application/json" hidden/></label><button id="reset" class="button ghost danger">Réinitialiser</button></div><p class="sub">Tes favoris sont stockés uniquement dans ce navigateur. Un export permet de les sauvegarder.</p></section><section class="panel"><h2>🔄 Mises à jour</h2><p class="sub">Version V4.1. Vérifie les nouvelles versions sans effacer tes favoris ou ton adresse Cloudflare.</p><button type="button" class="button" id="checkUpdates">Vérifier et recharger</button><p class="sub" id="updateStatus" role="status"></p></section>`}
function favoriteRows(){return filtered().map(f=>`<div class="fav"><div class="details"><b>${esc(f.name)}</b><br><small>${esc(f.sport)} · ${esc(f.type)}</small></div><button class="button ghost danger" data-remove="${esc(f.id)}" aria-label="Supprimer ${esc(f.name)}">✕</button></div>`).join('')||'<div class="empty">Aucun favori correspondant</div>'}
function bindContent(){const updateButton=document.querySelector('#checkUpdates');if(updateButton)updateButton.onclick=forceUpdate;document.querySelectorAll('[data-goto]').forEach(e=>e.onclick=()=>{active=e.dataset.goto;render()});document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()});const add=document.querySelector('#addform');if(add)add.onsubmit=e=>{e.preventDefault();const data=new FormData(add),name=String(data.get('name')).trim();if(!name)return;favorites.push({id:crypto.randomUUID(),name,sport:data.get('sport'),type:data.get('type'),apiName:String(data.get('apiName')).trim()||name});save();render()};const sf=document.querySelector('#sportFilter');if(sf)sf.onchange=()=>{sportFilter=sf.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const input=document.querySelector('#search');if(input)input.oninput=()=>{search=input.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const settings=document.querySelector('#settingsform');if(settings)settings.onsubmit=e=>{e.preventDefault();const val=document.querySelector('#workerUrl').value.trim().replace(/\/$/,'');if(val&&!/^https:\/\/[^\s]+$/.test(val)){alert('Une URL HTTPS valide est nécessaire.');return}workerUrl=val;localStorage.setItem(URL_KEY,workerUrl);active='accueil';news=[];matches=[];individualResults=[];render();refresh()};const ex=document.querySelector('#export');if(ex)ex.onclick=()=>{const blob=new Blob([JSON.stringify(favorites,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mes-favoris-sport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};const imp=document.querySelector('#import');if(imp)imp.onchange=async()=>{try{const data=JSON.parse(await imp.files[0].text());if(!Array.isArray(data)||data.some(f=>typeof f.name!=='string'||typeof f.sport!=='string'||!['équipe','sportif'].includes(f.type)))throw Error('Format invalide');favorites=data.slice(0,200).map(f=>({id:crypto.randomUUID(),name:f.name.slice(0,100),sport:f.sport.slice(0,50),type:f.type,apiName:String(f.apiName||f.name).slice(0,100)}));save();render()}catch(e){alert('Import impossible : '+e.message)}};const reset=document.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('Réinitialiser tous les favoris ?')){favorites=DEFAULTS.map(f=>({...f,id:crypto.randomUUID()}));save();render()}}}
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
function bindRemove(){document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()})}
async function request(path,params){const u=new URL(workerUrl+path);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));const response=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);return response.json()}
async function refresh(){
 if(loading)return;
 loading=true;errors=[];scoreNotes=[];individualNotes=[];render();
 try{
  const articles=workerUrl?favorites.slice(0,18):[];
  const [espn,tennis,newsGroups]=await Promise.all([
   espnResults(),
   tennisResults(),
   Promise.all(articles.map(async f=>{
    try{
     const data=await request('/api/news',{q:f.name+' '+f.sport});
     return (data.articles||[]).slice(0,2).map(a=>({...a,favorite:f.name}));
    }catch{return []}
   }))
  ]);
  scoreNotes.push(...espn.notes);
  const seen=new Set();
  matches=espn.events.filter(m=>m.home&&m.away).filter(m=>{
   const key=[m.favorite,m.id].join('|');
   if(seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,40);
  // Un échec d'une feuille de match NBA ne doit jamais bloquer les scores des clubs.
  const nba=await wembanyamaResults(matches);
  individualResults=[...tennis.events,...nba.events].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  individualNotes.push(...tennis.notes,...nba.notes);
  news=newsGroups.flat().filter(a=>a.title&&a.link).filter((a,i,array)=>array.findIndex(b=>b.link===a.link)===i).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,40);
  if(!workerUrl)errors.push('Configure le Worker dans Réglages pour afficher les actualités. Les scores ESPN restent consultables sans Worker.');
  else if(!news.length)errors.push('Aucune actualité reçue du relais.');
  if(!matches.length&&!scoreNotes.length)scoreNotes.push('Aucune rencontre disponible pour PSG, Real Madrid ou Spurs sur la période consultée.');
 }catch(e){errors.push('Actualisation impossible : '+String(e.message||e));}
 finally{loading=false;render();}
}
render();refresh();
if('serviceWorker' in navigator){
 let reloaded=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(!reloaded){reloaded=true;location.reload();}
 });
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{
  registration.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{
   if(!document.hidden)registration.update().catch(()=>{});
  });
 }).catch(()=>{});
}
