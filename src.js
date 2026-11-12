const DEFAULTS = [
 ['Real Madrid','Football','équipe','Real Madrid'],['PSG','Football','équipe','Paris Saint Germain'],['San Antonio Spurs','Basketball','équipe','San Antonio Spurs'],
 ['Victor Wembanyama','Basketball','sportif'],['Léon Marchand','Natation','sportif'],['Félix Lebrun','Tennis de table','sportif'],['Alexis Lebrun','Tennis de table','sportif'],['Flavien Coton','Tennis de table','sportif'],['Paul Seixas','Cyclisme','sportif'],['Kylian Mbappé','Football','sportif'],['Équipe de France de football','Football','équipe','France'],['XV de France','Rugby','équipe','France Rugby'],['Arthur Fils','Tennis','sportif'],['Jannik Sinner','Tennis','sportif'],['Carlos Alcaraz','Tennis','sportif'],['Rafael Jódar','Tennis','sportif'],['Moïse Kouamé','Tennis','sportif'],['Mirra Andreeva','Tennis','sportif']
].map(([name,sport,type,apiName])=>({id:crypto.randomUUID(),name,sport,type,apiName:apiName||name}));
const KEY='monsport-favorites-v1', URL_KEY='monsport-worker-url-v1';
const load=()=>{try{let a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a:DEFAULTS}catch{return DEFAULTS}};
let favorites=load(), workerUrl=localStorage.getItem(URL_KEY)||'',active='accueil',sportFilter='Tous',search='',loading=false,news=[],matches=[],errors=[],scoreNotes=[];
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
// ESPN fournit certains tableaux de résultats sans clé. Ce service non officiel peut évoluer.
// Appel direct du navigateur : les serveurs Cloudflare peuvent être bloqués par ESPN.
const ESPN_LEAGUES=[
 {url:'soccer/esp.1',name:'LaLiga',teams:[['Real Madrid',/^(real madrid|real madrid cf)$/i]]},
 {url:'soccer/fra.1',name:'Ligue 1',teams:[['PSG',/^(paris saint.germain|paris sg|psg)$/i]]},
 {url:'basketball/nba',name:'NBA',teams:[['San Antonio Spurs',/san antonio spurs/i]]}
];
function espnDate(d){return d.toISOString().slice(0,10).replaceAll('-','')}
function espnName(c){return c?.team?.displayName||c?.team?.name||''}
function espnScore(c){const s=c?.score;const n=typeof s==='object'?(s.displayValue??s.value):s;return n===undefined||n===null||n===''?null:String(n)}
async function espnResults(){
 const result=[],notes=[];
 const today=new Date(),start=new Date(today.getTime()-10*86400000),end=new Date(today.getTime()+14*86400000);
 const dates=espnDate(start)+'-'+espnDate(end);
 const targets=ESPN_LEAGUES.filter(l=>l.teams.some(t=>favorites.some(f=>f.name===t[0])));
 await Promise.all(targets.map(async league=>{
  try{
   const response=await fetch('https://site.api.espn.com/apis/site/v2/sports/'+league.url+'/scoreboard?dates='+dates+'&limit=200',{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const body=await response.json();let count=0;
   for(const event of (body.events||[])){
    const c=event.competitions?.[0];if(!c?.competitors?.length)continue;
    const home=c.competitors.find(x=>x.homeAway==='home')||c.competitors[0];
    const away=c.competitors.find(x=>x.homeAway==='away')||c.competitors[1];
    if(!away)continue;
    const names=[espnName(home),espnName(away)];
    for(const [favorite,regexp] of league.teams){
     if(!favorites.some(f=>f.name===favorite)||!names.some(n=>regexp.test(n)))continue;
     const completed=c.status?.type?.completed===true||event.status?.type?.completed===true;
     result.push({id:'espn-'+event.id,home:espnName(home),away:espnName(away),homeScore:espnScore(home),awayScore:espnScore(away),date:event.date||c.date,status:completed?'Terminé':(c.status?.type?.shortDetail||event.status?.type?.shortDetail||'À venir'),favorite,source:'ESPN ('+league.name+')'});
     count++;
    }
   }
   if(!count)notes.push('Pas de match trouvé pour '+league.name+' sur la période consultée.');
  }catch(e){notes.push('ESPN '+league.name+' inaccessible : '+String(e.message||e));}
 }));
 return {events:result,notes};
}
function newsHtml(){if(!workerUrl)return `<div class="notice">Configure le relais gratuit Cloudflare Worker dans Réglages pour obtenir les titres directement dans l'application. En attendant, les liens Google Actualités ci-dessous fonctionnent.</div>`;if(loading&&!news.length)return '<p class="muted">Chargement des articles…</p>';return news.length?news.map(n=>`<article class="card"><span class="tag">${esc(n.favorite)}</span><h3><a href="${esc(safeUrl(n.link))}" rel="noopener noreferrer" target="_blank">${esc(n.title)}</a></h3><small>${esc(n.source)} • ${esc(date(n.date))}</small></article>`).join(''):'<p class="muted">Aucun article récupéré pour le moment. Essaie de rafraîchir ou d’utiliser les recherches directes.</p>'}
function linkHtml(f){const q=encodeURIComponent(f.name);return `<div class="fav"><div class="details"><b>${esc(f.name)}</b><br><small>${esc(f.sport)} · ${esc(f.type)}</small></div><a target="_blank" rel="noopener noreferrer" href="https://news.google.com/search?q=${q}&hl=fr&gl=FR&ceid=FR%3Afr">Actualités ↗</a></div>`}
function render(){let sports=['Tous',...new Set(favorites.map(f=>f.sport))];app.innerHTML=`<main class="wrap"><header><div><div class="eyebrow">Ton tableau de bord personnel</div><h1>⚡ Mon Sport</h1></div><button id="refresh" class="button" ${loading?'disabled':''}>${loading?'Actualisation…':'↻ Actualiser'}</button></header><section class="hero"><h2>Bienvenue dans ton espace sportif 👋</h2><p>Retrouve tes équipes, tes sportifs, leurs résultats disponibles et l'actualité gratuite — au même endroit.</p><div class="stats"><div class="stat"><strong>${favorites.length}</strong><small>Favoris</small></div><div class="stat"><strong>${new Set(favorites.map(f=>f.sport)).size}</strong><small>Sports</small></div><div class="stat"><strong>${matches.length}</strong><small>Événements</small></div></div></section><nav class="tabs">${tabs.map(([id,label])=>`<button data-tab="${id}" class="${id===active?'active':''}">${label}</button>`).join('')}</nav><div id="content">${content()}</div><footer class="muted" style="text-align:center;margin:26px 0;font-size:.8rem">Mon Sport • V1 gratuite • Scores non exhaustifs • Articles provenant de sources externes</footer></main>`;document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>{active=el.dataset.tab;search='';sportFilter='Tous';render()});document.querySelector('#refresh').onclick=refresh;bindContent()}
function content(){if(active==='accueil')return `<section class="panel"><div class="row"><h2>🏆 Derniers résultats disponibles</h2><button class="button ghost" data-goto="resultats">Voir tout</button></div>${resultHtml()}</section><section class="panel"><div class="row"><h2>📰 Actualités récentes</h2><button class="button ghost" data-goto="actualites">Voir tout</button></div>${newsHtml()}</section><section class="panel"><h2>⭐ Accès rapide aux favoris</h2>${favorites.slice(0,6).map(linkHtml).join('')}</section>`;
if(active==='resultats')return `<section class="panel"><h2>🏆 Résultats et prochains matchs</h2><p class="sub">Scores réels provenant de TheSportsDB lorsqu'ils sont disponibles. Les sportifs individuels et certaines compétitions ne sont pas encore pris en charge.</p>${resultHtml()}</section><section class="panel"><h2>🔎 Rechercher un résultat sur le web</h2>${favorites.map(f=>`<div class="fav"><span class="details">${esc(f.name)}</span><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?q=${encodeURIComponent(f.name+' dernier résultat sportif')}">Voir ↗</a></div>`).join('')}</section>`;
if(active==='actualites')return `<section class="panel"><h2>📰 Articles liés à mes favoris</h2><p class="sub">Les liens vers les articles s'ouvrent chez leurs éditeurs. Certains médias peuvent afficher un paywall : la gratuité de chaque article n'est pas garantie.</p>${newsHtml()}</section><section class="panel"><h2>🔎 Rechercher directement dans Google Actualités</h2>${favorites.map(linkHtml).join('')}</section>`;
if(active==='favoris')return `<section class="panel"><h2>➕ Ajouter un favori</h2><form id="addform"><input name="name" placeholder="Nom de l'équipe ou du sportif" maxlength="100" required/><select name="sport">${['Football','Tennis','Rugby','Basketball','Cyclisme','Natation','Tennis de table','Autre'].map(s=>`<option>${s}</option>`).join('')}</select><select name="type"><option value="sportif">Sportif</option><option value="équipe">Équipe</option></select><input name="apiName" placeholder="Nom API (facultatif)" maxlength="100"/><button class="button" type="submit">Ajouter aux favoris</button></form></section><section class="panel"><h2>⭐ Mes favoris (${favorites.length})</h2><select id="sportFilter">${sports.map(s=>`<option ${sportFilter===s?'selected':''}>${esc(s)}</option>`).join('')}</select><input class="search" id="search" value="${esc(search)}" placeholder="Rechercher un favori"/><div id="favoriteList">${favoriteRows()}</div></section>`;
return `<section class="panel"><h2>⚙️ Paramétrage des données</h2><p>Renseigne l'URL publique de ton Cloudflare Worker pour activer les articles et scores intégrés. Sans Worker, les favoris et liens d'actualités fonctionnent quand même.</p><form id="settingsform"><input id="workerUrl" style="grid-column:1/-1" type="url" placeholder="https://mon-sport-api.nom.workers.dev" value="${esc(workerUrl)}"/><button class="button" type="submit">Enregistrer et actualiser</button></form><p class="sub">Adresse https uniquement. Aucune donnée personnelle n'est envoyée à notre serveur : seules les recherches sur tes favoris sont transmises aux services sportifs et d'actualités.</p></section><section class="panel"><h2>📦 Exporter / importer mes favoris</h2><div class="actions"><button id="export" class="button ghost">Exporter JSON</button><label class="button ghost" style="cursor:pointer">Importer JSON <input id="import" type="file" accept="application/json" hidden/></label><button id="reset" class="button ghost danger">Réinitialiser</button></div><p class="sub">Tes favoris sont stockés uniquement dans ce navigateur. Un export permet de les sauvegarder.</p></section>`}
function favoriteRows(){return filtered().map(f=>`<div class="fav"><div class="details"><b>${esc(f.name)}</b><br><small>${esc(f.sport)} · ${esc(f.type)}</small></div><button class="button ghost danger" data-remove="${esc(f.id)}" aria-label="Supprimer ${esc(f.name)}">✕</button></div>`).join('')||'<div class="empty">Aucun favori correspondant</div>'}
function bindContent(){document.querySelectorAll('[data-goto]').forEach(e=>e.onclick=()=>{active=e.dataset.goto;render()});document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()});const add=document.querySelector('#addform');if(add)add.onsubmit=e=>{e.preventDefault();const data=new FormData(add),name=String(data.get('name')).trim();if(!name)return;favorites.push({id:crypto.randomUUID(),name,sport:data.get('sport'),type:data.get('type'),apiName:String(data.get('apiName')).trim()||name});save();render()};const sf=document.querySelector('#sportFilter');if(sf)sf.onchange=()=>{sportFilter=sf.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const input=document.querySelector('#search');if(input)input.oninput=()=>{search=input.value;document.querySelector('#favoriteList').innerHTML=favoriteRows();bindRemove()};const settings=document.querySelector('#settingsform');if(settings)settings.onsubmit=e=>{e.preventDefault();const val=document.querySelector('#workerUrl').value.trim().replace(/\/$/,'');if(val&&!/^https:\/\/[^\s]+$/.test(val)){alert('Une URL HTTPS valide est nécessaire.');return}workerUrl=val;localStorage.setItem(URL_KEY,workerUrl);active='accueil';news=[];matches=[];render();refresh()};const ex=document.querySelector('#export');if(ex)ex.onclick=()=>{const blob=new Blob([JSON.stringify(favorites,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mes-favoris-sport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};const imp=document.querySelector('#import');if(imp)imp.onchange=async()=>{try{const data=JSON.parse(await imp.files[0].text());if(!Array.isArray(data)||data.some(f=>typeof f.name!=='string'||typeof f.sport!=='string'||!['équipe','sportif'].includes(f.type)))throw Error('Format invalide');favorites=data.slice(0,200).map(f=>({id:crypto.randomUUID(),name:f.name.slice(0,100),sport:f.sport.slice(0,50),type:f.type,apiName:String(f.apiName||f.name).slice(0,100)}));save();render()}catch(e){alert('Import impossible : '+e.message)}};const reset=document.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('Réinitialiser tous les favoris ?')){favorites=DEFAULTS.map(f=>({...f,id:crypto.randomUUID()}));save();render()}}}
function bindRemove(){document.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{favorites=favorites.filter(f=>f.id!==e.dataset.remove);save();render()})}
async function request(path,params){const u=new URL(workerUrl+path);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));const response=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);return response.json()}
async function refresh(){
 if(loading)return;
 loading=true;errors=[];scoreNotes=[];render();
 try{
  const espnTask=espnResults();
  const teams=workerUrl?favorites.filter(f=>f.type==='équipe').slice(0,12):[];
  const articles=workerUrl?favorites.slice(0,18):[];
  const tasks=[...teams.map(async f=>{
   try{
    const d=await request('/api/team',{name:f.apiName||f.name});
    return {favorite:f.name,events:(d.events||[]).map(e=>({...e,favorite:f.name,source:'TheSportsDB'})),note:d.note||''};
   }catch(e){return {favorite:f.name,events:[],note:'API TheSportsDB indisponible : '+e.message}}
  }),...articles.map(async f=>{
   try{const d=await request('/api/news',{q:f.name+' '+f.sport});return (d.articles||[]).slice(0,2).map(a=>({...a,favorite:f.name}))}
   catch{return []}
  })];
  const [espn,all]=await Promise.all([espnTask,Promise.all(tasks)]);
  scoreNotes.push(...espn.notes);
  const teamData=all.slice(0,teams.length);
  // La limite gratuite peut renvoyer un unique match à domicile : afficher le diagnostic.
  for(const d of teamData){if(!d.events.length)scoreNotes.push(d.favorite+' : '+(d.note||'aucun match dans TheSportsDB'));}
  const merged=[...espn.events,...teamData.flatMap(d=>d.events)];
  const seen=new Set();
  matches=merged.filter(m=>m.home&&m.away).filter(m=>{
   const key=[m.favorite,m.home.toLowerCase(),m.away.toLowerCase(),String(m.date||'').slice(0,10)].join('|');
   if(seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,40);
  news=all.slice(teams.length).flat().filter(a=>a.title&&a.link).filter((a,i,array)=>array.findIndex(b=>b.link===a.link)===i).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,40);
  if(!workerUrl)scoreNotes.push('Configure le Worker dans Réglages pour compléter avec TheSportsDB et les actualités.');
  if(workerUrl&&!news.length)errors.push('Aucune actualité reçue du relais.');
  if(!matches.length&&!scoreNotes.length)scoreNotes.push('Aucune donnée renvoyée par les sources gratuites.');
 }catch(e){errors.push('Actualisation impossible : '+String(e.message||e))}
 finally{loading=false;render()}
}
render();refresh();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

