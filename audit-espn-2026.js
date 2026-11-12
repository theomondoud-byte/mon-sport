// Audit annuel ESPN à la demande (jamais au chargement automatique du téléphone).
// Compte UNIQUEMENT les rencontres terminées du 1er janvier au 12 novembre 2026
// (ou à la date actuelle si elle est antérieure). Ne compte pas les sportifs
// individuels : l'équipe jouant ne prouve pas la participation de Mbappé/Wembanyama.
const CACHE='monsport-year-espn-2026-v6:';
const YEAR=2026, BASE='https://site.api.espn.com/apis/site/v2/sports/';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const score=c=>{const v=c?.score;return v===null||v===undefined?'?':String(typeof v==='object'?v.displayValue??v.value??'?':v);};
export async function auditEspn2026(favorites,leagues,onProgress=()=>{},now=new Date()){
 const keys=favorites.filter(f=>f.type==='équipe').map(f=>f.name).sort();
 const cacheKey=CACHE+keys.join('|');
 try{
  const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');
  if(cached&&Date.now()-cached.saved<24*3600*1000){onProgress(1,1);return cached;}
 }catch{}
 const cutoff=Math.min(Date.parse('2026-12-31T23:59:59Z'),now.getTime());
 const finalMonth=new Date(cutoff).getUTCMonth()+1;
 const months=Array.from({length:Math.max(0,finalMonth)},(_,i)=>'2026'+String(i+1).padStart(2,'0'));
 const eligible=leagues.filter(l=>!l.url.startsWith('rugby/')&&l.teams.some(([team])=>keys.includes(team)));
 const tasks=eligible.flatMap(league=>months.map(month=>({league,month})));
 const results=[],issues=[];
 async function get(task){
  const url=BASE+task.league.url+'/scoreboard?dates='+task.month;
  const req=async url=>{const response=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('HTTP '+response.status);const json=await response.json();if(!Array.isArray(json.events))throw Error('events manquant');return json.events;};
  let events;
  try{events=await req(url+'&limit=500');}
  catch(err){if(String(err).includes('HTTP 400'))events=await req(url);else throw err;}
  return {league:task.league,month:task.month,events};
 }
 for(let index=0;index<tasks.length;index+=4){
  const batch=await Promise.allSettled(tasks.slice(index,index+4).map(get));
  batch.forEach((r,j)=>{
   const task=tasks[index+j];
   if(r.status==='fulfilled')results.push(r.value);
   else issues.push({competition:task.league.name,month:task.month,error:String(r.reason).slice(0,100)});
  });
  onProgress(Math.min(index+4,tasks.length),tasks.length);
 }
 const lookup={};const seen={};
 const completeMonths={};
 for(const league of eligible)completeMonths[league.name]={ok:0,total:months.length};
 for(const item of results){
  completeMonths[item.league.name].ok++;
  for(const ev of item.events){
   const c=ev.competitions?.[0];
   const status=c?.status?.type||ev.status?.type||{};
   if(status.completed!==true&&status.state!=='post')continue;
   const date=ev.date||c?.date||'';
   const ms=Date.parse(date);
   if(!Number.isFinite(ms)||ms>Date.parse('2026-12-31T23:59:59Z')||ms>cutoff||ms<Date.parse('2026-01-01T00:00:00Z'))continue;
   const comps=c?.competitors||[];
   if(comps.length<2)continue;
   const home=comps.find(x=>x.homeAway==='home')||comps[0];
   const away=comps.find(x=>x.homeAway==='away')||comps[1];
   const h=home.team?.displayName||home.team?.name||'';
   const a=away.team?.displayName||away.team?.name||'';
   const id=String(ev.id||'');
   for(const [fav,matchRegex] of item.league.teams){
    if(!keys.includes(fav)||![h,a].some(n=>matchRegex.test(n)))continue;
    const opp=matchRegex.test(h)?a:h;
    // Même match présent dans plusieurs calendriers -> une seule rencontre.
    const dedupe=fav+'|'+date.slice(0,10)+'|'+norm(opp);
    seen[fav]??=new Set();
    if(seen[fav].has(dedupe))continue;
    seen[fav].add(dedupe);
    lookup[fav]??=[];
    lookup[fav].push({
      id:'espn-year-'+fav+'-'+id,date,favorite:fav,
      opponent:opp,competition:item.league.name,
      score:score(home)+'-'+score(away),
      status:'Terminé',source:'ESPN',
      sourceUrl:fav==='PSG'?'https://www.psg.fr/equipes/equipe-premiere/calendrier':fav==='Real Madrid'?'https://www.realmadrid.com/fr-FR/football/equipe-premiere/calendrier':fav==='San Antonio Spurs'?'https://www.nba.com/spurs/schedule':'https://www.fff.fr',
      outcome:null,type:'team'
    });
   }
  }
 }
 const byFavorite={};
 for(const [name,events] of Object.entries(lookup)){
   events.sort((a,b)=>b.date.localeCompare(a.date));
   byFavorite[name]={count:events.length,events};
 }
 // Même avec tous les mois OK, ESPN peut ne pas indexer une compétition.
 const answer={byFavorite,issues,completeMonths,totalQueries:tasks.length,successfulQueries:results.length,saved:Date.now()};
 try{localStorage.setItem(cacheKey,JSON.stringify(answer));}catch{}
 return answer;
}
